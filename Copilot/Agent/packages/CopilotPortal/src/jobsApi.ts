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

// ---- Criteria Check (single pass, no retry) ----

type CriteriaType = { condition?: Prompt; runConditionInSameSession?: boolean; toolExecuted?: string[]; failureAction: unknown };

async function checkCriteria(
    entry: Entry,
    criteria: CriteriaType,
    drivingSession: ICopilotSession,
    runtimeValues: Record<string, string>,
    toolsCalled: Set<string>,
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
        return false;
    }

    return true;
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

// ---- startTask ----

/**
 * Execute a prompt on a session and check criteria.
 * Returns true if criteria passed, false otherwise.
 * Throws on unrecoverable crash.
 */
async function executePromptAndCheckCriteria(
    entry: Entry,
    criteria: CriteriaType | undefined,
    targetSession: ICopilotSession,
    drivingSession: ICopilotSession,
    prompt: Prompt,
    runtimeValues: Record<string, string>,
    callback: ICopilotTaskCallback,
): Promise<boolean> {
    const promptText = expandPrompt(entry, prompt, runtimeValues);
    const monitor = monitorSessionTools(targetSession, runtimeValues);
    try {
        await sendPromptWithCrashRetry(targetSession, promptText, callback);
    } catch (err) {
        monitor.cleanup();
        throw err;
    }
    monitor.cleanup();

    if (!criteria) return true;
    return checkCriteria(entry, criteria, drivingSession, runtimeValues, monitor.toolsCalled, callback);
}

