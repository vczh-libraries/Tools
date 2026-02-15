import * as http from "node:http";
import type { ICopilotSession } from "copilot-api";
import type { Entry, Task, Prompt } from "./jobsData.js";
import { expandPromptDynamic, runtimeVariables } from "./jobsData.js";
import {
    helperSessionStart,
    helperSessionStop,
    helperGetSession,
    jsonResponse,
} from "./copilotApi.js";
import {
    readBody,
    pushResponse,
    waitForResponse,
    type LiveState,
    type LiveResponse,
} from "./sharedApi.js";

// ---- Types ----

export interface ICopilotTask {
    readonly drivingSession: ICopilotSession;
    readonly status: "Executing" | "Succeeded" | "Failed";
    stop(): void;
}

export interface ICopilotTaskCallback {
    taskSucceeded(): void;
    taskFailed(): void;
    taskSessionStarted(taskSession: [ICopilotSession, string] | undefined): void;
    taskSessionStopped(taskSession: [ICopilotSession, string] | undefined, succeeded: boolean): void;
}

// ---- Entry Management ----

let installedEntry: Entry | null = null;

export async function installJobsEntry(entry: Entry): Promise<void> {
    if (installedEntry !== null) {
        throw new Error("installJobsEntry has already been called.");
    }
    installedEntry = entry;
}

// For testing: reset the installed entry
export function resetJobsEntry(): void {
    installedEntry = null;
}

// ---- Task State ----

interface TaskState extends LiveState {
    taskId: string;
    task: ICopilotTask;
    taskError: string | null;
    forcedSingleSession: boolean;
}

const tasks = new Map<string, TaskState>();
let nextTaskId = 1;

// ---- Runtime Variable Helpers ----

function buildRuntimeValues(runtimeValues: Record<string, string>): Record<string, string> {
    // Build a copy with keys matching what expandPromptDynamic expects (without $ prefix)
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(runtimeValues)) {
        values[key] = value;
    }
    return values;
}

function expandPrompt(entry: Entry, prompt: Prompt, runtimeValues: Record<string, string>): string {
    const result = expandPromptDynamic(entry, prompt, runtimeValues);
    return result[0];
}

// ---- Tool Monitoring ----

interface ToolMonitor {
    toolsCalled: Set<string>;
    booleanResult: boolean | null;
    cleanup: () => void;
}

function monitorSessionTools(session: ICopilotSession, runtimeValues: Record<string, string>): ToolMonitor {
    const toolsCalled = new Set<string>();
    let booleanResult: boolean | null = null;

    const raw = session.rawSection;

    const onToolStart = (event: { data: { toolName: string; arguments?: unknown } }) => {
        const toolName = event.data.toolName;
        toolsCalled.add(toolName);

        // Extract argument as string
        let argStr = "";
        if (event.data.arguments) {
            if (typeof event.data.arguments === "string") {
                argStr = event.data.arguments;
            } else if (typeof event.data.arguments === "object") {
                const values = Object.values(event.data.arguments as Record<string, unknown>);
                const strVal = values.find(v => typeof v === "string");
                argStr = strVal ? String(strVal) : JSON.stringify(event.data.arguments);
            }
        }

        if (toolName === "job_prepare_document") {
            // Only keep first line and trim spaces
            const lines = argStr.split("\n");
            runtimeValues["reported-document"] = lines[0].trim();
        } else if (toolName === "job_boolean_true") {
            runtimeValues["reported-true-reason"] = argStr;
            delete runtimeValues["reported-false-reason"];
            booleanResult = true;
        } else if (toolName === "job_boolean_false") {
            runtimeValues["reported-false-reason"] = argStr;
            delete runtimeValues["reported-true-reason"];
            booleanResult = false;
        }
    };

    raw.on("tool.execution_start", onToolStart);

    return {
        toolsCalled,
        get booleanResult() { return booleanResult; },
        set booleanResult(v: boolean | null) { booleanResult = v; },
        cleanup() {
            raw.removeListener("tool.execution_start", onToolStart);
        },
    } as ToolMonitor;
}

// ---- startTask ----

