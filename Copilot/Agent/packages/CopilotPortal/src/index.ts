import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { CopilotClient } from "@github/copilot-sdk";
import { startSession } from "copilot-api";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = parseInt(process.argv[2] ?? "8888", 10);

const mimeTypes: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
};

// assets folder is at packages/CopilotPortal/assets, __dirname is packages/CopilotPortal/dist
const assetsDir = path.resolve(__dirname, "..", "assets");

// REPO-ROOT: the root folder of the repo (5 levels up from dist/)
const repoRoot = path.resolve(__dirname, "..", "..", "..", "..", "..");

// ---- Copilot Client ----
let copilotClient: CopilotClient | null = null;

async function ensureCopilotClient(): Promise<CopilotClient> {
    if (!copilotClient) {
        copilotClient = new CopilotClient();
        await copilotClient.start();
    }
    return copilotClient;
}

async function closeCopilotClientIfNoSessions(): Promise<void> {
    if (sessions.size === 0 && copilotClient) {
        await copilotClient.stop();
        copilotClient = null;
    }
}

// ---- Session Management ----

interface SessionResponse {
    [key: string]: unknown;
}

interface SessionState {
    session: Awaited<ReturnType<typeof startSession>>;
    responseQueue: SessionResponse[];
    waitingResolve: ((response: SessionResponse) => void) | null;
    sessionError: string | null;
}

const sessions = new Map<string, SessionState>();
let nextSessionId = 1;

// ---- Helpers ----

function readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        req.on("error", reject);
    });
}

function jsonResponse(res: http.ServerResponse, statusCode: number, data: unknown): void {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}

function pushResponse(state: SessionState, response: SessionResponse): void {
    if (state.waitingResolve) {
        const resolve = state.waitingResolve;
        state.waitingResolve = null;
        resolve(response);
    } else {
        state.responseQueue.push(response);
    }
}

function waitForResponse(state: SessionState, timeoutMs: number): Promise<SessionResponse | null> {
    return new Promise((resolve) => {
        if (state.responseQueue.length > 0) {
            resolve(state.responseQueue.shift()!);
            return;
        }
        state.waitingResolve = resolve as (response: SessionResponse) => void;
        setTimeout(() => {
            if (state.waitingResolve === resolve) {
                state.waitingResolve = null;
                resolve(null);
            }
        }, timeoutMs);
    });
}

// ---- Static File Serving ----

function serveStaticFile(res: http.ServerResponse, filePath: string): void {
    if (!fs.existsSync(filePath)) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] ?? "application/octet-stream";
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
}

// ---- API Handler ----

async function handleApi(req: http.IncomingMessage, res: http.ServerResponse, apiPath: string): Promise<void> {
    // api/test
    if (apiPath === "test") {
        jsonResponse(res, 200, { message: "Hello, world!" });
        return;
    }

    // api/config
    if (apiPath === "config") {
        jsonResponse(res, 200, { repoRoot });
        return;
    }

    // api/stop
    if (apiPath === "stop") {
        jsonResponse(res, 200, {});
        console.log("Shutting down...");
        if (copilotClient) {
            await copilotClient.stop();
            copilotClient = null;
        }
        server.close(() => {
            process.exit(0);
        });
        return;
    }

    // api/copilot/models
    if (apiPath === "copilot/models") {
        try {
            const client = await ensureCopilotClient();
            const modelList = await client.listModels();
            const models = modelList.map((m: { name: string; id: string; billing?: { multiplier?: number } }) => ({
                name: m.name,
                id: m.id,
                multiplier: m.billing?.multiplier ?? 1,
            }));
            jsonResponse(res, 200, { models });
        } catch (err) {
            jsonResponse(res, 500, { error: String(err) });
        }
        return;
    }

    // api/copilot/session/start/{model-id}
    const startMatch = apiPath.match(/^copilot\/session\/start\/(.+)$/);
    if (startMatch) {
        const modelId = startMatch[1];
        const body = await readBody(req);
        const workingDirectory = body.trim() || undefined;
        try {
            const client = await ensureCopilotClient();
            const sessionId = `session-${nextSessionId++}`;
            const state: SessionState = {
                session: null as unknown as SessionState["session"],
                responseQueue: [],
                waitingResolve: null,
                sessionError: null,
            };

            const session = await startSession(client, modelId, {
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
            }, workingDirectory);

            state.session = session;
            sessions.set(sessionId, state);
            jsonResponse(res, 200, { sessionId });
        } catch (err) {
            jsonResponse(res, 500, { error: String(err) });
        }
        return;
    }

    // api/copilot/session/stop/{session-id}
    const stopMatch = apiPath.match(/^copilot\/session\/stop\/(.+)$/);
    if (stopMatch) {
        const sessionId = stopMatch[1];
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
        return;
    }

    // api/copilot/session/query/{session-id}
    const queryMatch = apiPath.match(/^copilot\/session\/query\/(.+)$/);
    if (queryMatch) {
        const sessionId = queryMatch[1];
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
        return;
    }

    // api/copilot/session/live/{session-id}
    const liveMatch = apiPath.match(/^copilot\/session\/live\/(.+)$/);
    if (liveMatch) {
        const sessionId = liveMatch[1];
        const state = sessions.get(sessionId);
        if (!state) {
            jsonResponse(res, 200, { error: "SessionNotFound" });
            return;
        }
        const response = await waitForResponse(state, 5000);
        if (response === null) {
            jsonResponse(res, 200, { error: "HttpRequestTimeout" });
        } else {
            jsonResponse(res, 200, response);
        }
        return;
    }

    jsonResponse(res, 404, { error: "Unknown API endpoint" });
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    let pathname = url.pathname;

    // API routes
    if (pathname.startsWith("/api/")) {
        const apiPath = pathname.slice("/api/".length);
        handleApi(req, res, apiPath).catch((err) => {
            console.error("API error:", err);
            jsonResponse(res, 500, { error: String(err) });
        });
        return;
    }

    // Website routes
    if (pathname === "/") {
        pathname = "/index.html";
    }

    const filePath = path.join(assetsDir, pathname);
    serveStaticFile(res, filePath);
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log("Use api/stop to stop the server.");
});