export async function startTask(
    taskName: string,
    userInput: string,
    drivingSession: ICopilotSession | undefined,
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
    const criteria = task.criteria as CriteriaType | undefined;
    const forcedSingleSession = drivingSession !== undefined;
    const singleSession = forcedSingleSession ||
        !criteria ||
        criteria.runConditionInSameSession === undefined ||
        criteria.runConditionInSameSession === true;

    // Determine task model ID
    let taskModelId: string | undefined;
    if (taskModelIdOverride) {
        taskModelId = taskModelIdOverride;
    } else if (task.model) {
        taskModelId = getModelId(task.model, entry);
    }

    // Create driving session if not provided
    const createdDrivingSession = !drivingSession;
    let actualDrivingSession: ICopilotSession;
    let drivingSessionId: string | undefined;

    if (drivingSession) {
        actualDrivingSession = drivingSession;
    } else {
        // When single session due to config, driving session uses task model
        const drivingModelId = singleSession
            ? (taskModelId || entry.models.driving)
            : entry.models.driving;
        const [session, sessionId] = await helperSessionStart(drivingModelId, workingDirectory);
        actualDrivingSession = session;
        drivingSessionId = sessionId;
    }

    // Initialize runtime variables
    const runtimeValues: Record<string, string> = {};
    if (userInput) {
        runtimeValues["user-input"] = userInput;
    }

    let status: "Executing" | "Succeeded" | "Failed" = "Executing";
    let stopped = false;
    let taskSession: [ICopilotSession, string] | undefined = undefined;

    const copilotTask: ICopilotTask = {
        get drivingSession() { return actualDrivingSession; },
        get status() { return status; },
        stop() {
            if (stopped) return;
            stopped = true;
            status = "Failed";
            if (taskSession) {
                helperSessionStop(taskSession[0]).catch(() => { /* ignore */ });
            }
            if (createdDrivingSession) {
                helperSessionStop(actualDrivingSession).catch(() => { /* ignore */ });
            }
        },
    };
    (copilotTask as any)._drivingSessionId = drivingSessionId;

    // Helper: clean up sessions that startTask manages
    async function cleanupSessions(taskSucceeded: boolean): Promise<void> {
        if (taskSession) {
            await helperSessionStop(taskSession[0]).catch(() => {});
            callback.taskSessionStopped(taskSession, taskSucceeded);
        } else {
            callback.taskSessionStopped(undefined, taskSucceeded);
        }
        if (createdDrivingSession) {
            await helperSessionStop(actualDrivingSession).catch(() => {});
        }
    }

    // Start task execution in background
    const executionPromise = (async () => {
        try {
            // Create task session if double model mode
            let taskSessionObj: ICopilotSession;
            if (singleSession) {
                taskSessionObj = actualDrivingSession;
                callback.taskSessionStarted(undefined);
            } else {
                if (!taskModelId) {
                    taskModelId = entry.models.driving;
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
                const available = await checkAvailability(entry, task, actualDrivingSession, runtimeValues, callback);
                if (!available) {
                    status = "Failed";
                    await cleanupSessions(false);
                    callback.taskFailed();
                    return;
                }
            }

            if (stopped) return;

            // Initial task execution + criteria check
            let succeeded: boolean;
            try {
                succeeded = await executePromptAndCheckCriteria(
                    entry, criteria, taskSessionObj, actualDrivingSession,
                    task.prompt, runtimeValues, callback
                );
            } catch (err) {
                callback.taskDecision(`Task execution crashed: ${String(err)}`);
                throw err;
            }

            if (stopped) return;

            // Retry loop if criteria failed and failureAction is defined
            if (!succeeded && criteria) {
                const failureAction = criteria.failureAction as
                    | ["RetryWithNewSession", number]
                    | ["RetryWithUserPrompt", number, Prompt]
                    | undefined;

                if (failureAction && criteria.runConditionInSameSession !== undefined) {
                    const maxRetries = failureAction[1];
                    for (let i = 0; i < maxRetries && !succeeded; i++) {
                        if (stopped) return;
                        callback.taskDecision(`Starting retry #${i + 1} (${failureAction[0]})`);

                        if (failureAction[0] === "RetryWithNewSession") {
                            // Stop old task session and create new one
                            if (taskSession) {
                                await helperSessionStop(taskSession[0]).catch(() => {});
                                callback.taskSessionStopped(taskSession, false);
                            }

                            const retryModelId = taskModelId || entry.models.driving;
                            const [newSession, newSessionId] = await helperSessionStart(retryModelId, workingDirectory);
                            taskSession = [newSession, newSessionId];
                            taskSessionObj = newSession;
                            callback.taskSessionStarted(taskSession);

                            // Re-execute task + re-check criteria (crash = failed iteration)
                            try {
                                succeeded = await executePromptAndCheckCriteria(
                                    entry, criteria, taskSessionObj, actualDrivingSession,
                                    task.prompt, runtimeValues, callback
                                );
                            } catch (err) {
                                callback.taskDecision(`Session crash during retry #${i + 1}: ${String(err)}`);
                                continue;
                            }
                        } else {
                            // RetryWithUserPrompt: send retry prompt to SAME task session
                            const retryPromptTemplate = failureAction[2];
                            try {
                                succeeded = await executePromptAndCheckCriteria(
                                    entry, criteria, taskSessionObj, actualDrivingSession,
                                    retryPromptTemplate, runtimeValues, callback
                                );
                            } catch (err) {
                                callback.taskDecision(`Session crash during retry #${i + 1}: ${String(err)}`);
                                continue;
                            }
                        }

                        if (succeeded) {
                            callback.taskDecision(`Criteria condition passed on retry #${i + 1}`);
                        } else {
                            callback.taskDecision(`Criteria condition failed on retry #${i + 1}`);
                        }
                    }
                    if (!succeeded) {
                        callback.taskDecision(`Retry budget drained: criteria failure after ${maxRetries} retries (${failureAction[0]})`);
                    }
                }
            }

            // Final result
            if (succeeded) {
                status = "Succeeded";
                callback.taskDecision("Decision: task succeeded");
                await cleanupSessions(true);
                callback.taskSucceeded();
            } else {
                status = "Failed";
                callback.taskDecision("Decision: task failed (criteria not satisfied)");
                await cleanupSessions(false);
                callback.taskFailed();
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
            if (createdDrivingSession) {
                helperSessionStop(actualDrivingSession).catch(() => {});
            }
            callback.taskFailed();
            throw err; // Don't consume silently
        }
    })();

    (copilotTask as any)._executionPromise = executionPromise;
    executionPromise.catch(() => {}); // Prevent unhandled rejection; callers should handle

    return copilotTask;
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

        const copilotTask = await startTask(taskName, userInput, session, true, taskCallback);
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

            // Determine model override
            let taskModelId: string | undefined;
            if (taskWork.modelOverride) {
                taskModelId = getModelId(taskWork.modelOverride, entry);
            }

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
                            // If undefined → single session mode, driving session already reported via .then()
                        },
                        taskSessionStopped(taskSession: [ICopilotSession, string] | undefined, succeeded: boolean) {
                            if (taskSession) {
                                pushResponse(taskState, { callback: "taskSessionStopped", sessionId: taskSession[1], succeeded });
                            } else {
                                // Single session mode: use driving session ID from the task object
                                const dsId = (startedTask as any)?._drivingSessionId;
                                pushResponse(taskState, { callback: "taskSessionStopped", sessionId: dsId || "", succeeded });
                            }
                        },
                    };

                    let startedTask: ICopilotTask | null = null;
                    startTask(
                        taskName,
                        userInput,
                        undefined, // double session mode for jobs
                        false, // not ignoring prerequisites
                        taskCallback,
                        taskModelId,
                        workingDirectory
                    ).then(t => {
                        startedTask = t;
                        taskState.task = t;
                        activeTasks.push(t);

                        // Report driving session (created by startTask)
                        const dsId = (t as any)._drivingSessionId as string;
                        if (dsId) {
                            pushResponse(taskState, { callback: "taskSessionStarted", sessionId: dsId, isDriving: true });
                        }
                    }).catch(err => {
                        taskState.taskError = String(err);
                        pushResponse(taskState, { taskError: String(err) });
                        reject(err);
                    });
                });

                runningIds.delete(taskWork.workIdInJob);
                callback.workStopped(taskWork.workIdInJob, result);
                return result;
            } catch (err) {
                runningIds.delete(taskWork.workIdInJob);
                callback.workStopped(taskWork.workIdInJob, false);
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
