import type { ICopilotSession } from "./copilotSession.js";
import type { Entry, Task, Prompt } from "./jobsDef.js";
import { expandPromptDynamic, getModelId } from "./jobsDef.js";
import {
    helperSessionStart,
    helperSessionStop,
    helperPushSessionResponse,
    hasRunningSessions,
} from "./copilotApi.js";

// ---- Error Formatting Helper ----

export function errorToDetailedString(err: unknown): string {
    if (err instanceof Error) {
        const info: Record<string, unknown> = {};
        if (err.name !== undefined) info.name = err.name;
        if (err.message !== undefined) info.message = err.message;
        if (err.stack !== undefined) info.stack = err.stack;
        if ((err as any).cause !== undefined) {
            info.cause = errorToDetailedString((err as any).cause);
        }
        return JSON.stringify(info);
    }
    if (typeof err === "string") return err;
    try { return JSON.stringify(err); } catch { return String(err); }
}

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
    taskSessionStarted(taskSession: [ICopilotSession, string] | undefined, isDrivingSession: boolean): void;
    taskSessionStopped(taskSession: [ICopilotSession, string] | undefined, succeeded: boolean): void;
}

// ---- Entry Management ----

export let installedEntry: Entry | null = null;

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

// ---- Runtime Variable Helpers ----

function expandPrompt(entry: Entry, prompt: Prompt, runtimeValues: Record<string, string>): string {
    const result = expandPromptDynamic(entry, prompt, runtimeValues);
    return result[0];
}

// ---- Session Crash Retry ----

export const SESSION_CRASH_PREFIX = "The session crashed, please redo and here is the last request:\n";

const MAX_CRASH_RETRIES = 5;

/**
 * Sends a prompt to a session with crash retry logic.
 * If the session crashes after submitting the prompt, resend up to MAX_CRASH_RETRIES consecutive times.
 * On retry, prepend SESSION_CRASH_PREFIX to the prompt.
 * Also pushes onGeneratedUserPrompt to the driving session's response queue.
 */
export async function sendPromptWithCrashRetry(
    session: ICopilotSession,
    prompt: string,
    drivingCallback: ICopilotTaskCallback,
    createNewSession?: () => Promise<ICopilotSession>
): Promise<ICopilotSession> {
    let lastError: unknown;
    let currentSession = session;
    for (let attempt = 0; attempt < MAX_CRASH_RETRIES; attempt++) {
        const actualPrompt = attempt === 0 ? prompt : SESSION_CRASH_PREFIX + prompt;
        try {
            helperPushSessionResponse(currentSession, { callback: "onGeneratedUserPrompt", prompt: actualPrompt });
            await currentSession.sendRequest(actualPrompt);
            return currentSession; // Success, return the session that worked
        } catch (err) {
            drivingCallback.taskDecision(`[SESSION CRASHED] ${errorToDetailedString(err)}`);
            lastError = err;
            // If we can create a new session for retry, do so
            if (createNewSession && attempt < MAX_CRASH_RETRIES - 1) {
                try {
                    currentSession = await createNewSession();
                } catch (sessionErr) {
                    drivingCallback.taskDecision(`[SESSION CRASHED] Failed to create new session: ${errorToDetailedString(sessionErr)}`);
                    throw sessionErr;
                }
            }
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
            callback.taskDecision(`[CRITERIA] toolExecuted check failed: required tools not called: ${missingTools.join(", ")}. Expected: ${JSON.stringify(criteria.toolExecuted)}`);
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
            callback.taskDecision(`[SESSION CRASHED] Criteria condition check crashed: ${errorToDetailedString(err)}`);
            throw err;
        }
        monitor.cleanup();

        if (monitor.booleanResult === true) {
            callback.taskDecision("[CRITERIA] Criteria condition passed");
            return true;
        }

        callback.taskDecision(`[CRITERIA] Criteria condition failed. Condition: ${JSON.stringify(criteria.condition)}`);
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
            callback.taskDecision(`[SESSION CRASHED] Availability check crashed: ${errorToDetailedString(err)}`);
            throw err; // Session crashed - don't consume silently
        }
        monitor.cleanup();
        if (monitor.booleanResult !== true) {
            callback.taskDecision(`[AVAILABILITY] Availability check failed: condition not satisfied. Condition: ${JSON.stringify(availability.condition)}`);
            return false;
        }
        callback.taskDecision("[AVAILABILITY] Availability check passed");
    }

    return true;
}

// ---- startTask ----

/**
 * Execute a prompt on a session and check criteria.
 * Returns true if criteria passed, false otherwise.
 * Throws on unrecoverable crash.
 * When forcedSingleSession is true, crashes fail immediately without retry.
 * When createNewSession is provided, new sessions are created on crash for retry.
 */
