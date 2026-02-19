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
    // Unavailable in borrowing session mode
    taskSessionStarted(taskSession: ICopilotSession, taskId: string, isDrivingSession: boolean): void;
    // Unavailable in borrowing session mode
    taskSessionStopped(taskSession: ICopilotSession, taskId: string, succeeded: boolean): void;
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

// ---- startTask ----

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

    const criteria = task.criteria;
    const borrowingMode = drivingSession !== undefined;
    const singleModel = borrowingMode ||
        !criteria ||
        !("runConditionInSameSession" in criteria) ||
        (criteria as any).runConditionInSameSession === undefined ||
        (criteria as any).runConditionInSameSession === true;

    // Determine task model ID
    let taskModelId: string | undefined = taskModelIdOverride;
    if (!taskModelId && task.model) {
        taskModelId = getModelId(task.model, entry);
    }
    if (!taskModelId && !borrowingMode && singleModel) {
        taskModelId = entry.models.driving;
    }
    if (!taskModelId && !borrowingMode && !singleModel) {
        taskModelId = entry.models.driving;
    }

    // Runtime variables
    const runtimeValues: Record<string, string> = {};
    if (userInput) runtimeValues["user-input"] = userInput;

    // Shared state
    let status: "Executing" | "Succeeded" | "Failed" = "Executing";
    let stopped = false;
    const activeSessions = new Map<string, ICopilotSession>(); // sessionId -> session
    let primaryDrivingSession: ICopilotSession | undefined = drivingSession;

    // ---- Session management helpers ----

    async function openSession(modelId: string, isDriving: boolean): Promise<[ICopilotSession, string]> {
        const [session, sessionId] = await helperSessionStart(modelId, workingDirectory);
        activeSessions.set(sessionId, session);
        callback.taskSessionStarted(session, sessionId, isDriving);
        if (isDriving && !primaryDrivingSession) primaryDrivingSession = session;
        return [session, sessionId];
    }

    async function closeExistingSession(session: ICopilotSession, sessionId: string, succeeded: boolean): Promise<void> {
        activeSessions.delete(sessionId);
        await helperSessionStop(session).catch(() => {});
        callback.taskSessionStopped(session, sessionId, succeeded);
    }

    // ---- Send prompt with monitoring and crash retry ----

    async function sendMonitoredPrompt(
        sessionRef: { session: ICopilotSession; id: string },
        prompt: string,
        modelId: string,
        isDriving: boolean,
    ): Promise<{ toolsCalled: Set<string>; booleanResult: boolean | null }> {
        const maxAttempts = borrowingMode ? 1 : MAX_CRASH_RETRIES;
        let lastError: unknown;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const actualPrompt = attempt === 0 ? prompt : SESSION_CRASH_PREFIX + prompt;
            const monitor = monitorSessionTools(sessionRef.session, runtimeValues);

            try {
                helperPushSessionResponse(sessionRef.session, { callback: "onGeneratedUserPrompt", prompt: actualPrompt });
                await sessionRef.session.sendRequest(actualPrompt);
                monitor.cleanup();
                return { toolsCalled: monitor.toolsCalled, booleanResult: monitor.booleanResult };
            } catch (err) {
                monitor.cleanup();
                lastError = err;
                callback.taskDecision(`[SESSION CRASHED] ${errorToDetailedString(err)}`);

                if (!borrowingMode && attempt < maxAttempts - 1) {
                    try {
                        await closeExistingSession(sessionRef.session, sessionRef.id, false);
                        const [newSession, newId] = await openSession(modelId, isDriving);
                        sessionRef.session = newSession;
                        sessionRef.id = newId;
                    } catch (sessionErr) {
                        callback.taskDecision(`[SESSION CRASHED] Failed to create replacement session: ${errorToDetailedString(sessionErr)}`);
                        throw sessionErr;
                    }
                }
            }
        }

        throw lastError;
    }

    // ---- Criteria checking ----

    async function checkCriteriaResult(
        toolsCalled: Set<string>,
        drivingRef: { session: ICopilotSession; id: string } | undefined,
        drivingModelId: string,
    ): Promise<{ passed: boolean; missingTools: string[] }> {
        if (!criteria) return { passed: true, missingTools: [] };

        // Check toolExecuted
        let missingTools: string[] = [];
        if (criteria.toolExecuted) {
            for (const tool of criteria.toolExecuted) {
                if (!toolsCalled.has(tool)) {
                    missingTools.push(tool);
                }
            }
            if (missingTools.length > 0) {
                callback.taskDecision(`[CRITERIA] toolExecuted check failed: missing tools: ${missingTools.join(", ")}`);
                if (!("condition" in criteria) || !(criteria as any).condition) {
                    return { passed: false, missingTools };
                }
            }
        }

        // Check condition
        if ("condition" in criteria && (criteria as any).condition) {
            let condRef: { session: ICopilotSession; id: string };
            let needsClose = false;

            if (drivingRef) {
                // Single model or borrowing: use existing session
                condRef = drivingRef;
            } else {
                // Multiple models: create new driving session for condition check
                const [ds, dsId] = await openSession(drivingModelId, true);
                condRef = { session: ds, id: dsId };
                needsClose = true;
            }

            const condPrompt = expandPrompt(entry, (criteria as any).condition, runtimeValues);
            let condPassed: boolean;
            try {
                const result = await sendMonitoredPrompt(condRef, condPrompt, drivingModelId, true);
                condPassed = result.booleanResult === true;
            } catch (err) {
                if (needsClose) await closeExistingSession(condRef.session, condRef.id, false);
                throw err;
            }

            if (needsClose) await closeExistingSession(condRef.session, condRef.id, condPassed);

            if (condPassed) {
                callback.taskDecision("[CRITERIA] Criteria condition passed");
            } else {
                callback.taskDecision(`[CRITERIA] Criteria condition failed. Condition: ${JSON.stringify((criteria as any).condition)}`);
                return { passed: false, missingTools };
            }
        }

        // If toolsOk was false but condition passed, tools still failed
        if (missingTools.length > 0) {
            return { passed: false, missingTools };
        }

        return { passed: true, missingTools: [] };
    }

    // ---- Build retry prompt ----

    function buildRetryPrompt(missingTools: string[]): string {
        let prompt = expandPrompt(entry, task.prompt, runtimeValues);
        if (missingTools.length > 0) {
            prompt += `\n## Required Tool Not Called: ${missingTools.join(", ")}`;
        }
        if (criteria?.failureAction?.additionalPrompt) {
            const expandedAdditional = expandPrompt(entry, criteria.failureAction.additionalPrompt, runtimeValues);
            prompt += `\n## You accidentally Stopped\n${expandedAdditional}`;
        }
        return prompt;
    }

    // ---- ICopilotTask object ----

    const copilotTask: ICopilotTask = {
        get drivingSession() { return primaryDrivingSession || drivingSession!; },
        get status() { return status; },
        stop() {
            if (stopped) return;
            stopped = true;
            status = "Failed";
            for (const [, session] of activeSessions) {
                helperSessionStop(session).catch(() => {});
            }
            activeSessions.clear();
        },
    };

    // ---- Main execution ----

    const executionPromise = (async () => {
        try {
            if (borrowingMode) {
                // === BORROWING SESSION MODE ===
                runtimeValues["task-model"] = taskModelId || "";

                // Execute prompt directly on the given session
                const promptText = expandPrompt(entry, task.prompt, runtimeValues);
                const borrowedSession = drivingSession!;

                const monitor = monitorSessionTools(borrowedSession, runtimeValues);
                try {
                    helperPushSessionResponse(borrowedSession, { callback: "onGeneratedUserPrompt", prompt: promptText });
                    await borrowedSession.sendRequest(promptText);
                } catch (err) {
                    monitor.cleanup();
                    callback.taskDecision(`[SESSION CRASHED] Task crashed in borrowing session mode: ${errorToDetailedString(err)}`);
                    throw err;
                }
                monitor.cleanup();

                // Check criteria using the borrowed session
                const borrowedRef = { session: borrowedSession, id: "" };
                let { passed, missingTools } = criteria
                    ? await checkCriteriaResult(monitor.toolsCalled, borrowedRef, "")
                    : { passed: true, missingTools: [] as string[] };

                // Retry loop (borrowing mode: same session, crash = immediate fail)
                if (!passed && criteria?.failureAction) {
                    const maxRetries = criteria.failureAction.retryTimes;
                    for (let i = 0; i < maxRetries && !passed; i++) {
                        if (stopped) return;
                        callback.taskDecision(`[OPERATION] Starting retry #${i + 1}`);

                        const retryPrompt = buildRetryPrompt(missingTools);
                        const retryMonitor = monitorSessionTools(borrowedSession, runtimeValues);
                        try {
                            helperPushSessionResponse(borrowedSession, { callback: "onGeneratedUserPrompt", prompt: retryPrompt });
                            await borrowedSession.sendRequest(retryPrompt);
                        } catch (err) {
                            retryMonitor.cleanup();
                            callback.taskDecision(`[SESSION CRASHED] Crash during retry in borrowing mode: ${errorToDetailedString(err)}`);
                            throw err;
                        }
                        retryMonitor.cleanup();

                        const retResult = await checkCriteriaResult(retryMonitor.toolsCalled, borrowedRef, "");
                        passed = retResult.passed;
                        missingTools = retResult.missingTools;

                        callback.taskDecision(passed
                            ? `[CRITERIA] Criteria passed on retry #${i + 1}`
                            : `[CRITERIA] Criteria failed on retry #${i + 1}`);
                    }
                    if (!passed) {
                        callback.taskDecision(`[DECISION] Retry budget drained after ${maxRetries} retries`);
                    }
                }

                // Report result
                if (passed) {
                    status = "Succeeded";
                    callback.taskDecision("[TASK SUCCEEDED] Decision: task succeeded");
                    callback.taskSucceeded();
                } else {
                    status = "Failed";
                    callback.taskDecision("[TASK FAILED] Decision: task failed (criteria not satisfied)");
                    callback.taskFailed();
                }

            } else if (singleModel) {
                // === MANAGED SESSION MODE (SINGLE MODEL) ===
                const modelId = taskModelId || entry.models.driving;
                runtimeValues["task-model"] = modelId;

                const [session, sessionId] = await openSession(modelId, true);
                const ref = { session, id: sessionId };

                if (stopped) return;

                // Check availability
                if (task.availability && !ignorePrerequisiteCheck) {
                    if (task.availability.condition) {
                        const condPrompt = expandPrompt(entry, task.availability.condition, runtimeValues);
                        const result = await sendMonitoredPrompt(ref, condPrompt, modelId, true);
                        if (result.booleanResult !== true) {
                            callback.taskDecision(`[AVAILABILITY] Availability check failed: condition not satisfied. Condition: ${JSON.stringify(task.availability.condition)}`);
                            status = "Failed";
                            await closeExistingSession(ref.session, ref.id, false);
                            callback.taskFailed();
                            return;
                        }
                        callback.taskDecision("[AVAILABILITY] Availability check passed");
                    }
                }

                if (stopped) return;

                // Execute prompt
                const promptText = expandPrompt(entry, task.prompt, runtimeValues);
                const { toolsCalled } = await sendMonitoredPrompt(ref, promptText, modelId, true);

                // Check criteria
                let { passed, missingTools } = criteria
                    ? await checkCriteriaResult(toolsCalled, ref, modelId)
                    : { passed: true, missingTools: [] as string[] };

                // Retry loop
                if (!passed && criteria?.failureAction) {
                    const maxRetries = criteria.failureAction.retryTimes;
                    for (let i = 0; i < maxRetries && !passed; i++) {
                        if (stopped) return;
                        callback.taskDecision(`[OPERATION] Starting retry #${i + 1}`);

                        const retryPrompt = buildRetryPrompt(missingTools);
                        const retryResult = await sendMonitoredPrompt(ref, retryPrompt, modelId, true);

                        const checkResult = await checkCriteriaResult(retryResult.toolsCalled, ref, modelId);
                        passed = checkResult.passed;
                        missingTools = checkResult.missingTools;

                        callback.taskDecision(passed
                            ? `[CRITERIA] Criteria passed on retry #${i + 1}`
                            : `[CRITERIA] Criteria failed on retry #${i + 1}`);
                    }
                    if (!passed) {
                        callback.taskDecision(`[DECISION] Retry budget drained after ${maxRetries} retries`);
                    }
                }

                // Report result
                if (passed) {
                    status = "Succeeded";
                    callback.taskDecision("[TASK SUCCEEDED] Decision: task succeeded");
                    await closeExistingSession(ref.session, ref.id, true);
                    callback.taskSucceeded();
                } else {
                    status = "Failed";
                    callback.taskDecision("[TASK FAILED] Decision: task failed (criteria not satisfied)");
                    await closeExistingSession(ref.session, ref.id, false);
                    callback.taskFailed();
                }

            } else {
                // === MANAGED SESSION MODE (MULTIPLE MODELS) ===
                const drivingModelId = entry.models.driving;
                const tModelId = taskModelId || entry.models.driving;
                runtimeValues["task-model"] = tModelId;

                if (stopped) return;

                // Check availability
                if (task.availability && !ignorePrerequisiteCheck) {
                    if (task.availability.condition) {
                        const [ds, dsId] = await openSession(drivingModelId, true);
                        const dRef = { session: ds, id: dsId };

                        const condPrompt = expandPrompt(entry, task.availability.condition, runtimeValues);
                        let condPassed: boolean;
                        try {
                            const result = await sendMonitoredPrompt(dRef, condPrompt, drivingModelId, true);
                            condPassed = result.booleanResult === true;
                        } catch (err) {
                            await closeExistingSession(dRef.session, dRef.id, false);
                            throw err;
                        }

                        await closeExistingSession(dRef.session, dRef.id, condPassed);

                        if (!condPassed) {
                            callback.taskDecision(`[AVAILABILITY] Availability check failed: condition not satisfied. Condition: ${JSON.stringify(task.availability.condition)}`);
                            status = "Failed";
                            callback.taskFailed();
                            return;
                        }
                        callback.taskDecision("[AVAILABILITY] Availability check passed");
                    }
                }

                if (stopped) return;

                // Execute prompt (task session)
                const [ts, tsId] = await openSession(tModelId, false);
                let taskRef = { session: ts, id: tsId };

                const promptText = expandPrompt(entry, task.prompt, runtimeValues);
                let { toolsCalled } = await sendMonitoredPrompt(taskRef, promptText, tModelId, false);

                // Close task session (mission done)
                await closeExistingSession(taskRef.session, taskRef.id, true);

                // Check criteria (new driving session for condition if needed)
                let { passed, missingTools } = criteria
                    ? await checkCriteriaResult(toolsCalled, undefined, drivingModelId)
                    : { passed: true, missingTools: [] as string[] };

                // Retry loop
                if (!passed && criteria?.failureAction) {
                    const maxRetries = criteria.failureAction.retryTimes;
                    for (let i = 0; i < maxRetries && !passed; i++) {
                        if (stopped) return;
                        callback.taskDecision(`[OPERATION] Starting retry #${i + 1}`);

                        // New task session for retry
                        const [rts, rtsId] = await openSession(tModelId, false);
                        taskRef = { session: rts, id: rtsId };

                        const retryPrompt = buildRetryPrompt(missingTools);
                        let retryToolsCalled: Set<string>;
                        try {
                            const retryResult = await sendMonitoredPrompt(taskRef, retryPrompt, tModelId, false);
                            retryToolsCalled = retryResult.toolsCalled;
                        } catch (err) {
                            // Crash exhausting per-call budget is a failed iteration
                            callback.taskDecision(`[SESSION CRASHED] Session crash during retry #${i + 1}: ${errorToDetailedString(err)}`);
                            continue;
                        }

                        // Close task session
                        await closeExistingSession(taskRef.session, taskRef.id, true);

                        // Re-check criteria
                        const checkResult = await checkCriteriaResult(retryToolsCalled, undefined, drivingModelId);
                        passed = checkResult.passed;
                        missingTools = checkResult.missingTools;

                        callback.taskDecision(passed
                            ? `[CRITERIA] Criteria passed on retry #${i + 1}`
                            : `[CRITERIA] Criteria failed on retry #${i + 1}`);
                    }
                    if (!passed) {
                        callback.taskDecision(`[DECISION] Retry budget drained after ${maxRetries} retries`);
                    }
                }

                // Report result
                if (passed) {
                    status = "Succeeded";
                    callback.taskDecision("[TASK SUCCEEDED] Decision: task succeeded");
                    callback.taskSucceeded();
                } else {
                    status = "Failed";
                    callback.taskDecision("[TASK FAILED] Decision: task failed (criteria not satisfied)");
                    callback.taskFailed();
                }
            }
        } catch (err) {
            if (status === "Executing") {
                status = "Failed";
            }
            (copilotTask as any)._crashError = err;
            callback.taskDecision(`[TASK FAILED] Task error: ${errorToDetailedString(err)}`);

            // Close all remaining active sessions
            for (const [id, session] of activeSessions) {
                await helperSessionStop(session).catch(() => {});
                if (!borrowingMode) callback.taskSessionStopped(session, id, false);
            }
            activeSessions.clear();

            callback.taskFailed();
            throw err;
        }
    })();

    (copilotTask as any)._executionPromise = executionPromise;
    executionPromise.catch(() => {}); // Prevent unhandled rejection

    return copilotTask;
}
