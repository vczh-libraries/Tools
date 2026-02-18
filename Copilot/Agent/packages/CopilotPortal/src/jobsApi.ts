import * as http from "node:http";
import * as path from "node:path";
import * as fs from "node:fs";
import type { ICopilotSession } from "./copilotSession.js";
import type { Entry, Task, Prompt, Job, Work, TaskWork, SequentialWork, ParallelWork, LoopWork, AltWork } from "./jobsDef.js";
import { expandPromptDynamic, getModelId } from "./jobsDef.js";
import { generateChartNodes } from "./jobsChart.js";
import {
    helperSessionStart,
    helperSessionStop,
    helperGetSession,
    helperPushSessionResponse,
    hasRunningSessions,
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
    taskDecision(reason: string): void;
    taskSessionStarted(taskSession: [ICopilotSession, string] | undefined): void;
    taskSessionStopped(taskSession: [ICopilotSession, string] | undefined, succeeded: boolean): void;
}

export interface ICopilotJob {
    get runningWorkIds(): number[];
    get status(): "Executing" | "Succeeded" | "Failed";
    stop(): void;
}

export interface ICopilotJobCallback {
    jobSucceeded(): void;
    jobFailed(): void;
    workStarted(workId: number, taskId: string): void;
    workStopped(workId: number, succeeded: boolean): void;
}

// ---- Entry Management ----

let installedEntry: Entry | null = null;

export async function installJobsEntry(entryValue: Entry): Promise<void> {
    if (hasRunningSessions()) {
        throw new Error("Cannot call installJobsEntry while sessions are running.");
    }
    installedEntry = entryValue;
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

// ---- Session Crash Retry ----

export const SESSION_CRASH_PREFIX = "The session crashed, please redo and here is the last request:\n";

const MAX_CRASH_RETRIES = 3;

/**
 * Sends a prompt to a session with crash retry logic.
 * If the session crashes after submitting the prompt, resend up to MAX_CRASH_RETRIES consecutive times.
 * On resend, prefix the prompt with SESSION_CRASH_PREFIX.
 * If all retries fail, throws the last error.
 * Also pushes onGeneratedUserPrompt to the driving session's response queue.
 */
async function sendPromptWithCrashRetry(
    session: ICopilotSession,
    prompt: string,
    drivingCallback: ICopilotTaskCallback
): Promise<void> {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_CRASH_RETRIES; attempt++) {
        const actualPrompt = attempt === 0 ? prompt : SESSION_CRASH_PREFIX + prompt;
        try {
            helperPushSessionResponse(session, { callback: "onGeneratedUserPrompt", prompt: actualPrompt });
            await session.sendRequest(actualPrompt);
            return; // Success
        } catch (err) {
            drivingCallback.taskDecision(`Task execution crashed: ${String(err)}`);
            lastError = err;
            // Will retry on next iteration
        }
    }
    throw lastError; // All retries exhausted
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
    let active = true;

    const raw = session.rawSection;

    const onToolStart = (event: { data: { toolName: string; arguments?: unknown } }) => {
        if (!active) return;
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
            active = false;
        },
    } as ToolMonitor;
}

// ---- startTask ----