export async function startTask(
    taskName: string,
    drivingSession: ICopilotSession,
    forceSingleSessionMode: boolean,
    callback: ICopilotTaskCallback,
    userInput?: string
): Promise<ICopilotTask> {
    if (!installedEntry) {
        throw new Error("installJobsEntry has not been called.");
    }

    const entry = installedEntry;
    const task = entry.tasks[taskName];
    if (!task) {
        throw new Error(`Task "${taskName}" not found.`);
    }

    // Determine model option
    const criteria = task.criteria as { condition?: Prompt; runConditionInSameSession?: boolean; toolExecuted?: string[]; failureAction: unknown } | undefined;
    const singleSession = forceSingleSessionMode ||
        !criteria ||
        criteria.runConditionInSameSession === undefined ||
        criteria.runConditionInSameSession === true;

    // Initialize runtime variables
    const runtimeValues: Record<string, string> = {};
    if (userInput !== undefined) {
        runtimeValues["user-input"] = userInput;
    }

    let status: "Executing" | "Succeeded" | "Failed" = "Executing";
    let stopped = false;
    let taskSession: [ICopilotSession, string] | undefined = undefined;

    const copilotTask: ICopilotTask = {
        get drivingSession() { return drivingSession; },
        get status() { return status; },
        stop() {
            if (stopped) return;
            stopped = true;
            status = "Failed";
            // Stop task session if it exists and is different from driving session
            if (taskSession) {
                helperSessionStop(taskSession[0]).catch(() => { /* ignore */ });
            }
        },
    };

    // Start task execution in background
    (async () => {
        try {
            // Determine task model
            let taskModelId: string | undefined;
            if (task.model) {
                taskModelId = (entry.models as Record<string, unknown>)[task.model] as string;
            }

            // Create task session if double model mode
            let taskSessionObj: ICopilotSession;
            if (singleSession) {
                taskSessionObj = drivingSession;
                callback.taskSessionStarted(undefined);
            } else {
                const drivingModelId = entry.models.driving;
                if (!taskModelId) {
                    taskModelId = drivingModelId;
                }
                const [session, sessionId] = await helperSessionStart(taskModelId);
                taskSession = [session, sessionId];
                taskSessionObj = session;
                callback.taskSessionStarted(taskSession);
            }

            if (stopped) return;

            // Check availability
            if (task.availability) {
                const available = await checkAvailability(entry, task, drivingSession, runtimeValues);
                if (!available) {
                    status = "Failed";
                    if (taskSession) {
                        await helperSessionStop(taskSession[0]);
                        callback.taskSessionStopped(taskSession, false);
                    } else {
                        callback.taskSessionStopped(undefined, false);
                    }
                    callback.taskFailed();
                    return;
                }
            }

            if (stopped) return;

            // Execute the task
            const taskPromptText = expandPrompt(entry, task.prompt, runtimeValues);

            // Monitor tools during task execution
            const monitor = monitorSessionTools(taskSessionObj, runtimeValues);
            let sessionCrashed = false;
            try {
                await taskSessionObj.sendRequest(taskPromptText);
            } catch (err) {
                sessionCrashed = true;
                monitor.cleanup();
                status = "Failed";
                if (taskSession) {
                    await helperSessionStop(taskSession[0]).catch(() => {});
                    callback.taskSessionStopped(taskSession, false);
                } else {
                    callback.taskSessionStopped(undefined, false);
                }
                callback.taskFailed();
                return;
            }
            monitor.cleanup();

            if (stopped) return;

            // Check criteria
            if (criteria) {
                const succeeded = await checkCriteria(
                    entry, task, criteria, drivingSession, taskSessionObj,
                    taskSession, runtimeValues, monitor.toolsCalled, singleSession, callback
                );
                if (succeeded) {
                    status = "Succeeded";
                    if (taskSession) {
                        await helperSessionStop(taskSession[0]);
                        callback.taskSessionStopped(taskSession, true);
                    } else {
                        callback.taskSessionStopped(undefined, true);
                    }
                    callback.taskSucceeded();
                } else {
                    status = "Failed";
                    if (taskSession) {
                        await helperSessionStop(taskSession[0]).catch(() => {});
                        callback.taskSessionStopped(taskSession, false);
                    } else {
                        callback.taskSessionStopped(undefined, false);
                    }
                    callback.taskFailed();
                }
            } else {
                // No criteria = success
                status = "Succeeded";
                if (taskSession) {
                    await helperSessionStop(taskSession[0]);
                    callback.taskSessionStopped(taskSession, true);
                } else {
                    callback.taskSessionStopped(undefined, true);
                }
                callback.taskSucceeded();
            }
        } catch (err) {
            status = "Failed";
            if (taskSession) {
                helperSessionStop(taskSession[0]).catch(() => {});
                callback.taskSessionStopped(taskSession, false);
            } else {
                callback.taskSessionStopped(undefined, false);
            }
            callback.taskFailed();
        }
    })();

    return copilotTask;
}