async function executePromptAndCheckCriteria(
    entry: Entry,
    criteria: CriteriaType | undefined,
    targetSession: ICopilotSession,
    drivingSession: ICopilotSession,
    prompt: Prompt,
    runtimeValues: Record<string, string>,
    callback: ICopilotTaskCallback,
    forcedSingleSession?: boolean,
    createNewSession?: () => Promise<ICopilotSession>
): Promise<{ succeeded: boolean; usedSession: ICopilotSession }> {
    const promptText = expandPrompt(entry, prompt, runtimeValues);
    const monitor = monitorSessionTools(targetSession, runtimeValues);

    let usedSession = targetSession;
    if (forcedSingleSession) {
        // In forced single session mode, just send once - no retry
        try {
            helperPushSessionResponse(targetSession, { callback: "onGeneratedUserPrompt", prompt: promptText });
            await targetSession.sendRequest(promptText);
        } catch (err) {
            monitor.cleanup();
            throw err;
        }
    } else {
        try {
            usedSession = await sendPromptWithCrashRetry(targetSession, promptText, callback, createNewSession);
        } catch (err) {
            monitor.cleanup();
            throw err;
        }
    }
    monitor.cleanup();

    if (!criteria) return { succeeded: true, usedSession };
    const criteriaResult = await checkCriteria(entry, criteria, drivingSession, runtimeValues, monitor.toolsCalled, callback);
    return { succeeded: criteriaResult, usedSession };
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
                callback.taskSessionStarted(undefined, forcedSingleSession);
            } else {
                if (!taskModelId) {
                    taskModelId = entry.models.driving;
                }
                const [session, sessionId] = await helperSessionStart(taskModelId, workingDirectory);
                taskSession = [session, sessionId];
                taskSessionObj = session;
                callback.taskSessionStarted(taskSession, false);
                callback.taskDecision(`[OPERATION] Started task session with model ${taskModelId}`);
            }

            // Set $task-model runtime variable to the actual model name used for the task session
            runtimeValues["task-model"] = taskModelId || entry.models.driving;

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

            // Helper to create a new task session for crash retry in non-forced mode
            const createNewTaskSession = forcedSingleSession ? undefined : async (): Promise<ICopilotSession> => {
                // Old session is no longer usable
                if (taskSession) {
                    await helperSessionStop(taskSession[0]).catch(() => {});
                    callback.taskSessionStopped(taskSession, false);
                }
                const retryModelId = taskModelId || entry.models.driving;
                const [newSession, newSessionId] = await helperSessionStart(retryModelId, workingDirectory);
                taskSession = [newSession, newSessionId];
                taskSessionObj = newSession;
                callback.taskSessionStarted(taskSession, false);
                return newSession;
            };

            // Initial task execution + criteria check
            let succeeded: boolean;
            try {
                const result = await executePromptAndCheckCriteria(
                    entry, criteria, taskSessionObj, actualDrivingSession,
                    task.prompt, runtimeValues, callback,
                    forcedSingleSession,
                    createNewTaskSession
                );
                succeeded = result.succeeded;
                taskSessionObj = result.usedSession;
            } catch (err) {
                if (forcedSingleSession) {
                    // In forced single session mode, the session is offered from outside, fail immediately
                    callback.taskDecision(`[SESSION CRASHED] Task execution crashed in forced single session mode: ${errorToDetailedString(err)}`);
                    throw err;
                }
                callback.taskDecision(`[SESSION CRASHED] Task execution crashed: ${errorToDetailedString(err)}`);
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
                        callback.taskDecision(`[OPERATION] Starting retry #${i + 1} (${failureAction[0]})`);

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
                            callback.taskSessionStarted(taskSession, false);

                            // Re-execute task + re-check criteria (crash = failed iteration)
                            try {
                                const result = await executePromptAndCheckCriteria(
                                    entry, criteria, taskSessionObj, actualDrivingSession,
                                    task.prompt, runtimeValues, callback,
                                    false,
                                    createNewTaskSession
                                );
                                succeeded = result.succeeded;
                                taskSessionObj = result.usedSession;
                            } catch (err) {
                                callback.taskDecision(`[SESSION CRASHED] Session crash during retry #${i + 1}: ${errorToDetailedString(err)}`);
                                continue;
                            }
                        } else {
                            // RetryWithUserPrompt: send retry prompt to SAME task session
                            const retryPromptTemplate = failureAction[2];
                            try {
                                const result = await executePromptAndCheckCriteria(
                                    entry, criteria, taskSessionObj, actualDrivingSession,
                                    retryPromptTemplate, runtimeValues, callback,
                                    false,
                                    createNewTaskSession
                                );
                                succeeded = result.succeeded;
                                taskSessionObj = result.usedSession;
                            } catch (err) {
                                callback.taskDecision(`[SESSION CRASHED] Session crash during retry #${i + 1}: ${errorToDetailedString(err)}`);
                                continue;
                            }
                        }

                        if (succeeded) {
                            callback.taskDecision(`[CRITERIA] Criteria condition passed on retry #${i + 1}`);
                        } else {
                            callback.taskDecision(`[CRITERIA] Criteria condition failed on retry #${i + 1}`);
                        }
                    }
                    if (!succeeded) {
                        callback.taskDecision(`[DECISION] Retry budget drained: criteria failure after ${maxRetries} retries (${failureAction[0]})`);
                    }
                }
            }

            // Final result
            if (succeeded) {
                status = "Succeeded";
                callback.taskDecision("[TASK SUCCEEDED] Decision: task succeeded");
                await cleanupSessions(true);
                callback.taskSucceeded();
            } else {
                status = "Failed";
                callback.taskDecision("[TASK FAILED] Decision: task failed (criteria not satisfied)");
                await cleanupSessions(false);
                callback.taskFailed();
            }
        } catch (err) {
            if (status === "Executing") {
                status = "Failed";
            }
            (copilotTask as any)._crashError = err;
            callback.taskDecision(`[TASK FAILED] Task error: ${errorToDetailedString(err)}`);
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
