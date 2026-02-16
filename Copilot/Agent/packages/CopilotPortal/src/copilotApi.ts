import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { startSession, type ICopilotSession } from "./copilotSession.js";
import {
    ensureCopilotClient,
    stopCoplilotClient,
    readBody,
    jsonResponse,
    pushResponse,
    waitForResponse,
    type LiveState,
    type LiveResponse
} from "./sharedApi.js";

export { jsonResponse };
export type { ICopilotSession };

// ---- Types ----

export interface ModelInfo {
    name: string;
    id: string;
    multiplier: number;
}

interface SessionState extends LiveState {
    sessionId: string;
    session: ICopilotSession;
    sessionError: string | null;
}

// ---- Copilot Client ----

async function closeCopilotClientIfNoSessions(): Promise<void> {
    if (sessions.size === 0) {
        stopCoplilotClient();
    }
}

// ---- Session Management ----

const sessions = new Map<string, SessionState>();
let nextSessionId = 1;

function createSessionCallbacks(state: SessionState) {
    return {
        onStartReasoning(reasoningId: string) {
            pushResponse(state, { callback: "onStartReasoning", reasoningId });
        },
        onReasoning(reasoningId: string, delta: string) {
            pushResponse(state, { callback: "onReasoning", reasoningId, delta });
        },
        onEndReasoning(reasoningId: string, completeContent: string) {
            pushResponse(state, { callback: "onEndReasoning", reasoningId, completeContent });
        },
        onStartMessage(messageId: string) {
            pushResponse(state, { callback: "onStartMessage", messageId });
        },
        onMessage(messageId: string, delta: string) {
            pushResponse(state, { callback: "onMessage", messageId, delta });
        },
        onEndMessage(messageId: string, completeContent: string) {
            pushResponse(state, { callback: "onEndMessage", messageId, completeContent });
        },
        onStartToolExecution(toolCallId: string, parentToolCallId: string | undefined, toolName: string, toolArguments: string) {
            pushResponse(state, { callback: "onStartToolExecution", toolCallId, parentToolCallId, toolName, toolArguments });
        },
        onToolExecution(toolCallId: string, delta: string) {
            pushResponse(state, { callback: "onToolExecution", toolCallId, delta });
        },
        onEndToolExecution(
            toolCallId: string,
            result: { content: string; detailedContent?: string } | undefined,
            error: { message: string; code?: string } | undefined
        ) {
            pushResponse(state, { callback: "onEndToolExecution", toolCallId, result, error });
        },
        onAgentStart(turnId: string) {
            pushResponse(state, { callback: "onAgentStart", turnId });
        },
        onAgentEnd(turnId: string) {
            pushResponse(state, { callback: "onAgentEnd", turnId });
        },
        onIdle() {
            pushResponse(state, { callback: "onIdle" });
        },
    };
}

// ---- Helper Functions ----

export async function helperGetModels(): Promise<ModelInfo[]> {
    const client = await ensureCopilotClient();
    const modelList = await client.listModels();
    return modelList.map((m: { name: string; id: string; billing?: { multiplier?: number } }) => ({
        name: m.name,
        id: m.id,
        multiplier: m.billing?.multiplier ?? 1,
    }));
}

export async function helperSessionStart(modelId: string, workingDirectory?: string): Promise<[ICopilotSession, string]> {
    const client = await ensureCopilotClient();
    const sessionId = `session-${nextSessionId++}`;
    const state: SessionState = {
        sessionId,
        session: null as unknown as ICopilotSession,
        responseQueue: [],
        waitingResolve: null,
        sessionError: null,
    };

    const session = await startSession(client, modelId, createSessionCallbacks(state), workingDirectory);
    state.session = session;
    sessions.set(sessionId, state);
    return [session, sessionId];
}

export async function helperSessionStop(session: ICopilotSession): Promise<void> {
    for (const [id, state] of sessions) {
        if (state.session === session) {
            sessions.delete(id);
            if (state.waitingResolve) {
                const resolve = state.waitingResolve;
                state.waitingResolve = null;
                resolve({ error: "SessionNotFound" });
            }
            break;
        }
    }
    await closeCopilotClientIfNoSessions();
}