// ---- Availability Check ----

async function checkAvailability(
    entry: Entry,
    task: Task,
    drivingSession: ICopilotSession,
    runtimeValues: Record<string, string>
): Promise<boolean> {
    const availability = task.availability;
    if (!availability) return true;

    // Check condition (the main runtime check)
    if (availability.condition) {
        const conditionPrompt = expandPrompt(entry, availability.condition, runtimeValues);
        const monitor = monitorSessionTools(drivingSession, runtimeValues);
        try {
            await drivingSession.sendRequest(conditionPrompt);
        } catch {
            monitor.cleanup();
            return false;
        }
        monitor.cleanup();
        if (monitor.booleanResult !== true) {
            return false;
        }
    }

    return true;
}

// ---- Criteria Check ----

async function checkCriteria(
    entry: Entry,
    task: Task,
    criteria: { condition?: Prompt; runConditionInSameSession?: boolean; toolExecuted?: string[]; failureAction: unknown },
    drivingSession: ICopilotSession,
    taskSessionObj: ICopilotSession,
    taskSession: [ICopilotSession, string] | undefined,
    runtimeValues: Record<string, string>,
    toolsCalled: Set<string>,
    singleSession: boolean,
    callback: ICopilotTaskCallback,
): Promise<boolean> {
    // Check toolExecuted
    if (criteria.toolExecuted) {
        for (const tool of criteria.toolExecuted) {
            if (!toolsCalled.has(tool)) {
                return false;
            }
        }
    }

    // Check condition
    if (criteria.condition) {
        const conditionPrompt = expandPrompt(entry, criteria.condition, runtimeValues);
        const monitor = monitorSessionTools(drivingSession, runtimeValues);
        try {
            await drivingSession.sendRequest(conditionPrompt);
        } catch {
            monitor.cleanup();
            return false;
        }
        monitor.cleanup();

        if (monitor.booleanResult === true) {
            return true;
        }

        // Condition failed - check for failure action with retry
        const failureAction = criteria.failureAction as
            | ["RetryWithNewSession", number]
            | ["RetryWithUserPrompt", number, Prompt]
            | undefined;

        if (failureAction && criteria.runConditionInSameSession !== undefined) {
            if (failureAction[0] === "RetryWithNewSession") {
                const maxRetries = failureAction[1];
                for (let i = 0; i < maxRetries; i++) {
                    // Stop old task session and create new one
                    if (taskSession) {
                        await helperSessionStop(taskSession[0]).catch(() => {});
                        callback.taskSessionStopped(taskSession, false);
                    }

                    let taskModelId: string | undefined;
                    if (task.model) {
                        taskModelId = (entry.models as Record<string, unknown>)[task.model] as string;
                    }
                    if (!taskModelId) {
                        taskModelId = entry.models.driving;
                    }

                    const [newSession, newSessionId] = await helperSessionStart(taskModelId);
                    taskSession = [newSession, newSessionId];
                    taskSessionObj = newSession;
                    callback.taskSessionStarted(taskSession);

                    // Re-execute task
                    const taskPromptText = expandPrompt(entry, task.prompt, runtimeValues);
                    const retryMonitor = monitorSessionTools(taskSessionObj, runtimeValues);
                    try {
                        await taskSessionObj.sendRequest(taskPromptText);
                    } catch {
                        retryMonitor.cleanup();
                        continue;
                    }
                    retryMonitor.cleanup();

                    // Re-check condition
                    const condMonitor = monitorSessionTools(drivingSession, runtimeValues);
                    const retryCondPrompt = expandPrompt(entry, criteria.condition!, runtimeValues);
                    try {
                        await drivingSession.sendRequest(retryCondPrompt);
                    } catch {
                        condMonitor.cleanup();
                        continue;
                    }
                    condMonitor.cleanup();

                    if (condMonitor.booleanResult === true) {
                        return true;
                    }
                }
                return false;
            } else if (failureAction[0] === "RetryWithUserPrompt") {
                const maxRetries = failureAction[1];
                const retryPromptTemplate = failureAction[2];
                for (let i = 0; i < maxRetries; i++) {
                    // Send retry prompt to the SAME task session
                    const retryPromptText = expandPrompt(entry, retryPromptTemplate, runtimeValues);
                    const retryMonitor = monitorSessionTools(taskSessionObj, runtimeValues);
                    try {
                        await taskSessionObj.sendRequest(retryPromptText);
                    } catch {
                        retryMonitor.cleanup();
                        continue;
                    }
                    retryMonitor.cleanup();

                    // Re-check condition
                    const condMonitor = monitorSessionTools(drivingSession, runtimeValues);
                    const retryCondPrompt = expandPrompt(entry, criteria.condition!, runtimeValues);
                    try {
                        await drivingSession.sendRequest(retryCondPrompt);
                    } catch {
                        condMonitor.cleanup();
                        continue;
                    }
                    condMonitor.cleanup();

                    if (condMonitor.booleanResult === true) {
                        return true;
                    }
                }
                return false;
            }
        }

        return false;
    }

    return true;
}