export async function startTask(
    taskName: string,
    userInput: string,
    drivingSession: ICopilotSession,
    forceSingleSessionMode: boolean,
    ignorePrerequisiteCheck: boolean,
    callback: ICopilotTaskCallback,
    taskModelIdOverride?: string,
    workingDirectory?: string
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
    if (userInput) {
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
    const executionPromise = (async () => {
        try {
            // Determine task model
            let taskModelId: string | undefined;
            if (taskModelIdOverride) {
                taskModelId = taskModelIdOverride;
            } else if (task.model) {
                taskModelId = getModelId(task.model, entry);
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
                const [session, sessionId] = await helperSessionStart(taskModelId, workingDirectory);
                taskSession = [session, sessionId];
                taskSessionObj = session;
                callback.taskSessionStarted(taskSession);
                callback.taskDecision(`Started task session with model ${taskModelId}`);
            }

            if (stopped) return;

            // Check availability
            if (task.availability && !ignorePrerequisiteCheck) {
                const available = await checkAvailability(entry, task, drivingSession, runtimeValues, callback);
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
            try {
                await sendPromptWithCrashRetry(taskSessionObj, taskPromptText, callback);
            } catch (err) {
                monitor.cleanup();
                callback.taskDecision(`Task execution crashed: ${String(err)}`);
                throw err; // Session crashed - let outer catch handle
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
                    callback.taskDecision("Decision: task succeeded");
                    if (taskSession) {
                        await helperSessionStop(taskSession[0]);
                        callback.taskSessionStopped(taskSession, true);
                    } else {
                        callback.taskSessionStopped(undefined, true);
                    }
                    callback.taskSucceeded();
                } else {
                    status = "Failed";
                    callback.taskDecision("Decision: task failed (criteria not satisfied)");
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
                callback.taskDecision("Decision: task succeeded (no criteria)");
                if (taskSession) {
                    await helperSessionStop(taskSession[0]);
                    callback.taskSessionStopped(taskSession, true);
                } else {
                    callback.taskSessionStopped(undefined, true);
                }
                callback.taskSucceeded();
            }
        } catch (err) {
            if (status === "Executing") {
                status = "Failed";
            }
            (copilotTask as any)._crashError = err;
            callback.taskDecision(`Task error: ${String(err)}`);
            if (taskSession) {
                helperSessionStop(taskSession[0]).catch(() => {});
                callback.taskSessionStopped(taskSession, false);
            } else {
                callback.taskSessionStopped(undefined, false);
            }
            callback.taskFailed();
            throw err; // Don't consume silently
        }
    })();

    (copilotTask as any)._executionPromise = executionPromise;
    executionPromise.catch(() => {}); // Prevent unhandled rejection; callers should handle

    return copilotTask;
}

// ---- Availability Check ----

async function checkAvailability(
    entry: Entry,
    task: Task,
    drivingSession: ICopilotSession,
    runtimeValues: Record<string, string>,
    callback: ICopilotTaskCallback
): Promise<boolean> {
    const availability = task.availability;
    if (!availability) return true;

    // Check condition (the main runtime check)
    if (availability.condition) {
        const conditionPrompt = expandPrompt(entry, availability.condition, runtimeValues);
        const monitor = monitorSessionTools(drivingSession, runtimeValues);
        try {
            await sendPromptWithCrashRetry(drivingSession, conditionPrompt, callback);
        } catch (err) {
            monitor.cleanup();
            callback.taskDecision(`Availability check crashed: ${String(err)}`);
            throw err; // Session crashed - don't consume silently
        }
        monitor.cleanup();
        if (monitor.booleanResult !== true) {
            callback.taskDecision("Availability check failed: condition not satisfied");
            return false;
        }
        callback.taskDecision("Availability check passed");
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
        const missingTools: string[] = [];
        for (const tool of criteria.toolExecuted) {
            if (!toolsCalled.has(tool)) {
                missingTools.push(tool);
            }
        }
        if (missingTools.length > 0) {
            callback.taskDecision(`Criteria failed: required tools not called: ${missingTools.join(", ")}`);
            return false;
        }
    }

    // Check condition
    if (criteria.condition) {
        const conditionPrompt = expandPrompt(entry, criteria.condition, runtimeValues);
        const monitor = monitorSessionTools(drivingSession, runtimeValues);
        try {
            await sendPromptWithCrashRetry(drivingSession, conditionPrompt, callback);
        } catch (err) {
            monitor.cleanup();
            callback.taskDecision(`Criteria condition check crashed: ${String(err)}`);
            throw err;
        }
        monitor.cleanup();

        if (monitor.booleanResult === true) {
            callback.taskDecision("Criteria condition passed");
            return true;
        }

        callback.taskDecision("Criteria condition failed");

        // Condition failed - check for failure action with retry
        const failureAction = criteria.failureAction as
            | ["RetryWithNewSession", number]
            | ["RetryWithUserPrompt", number, Prompt]
            | undefined;

        if (failureAction && criteria.runConditionInSameSession !== undefined) {
            if (failureAction[0] === "RetryWithNewSession") {
                const maxRetries = failureAction[1];
                for (let i = 0; i < maxRetries; i++) {
                    callback.taskDecision(`Starting retry #${i + 1} (RetryWithNewSession)`);

                    // Stop old task session and create new one
                    if (taskSession) {
                        await helperSessionStop(taskSession[0]).catch(() => {});
                        callback.taskSessionStopped(taskSession, false);
                    }

                    let taskModelId: string | undefined;
                    if (task.model) {
                        taskModelId = getModelId(task.model, entry);
                    }
                    if (!taskModelId) {
                        taskModelId = entry.models.driving;
                    }

                    const [newSession, newSessionId] = await helperSessionStart(taskModelId);
                    taskSession = [newSession, newSessionId];
                    taskSessionObj = newSession;
                    callback.taskSessionStarted(taskSession);

                    // Re-execute task (crash = failed iteration, not task death)
                    const taskPromptText = expandPrompt(entry, task.prompt, runtimeValues);
                    const retryMonitor = monitorSessionTools(taskSessionObj, runtimeValues);
                    let taskCrashed = false;
                    try {
                        await sendPromptWithCrashRetry(taskSessionObj, taskPromptText, callback);
                    } catch (err) {
                        retryMonitor.cleanup();
                        callback.taskDecision(`Session crash during retry #${i + 1}: ${String(err)}`);
                        taskCrashed = true;
                    }
                    if (!taskCrashed) {
                        retryMonitor.cleanup();
                    }

                    if (taskCrashed) {
                        continue; // Treat crash as failed iteration
                    }

                    // Re-check condition (crash here also = failed iteration)
                    const condMonitor = monitorSessionTools(drivingSession, runtimeValues);
                    const retryCondPrompt = expandPrompt(entry, criteria.condition!, runtimeValues);
                    let condCrashed = false;
                    try {
                        await sendPromptWithCrashRetry(drivingSession, retryCondPrompt, callback);
                    } catch (err) {
                        condMonitor.cleanup();
                        callback.taskDecision(`Criteria condition check crash during retry #${i + 1}: ${String(err)}`);
                        condCrashed = true;
                    }
                    if (!condCrashed) {
                        condMonitor.cleanup();
                    }

                    if (condCrashed) {
                        continue; // Treat crash as failed iteration
                    }

                    if (condMonitor.booleanResult === true) {
                        callback.taskDecision(`Criteria condition passed on retry #${i + 1}`);
                        return true;
                    }
                    callback.taskDecision(`Criteria condition failed on retry #${i + 1}`);
                }
                callback.taskDecision(`Retry budget drained: criteria failure after ${maxRetries} retries (RetryWithNewSession)`);
                return false;
            } else if (failureAction[0] === "RetryWithUserPrompt") {
                const maxRetries = failureAction[1];
                const retryPromptTemplate = failureAction[2];
                for (let i = 0; i < maxRetries; i++) {
                    callback.taskDecision(`Starting retry #${i + 1} (RetryWithUserPrompt)`);

                    // Send retry prompt to the SAME task session (crash = failed iteration)
                    const retryPromptText = expandPrompt(entry, retryPromptTemplate, runtimeValues);
                    const retryMonitor = monitorSessionTools(taskSessionObj, runtimeValues);
                    let taskCrashed = false;
                    try {
                        await sendPromptWithCrashRetry(taskSessionObj, retryPromptText, callback);
                    } catch (err) {
                        retryMonitor.cleanup();
                        callback.taskDecision(`Session crash during retry #${i + 1}: ${String(err)}`);
                        taskCrashed = true;
                    }
                    if (!taskCrashed) {
                        retryMonitor.cleanup();
                    }

                    if (taskCrashed) {
                        continue; // Treat crash as failed iteration
                    }

                    // Re-check condition (crash here also = failed iteration)
                    const condMonitor = monitorSessionTools(drivingSession, runtimeValues);
                    const retryCondPrompt = expandPrompt(entry, criteria.condition!, runtimeValues);
                    let condCrashed = false;
                    try {
                        await sendPromptWithCrashRetry(drivingSession, retryCondPrompt, callback);
                    } catch (err) {
                        condMonitor.cleanup();
                        callback.taskDecision(`Criteria condition check crash during retry #${i + 1}: ${String(err)}`);
                        condCrashed = true;
                    }
                    if (!condCrashed) {
                        condMonitor.cleanup();
                    }

                    if (condCrashed) {
                        continue; // Treat crash as failed iteration
                    }

                    if (condMonitor.booleanResult === true) {
                        callback.taskDecision(`Criteria condition passed on retry #${i + 1}`);
                        return true;
                    }
                    callback.taskDecision(`Criteria condition failed on retry #${i + 1}`);
                }
                callback.taskDecision(`Retry budget drained: criteria failure after ${maxRetries} retries (RetryWithUserPrompt)`);
                return false;
            }
        }

        return false;
    }

    return true;
}

// ---- API Handlers ----

export async function apiTaskList(
    req: http.IncomingMessage,
    res: http.ServerResponse,
): Promise<void> {
    if (!installedEntry) {
        jsonResponse(res, 200, { tasks: [] });
        return;
    }
    const taskList = Object.entries(installedEntry.tasks).map(([name, task]) => ({
        name,
        requireUserInput: task.requireUserInput,
    }));
    jsonResponse(res, 200, { tasks: taskList });
}

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
                // Deferred cleanup so live API can serve the final callback
                setTimeout(() => tasks.delete(taskId), 10000);
            },
            taskFailed() {
                pushResponse(state, { callback: "taskFailed" });
                // Deferred cleanup so live API can serve the final callback
                setTimeout(() => tasks.delete(taskId), 10000);
            },
            taskDecision(reason: string) {
                pushResponse(state, { callback: "taskDecision", reason });
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

        const copilotTask = await startTask(taskName, userInput, session, true, true, taskCallback);
        state.task = copilotTask;
        tasks.set(taskId, state);

        // Catch execution crashes
        const execPromise = (copilotTask as any)._executionPromise as Promise<void> | undefined;
        if (execPromise) {
            execPromise.catch((err: unknown) => {
                state.taskError = String(err);
                pushResponse(state, { taskError: String(err) });
            });
        }

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

// ---- Job State ----

interface JobState extends LiveState {
    jobId: string;
    job: ICopilotJob;
    jobError: string | null;
}

const jobs = new Map<string, JobState>();
let nextJobId = 1;

// ---- executeWork ----

async function executeWork(
    entry: Entry,
    work: Work<number>,
    userInput: string,
    workingDirectory: string,
    runningIds: Set<number>,
    stopped: { readonly value: boolean },
    activeTasks: ICopilotTask[],
    callback: ICopilotJobCallback
): Promise<boolean> {
    if (stopped.value) return false;

    switch (work.kind) {
        case "Ref": {
            const taskWork = work as TaskWork<number>;
            const taskName = taskWork.taskId;
            const task = entry.tasks[taskName];

            // Determine model override
            let taskModelId: string | undefined;
            if (taskWork.modelOverride) {
                taskModelId = getModelId(taskWork.modelOverride, entry);
            }

            // Start driving session
            const drivingModelId = entry.models.driving;
            const [drivingSession, drivingSessionId] = await helperSessionStart(drivingModelId, workingDirectory);

            // Register task state for live API
            const taskId = `task-${nextTaskId++}`;
            const taskState: TaskState = {
                taskId,
                task: null as unknown as ICopilotTask,
                responseQueue: [],
                waitingResolve: null,
                taskError: null,
                forcedSingleSession: false,
            };
            tasks.set(taskId, taskState);

            // Report driving session as the first session
            pushResponse(taskState, { callback: "taskSessionStarted", sessionId: drivingSessionId, isDriving: true });

            runningIds.add(taskWork.workIdInJob);
            callback.workStarted(taskWork.workIdInJob, taskId);

            try {
                const result = await new Promise<boolean>((resolve, reject) => {
                    const taskCallback: ICopilotTaskCallback = {
                        taskSucceeded() {
                            pushResponse(taskState, { callback: "taskSucceeded" });
                            setTimeout(() => tasks.delete(taskId), 10000);
                            const crashErr = (startedTask as any)?._crashError;
                            if (crashErr) { reject(crashErr); } else { resolve(true); }
                        },
                        taskFailed() {
                            pushResponse(taskState, { callback: "taskFailed" });
                            setTimeout(() => tasks.delete(taskId), 10000);
                            const crashErr = (startedTask as any)?._crashError;
                            if (crashErr) { reject(crashErr); } else { resolve(false); }
                        },
                        taskDecision(reason: string) {
                            pushResponse(taskState, { callback: "taskDecision", reason });
                        },
                        taskSessionStarted(taskSession: [ICopilotSession, string] | undefined) {
                            if (taskSession) {
                                pushResponse(taskState, { callback: "taskSessionStarted", sessionId: taskSession[1], isDriving: false });
                            }
                            // If undefined → single session mode, driving session already reported
                        },
                        taskSessionStopped(taskSession: [ICopilotSession, string] | undefined, succeeded: boolean) {
                            if (taskSession) {
                                pushResponse(taskState, { callback: "taskSessionStopped", sessionId: taskSession[1], succeeded });
                            } else {
                                pushResponse(taskState, { callback: "taskSessionStopped", sessionId: drivingSessionId, succeeded });
                            }
                        },
                    };

                    let startedTask: ICopilotTask | null = null;
                    startTask(
                        taskName,
                        userInput,
                        drivingSession,
                        false, // not forced single session (double session mode for jobs)
                        false, // not ignoring prerequisites
                        taskCallback,
                        taskModelId,
                        workingDirectory
                    ).then(t => {
                        startedTask = t;
                        taskState.task = t;
                        activeTasks.push(t);
                    }).catch(err => {
                        taskState.taskError = String(err);
                        pushResponse(taskState, { taskError: String(err) });
                        reject(err);
                    });
                });

                runningIds.delete(taskWork.workIdInJob);
                callback.workStopped(taskWork.workIdInJob, result);

                // Clean up driving session
                await helperSessionStop(drivingSession).catch(() => {});
                return result;
            } catch (err) {
                runningIds.delete(taskWork.workIdInJob);
                callback.workStopped(taskWork.workIdInJob, false);
                await helperSessionStop(drivingSession).catch(() => {});
                throw err; // Propagate crash to job level
            }
        }
        case "Seq": {
            const seqWork = work as SequentialWork<number>;
            for (const w of seqWork.works) {
                if (stopped.value) return false;
                const result = await executeWork(entry, w, userInput, workingDirectory, runningIds, stopped, activeTasks, callback);
                if (!result) return false;
            }
            return true;
        }
        case "Par": {
            const parWork = work as ParallelWork<number>;
            if (parWork.works.length === 0) return true;
            const results = await Promise.all(
                parWork.works.map(w => executeWork(entry, w, userInput, workingDirectory, runningIds, stopped, activeTasks, callback))
            );
            return results.every(r => r);
        }
        case "Loop": {
            const loopWork = work as LoopWork<number>;
            while (true) {
                if (stopped.value) return false;

                // Check pre-condition
                if (loopWork.preCondition) {
                    const [expected, condWork] = loopWork.preCondition;
                    const condResult = await executeWork(entry, condWork, userInput, workingDirectory, runningIds, stopped, activeTasks, callback);
                    if (condResult !== expected) {
                        return true; // LoopWork finishes as succeeded
                    }
                }

                // Run body
                const bodyResult = await executeWork(entry, loopWork.body, userInput, workingDirectory, runningIds, stopped, activeTasks, callback);
                if (!bodyResult) return false; // body fails → LoopWork fails

                // Check post-condition
                if (loopWork.postCondition) {
                    const [expected, condWork] = loopWork.postCondition;
                    const condResult = await executeWork(entry, condWork, userInput, workingDirectory, runningIds, stopped, activeTasks, callback);
                    if (condResult !== expected) {
                        return true; // LoopWork finishes as succeeded
                    }
                    // condition matches expected → redo loop
                } else {
                    return true; // No post-condition, loop body ran once successfully
                }
            }
        }
        case "Alt": {
            const altWork = work as AltWork<number>;
            const condResult = await executeWork(entry, altWork.condition, userInput, workingDirectory, runningIds, stopped, activeTasks, callback);
            const chosen = condResult ? altWork.trueWork : altWork.falseWork;
            if (!chosen) return true; // No chosen work = success
            return executeWork(entry, chosen, userInput, workingDirectory, runningIds, stopped, activeTasks, callback);
        }
    }
}

// ---- startJob ----

export async function startJob(
    jobName: string,
    userInput: string,
    workingDirectory: string,
    callback: ICopilotJobCallback
): Promise<ICopilotJob> {
    if (!installedEntry) {
        throw new Error("installJobsEntry has not been called.");
    }

    const entry = installedEntry;
    const job = entry.jobs[jobName];
    if (!job) {
        throw new Error(`Job "${jobName}" not found.`);
    }

    let status: "Executing" | "Succeeded" | "Failed" = "Executing";
    let stopped = false;
    const runningIds = new Set<number>();
    const activeTasks: ICopilotTask[] = [];

    const copilotJob: ICopilotJob = {
        get runningWorkIds() { return Array.from(runningIds); },
        get status() { return status; },
        stop() {
            if (stopped) return;
            stopped = true;
            status = "Failed";
            for (const task of activeTasks) {
                task.stop();
            }
        },
    };

    const executionPromise = (async () => {
        try {
            const result = await executeWork(
                entry, job.work, userInput, workingDirectory,
                runningIds, { get value() { return stopped; } },
                activeTasks, callback
            );
            if (result) {
                status = "Succeeded";
                callback.jobSucceeded();
            } else {
                status = "Failed";
                callback.jobFailed();
            }
        } catch (err) {
            if (status === "Executing") {
                status = "Failed";
            }
            // Stop all running tasks
            for (const task of activeTasks) {
                task.stop();
            }
            callback.jobFailed();
            throw err; // Don't consume silently
        }
    })();

    (copilotJob as any)._executionPromise = executionPromise;
    executionPromise.catch(() => {}); // Prevent unhandled rejection; callers should handle

    return copilotJob;
}

// ---- Job API Handlers ----

export async function apiJobList(
    req: http.IncomingMessage,
    res: http.ServerResponse,
): Promise<void> {
    if (!installedEntry) {
        jsonResponse(res, 200, { grid: [], jobs: {}, chart: {} });
        return;
    }
    // Build a combined chart from all jobs
    const chart: Record<string, ReturnType<typeof generateChartNodes>> = {};
    for (const [jobName, job] of Object.entries(installedEntry.jobs)) {
        chart[jobName] = generateChartNodes(job.work);
    }
    jsonResponse(res, 200, { grid: installedEntry.grid, jobs: installedEntry.jobs, chart });
}

export async function apiJobStart(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    jobName: string,
): Promise<void> {
    if (!installedEntry || !(jobName in installedEntry.jobs)) {
        jsonResponse(res, 200, { error: "JobNotFound" });
        return;
    }

    const body = await readBody(req);
    const lines = body.split("\n");
    const workingDirectory = lines[0].trim();
    const userInput = lines.slice(1).join("\n");

    if (!workingDirectory || !path.isAbsolute(workingDirectory)) {
        jsonResponse(res, 200, { error: "JobNotFound" });
        return;
    }
    if (!fs.existsSync(workingDirectory)) {
        jsonResponse(res, 200, { error: "JobNotFound" });
        return;
    }

    try {
        const jobId = `job-${nextJobId++}`;
        const state: JobState = {
            jobId,
            job: null as unknown as ICopilotJob,
            responseQueue: [],
            waitingResolve: null,
            jobError: null,
        };

        const jobCallback: ICopilotJobCallback = {
            jobSucceeded() {
                pushResponse(state, { callback: "jobSucceeded" });
                // Deferred cleanup so live API can serve the final callback
                setTimeout(() => jobs.delete(jobId), 10000);
            },
            jobFailed() {
                pushResponse(state, { callback: "jobFailed" });
                // Deferred cleanup so live API can serve the final callback
                setTimeout(() => jobs.delete(jobId), 10000);
            },
            workStarted(workId: number, taskId: string) {
                pushResponse(state, { callback: "workStarted", workId, taskId });
            },
            workStopped(workId: number, succeeded: boolean) {
                pushResponse(state, { callback: "workStopped", workId, succeeded });
            },
        };

        const copilotJob = await startJob(jobName, userInput, workingDirectory, jobCallback);
        state.job = copilotJob;
        jobs.set(jobId, state);

        // Catch execution crashes
        const execPromise = (copilotJob as any)._executionPromise as Promise<void> | undefined;
        if (execPromise) {
            execPromise.catch((err: unknown) => {
                state.jobError = String(err);
                pushResponse(state, { jobError: String(err) });
            });
        }

        jsonResponse(res, 200, { jobId });
    } catch (err) {
        jsonResponse(res, 200, { jobError: String(err) });
    }
}

export async function apiJobStop(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    jobId: string,
): Promise<void> {
    const state = jobs.get(jobId);
    if (!state) {
        jsonResponse(res, 200, { error: "JobNotFound" });
        return;
    }
    state.job.stop();
    jobs.delete(jobId);
    if (state.waitingResolve) {
        const resolve = state.waitingResolve;
        state.waitingResolve = null;
        resolve({ error: "JobNotFound" });
    }
    jsonResponse(res, 200, { result: "Closed" });
}

export async function apiJobLive(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    jobId: string,
): Promise<void> {
    const state = jobs.get(jobId);
    if (!state) {
        jsonResponse(res, 200, { error: "JobNotFound" });
        return;
    }
    if (state.waitingResolve) {
        jsonResponse(res, 200, { error: "ParallelCallNotSupported" });
        return;
    }
    const response = await waitForResponse(state, 5000);
    if (response === null) {
        jsonResponse(res, 200, { error: "HttpRequestTimeout" });
    } else if (state.jobError) {
        jsonResponse(res, 200, { jobError: state.jobError });
    } else {
        jsonResponse(res, 200, response);
    }
}

// ---- Entry Export ----

export { entry } from "./jobsData.js";