export function helperGetSession(sessionId: string): ICopilotSession | undefined {
    const state = sessions.get(sessionId);
    return state?.session;
}

export function helperPushSessionResponse(session: ICopilotSession, response: LiveResponse): void {
    for (const [, state] of sessions) {
        if (state.session === session) {
            pushResponse(state, response);
            return;
        }
    }
}

export function hasRunningSessions(): boolean {
    return sessions.size > 0;
}

// ---- API Functions ----

export async function apiConfig(req: http.IncomingMessage, res: http.ServerResponse, repoRoot: string): Promise<void> {
    jsonResponse(res, 200, { repoRoot });
}

export async function apiStop(req: http.IncomingMessage, res: http.ServerResponse, server: http.Server): Promise<void> {
    jsonResponse(res, 200, {});
    console.log("Shutting down...");
    // Stop any running sessions
    for (const [sessionId, state] of sessions) {
        if (state.waitingResolve) {
            const resolve = state.waitingResolve;
            state.waitingResolve = null;
            resolve({ error: "SessionNotFound" });
        }
    }
    sessions.clear();
    stopCoplilotClient();
    server.close(() => {
        process.exit(0);
    });
}

export async function apiCopilotModels(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
        const models = await helperGetModels();
        jsonResponse(res, 200, { models });
    } catch (err) {
        jsonResponse(res, 500, { error: String(err) });
    }
}

export async function apiCopilotSessionStart(req: http.IncomingMessage, res: http.ServerResponse, modelId: string): Promise<void> {
    const body = await readBody(req);
    const workingDirectory = body.trim() || undefined;
    try {
        // Validate model ID
        const models = await helperGetModels();
        if (!models.find(m => m.id === modelId)) {
            jsonResponse(res, 200, { error: "ModelIdNotFound" });
            return;
        }

        // Validate working directory
        if (workingDirectory) {
            if (!path.isAbsolute(workingDirectory)) {
                jsonResponse(res, 200, { error: "WorkingDirectoryNotAbsolutePath" });
                return;
            }
            if (!fs.existsSync(workingDirectory)) {
                jsonResponse(res, 200, { error: "WorkingDirectoryNotExists" });
                return;
            }
        }

        const [, sessionId] = await helperSessionStart(modelId, workingDirectory);
        jsonResponse(res, 200, { sessionId });
    } catch (err) {
        jsonResponse(res, 500, { error: String(err) });
    }
}

export async function apiCopilotSessionStop(req: http.IncomingMessage, res: http.ServerResponse, sessionId: string): Promise<void> {
    const state = sessions.get(sessionId);
    if (!state) {
        jsonResponse(res, 200, { error: "SessionNotFound" });
        return;
    }
    sessions.delete(sessionId);
    // Resolve any waiting live request
    if (state.waitingResolve) {
        const resolve = state.waitingResolve;
        state.waitingResolve = null;
        resolve({ error: "SessionNotFound" });
    }
    // Close CopilotClient if all sessions are closed
    await closeCopilotClientIfNoSessions();
    jsonResponse(res, 200, { result: "Closed" });
}

export async function apiCopilotSessionQuery(req: http.IncomingMessage, res: http.ServerResponse, sessionId: string): Promise<void> {
    const state = sessions.get(sessionId);
    if (!state) {
        jsonResponse(res, 200, { error: "SessionNotFound" });
        return;
    }
    const body = await readBody(req);
    // Fire and forget the request - responses come through live polling
    state.session.sendRequest(body).catch((err: unknown) => {
        state.sessionError = String(err);
        pushResponse(state, { sessionError: String(err) });
    });
    jsonResponse(res, 200, {});
}

export async function apiCopilotSessionLive(req: http.IncomingMessage, res: http.ServerResponse, sessionId: string): Promise<void> {
    const state = sessions.get(sessionId);
    if (!state) {
        jsonResponse(res, 200, { error: "SessionNotFound" });
        return;
    }
    if (state.waitingResolve) {
        jsonResponse(res, 200, { error: "ParallelCallNotSupported" });
        return;
    }
    const response = await waitForResponse(state, 5000);
    if (response === null) {
        jsonResponse(res, 200, { error: "HttpRequestTimeout" });
    } else {
        jsonResponse(res, 200, response);
    }
}