// ---- API Handlers ----

export async function apiTaskStart(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    taskName: string,
    sessionId: string,
): Promise<void> {
    const session = helperGetSession(sessionId);
    if (!session) {
        jsonResponse(res, 200, { error: "SessionNotFound" });
        return;
    }

    const body = await readBody(req);
    const userInput = body;

    try {
        const taskId = `task-${nextTaskId++}`;
        const state: TaskState = {
            taskId,
            task: null as unknown as ICopilotTask,
            responseQueue: [],
            waitingResolve: null,
            taskError: null,
            forcedSingleSession: true,
        };

        const taskCallback: ICopilotTaskCallback = {
            taskSucceeded() {
                pushResponse(state, { callback: "taskSucceeded" });
                // Auto-cleanup after task finishes
                tasks.delete(taskId);
            },
            taskFailed() {
                pushResponse(state, { callback: "taskFailed" });
                // Auto-cleanup after task finishes
                tasks.delete(taskId);
            },
            taskSessionStarted(taskSession: [ICopilotSession, string] | undefined) {
                if (taskSession) {
                    pushResponse(state, { callback: "taskSessionStarted", taskSession: [taskSession[1]] });
                } else {
                    pushResponse(state, { callback: "taskSessionStarted" });
                }
            },
            taskSessionStopped(taskSession: [ICopilotSession, string] | undefined, succeeded: boolean) {
                if (taskSession) {
                    pushResponse(state, { callback: "taskSessionStopped", taskSession: [taskSession[1]], succeeded });
                } else {
                    pushResponse(state, { callback: "taskSessionStopped", succeeded });
                }
            },
        };

        const copilotTask = await startTask(taskName, session, true, taskCallback, userInput);
        state.task = copilotTask;
        tasks.set(taskId, state);
        jsonResponse(res, 200, { taskId });
    } catch (err) {
        jsonResponse(res, 200, { taskError: String(err) });
    }
}

export async function apiTaskStop(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    taskId: string,
): Promise<void> {
    const state = tasks.get(taskId);
    if (!state) {
        jsonResponse(res, 200, { error: "TaskNotFound" });
        return;
    }
    if (state.forcedSingleSession) {
        jsonResponse(res, 200, { error: "TaskCannotClose" });
        return;
    }
    state.task.stop();
    tasks.delete(taskId);
    if (state.waitingResolve) {
        const resolve = state.waitingResolve;
        state.waitingResolve = null;
        resolve({ error: "TaskNotFound" });
    }
    jsonResponse(res, 200, { result: "Closed" });
}

export async function apiTaskLive(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    taskId: string,
): Promise<void> {
    const state = tasks.get(taskId);
    if (!state) {
        jsonResponse(res, 200, { error: "TaskNotFound" });
        return;
    }
    if (state.waitingResolve) {
        jsonResponse(res, 200, { error: "ParallelCallNotSupported" });
        return;
    }
    const response = await waitForResponse(state, 5000);
    if (response === null) {
        jsonResponse(res, 200, { error: "HttpRequestTimeout" });
    } else if (state.taskError) {
        jsonResponse(res, 200, { taskError: state.taskError });
    } else {
        jsonResponse(res, 200, response);
    }
}

// ---- Entry Export ----

export { entry } from "./jobsData.js";
