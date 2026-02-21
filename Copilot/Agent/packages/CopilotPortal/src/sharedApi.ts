import * as http from "node:http";
import { CopilotClient } from "@github/copilot-sdk";

// ---- Helpers ----

export function readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        req.on("error", reject);
    });
}

export function jsonResponse(res: http.ServerResponse, statusCode: number, data: unknown): void {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}

// ---- Test Mode ----

let _testMode = false;
export function setTestMode(value: boolean): void { _testMode = value; }
export function isTestMode(): boolean { return _testMode; }
export function getCountDownMs(): number { return _testMode ? 5000 : 60000; }

// ---- Token-based Live State ----

export interface LiveResponse {
    [key: string]: unknown;
}

export interface TokenState {
    position: number;
    pendingResolve: ((response: LiveResponse | null) => void) | null;
}

export interface LiveEntityState {
    responses: LiveResponse[];
    tokens: Map<string, TokenState>;
    closed: boolean;
    countDownBegin: number | undefined; // undefined while entity is running
    countDownMs: number;
    onDelete?: () => void;
}

export function createLiveEntityState(countDownMs: number, onDelete?: () => void): LiveEntityState {
    return {
        responses: [],
        tokens: new Map(),
        closed: false,
        countDownBegin: undefined,
        countDownMs,
        onDelete,
    };
}

export function pushLiveResponse(entity: LiveEntityState, response: LiveResponse): void {
    const index = entity.responses.length;
    entity.responses.push(response);
    for (const [, tokenState] of entity.tokens) {
        if (tokenState.position === index && tokenState.pendingResolve) {
            const resolve = tokenState.pendingResolve;
            tokenState.pendingResolve = null;
            tokenState.position++;
            resolve(response);
        }
    }
}

export function closeLiveEntity(entity: LiveEntityState): void {
    entity.closed = true;
    entity.countDownBegin = Date.now();
    // Wake up all tokens that are waiting and fully drained
    for (const [token, tokenState] of entity.tokens) {
        if (tokenState.pendingResolve && tokenState.position >= entity.responses.length) {
            const resolve = tokenState.pendingResolve;
            tokenState.pendingResolve = null;
            resolve(null); // null triggers closed check in waitForLiveResponse
        }
    }
}

function tryCleanupEntity(entity: LiveEntityState, token: string): void {
    entity.tokens.delete(token);
    if (entity.tokens.size === 0 && entity.onDelete) {
        entity.onDelete();
    }
}

export function waitForLiveResponse(
    entity: LiveEntityState | undefined,
    token: string,
    timeoutMs: number,
    notFoundError: string,
    closedError: string,
): Promise<LiveResponse> {
    // Entity doesn't exist
    if (!entity) {
        return Promise.resolve({ error: notFoundError });
    }

    // Check if token is known
    let tokenState = entity.tokens.get(token);
    if (!tokenState) {
        // New token — check lifecycle
        if (entity.countDownBegin !== undefined) {
            if (Date.now() - entity.countDownBegin > entity.countDownMs) {
                return Promise.resolve({ error: notFoundError });
            }
        }
        tokenState = { position: 0, pendingResolve: null };
        entity.tokens.set(token, tokenState);
    }

    // Check parallel call on same (entity, token)
    if (tokenState.pendingResolve) {
        return Promise.resolve({ error: "ParallelCallNotSupported" });
    }

    // Batch drain: return ALL available responses from current position
    if (tokenState.position < entity.responses.length) {
        const raw = entity.responses.slice(tokenState.position);
        tokenState.position = entity.responses.length;

        // If onEndReasoning/onEndMessage for an id exists in the batch,
        // skip all onReasoning/onMessage for that id (the end carries complete content).
        const endReasoningIds = new Set<string>();
        const endMessageIds = new Set<string>();
        for (const r of raw) {
            if (r.callback === "onEndReasoning") endReasoningIds.add(r.reasoningId as string);
            if (r.callback === "onEndMessage") endMessageIds.add(r.messageId as string);
        }
        const responses = (endReasoningIds.size > 0 || endMessageIds.size > 0)
            ? raw.filter(r => {
                if (r.callback === "onReasoning" && endReasoningIds.has(r.reasoningId as string)) return false;
                if (r.callback === "onMessage" && endMessageIds.has(r.messageId as string)) return false;
                return true;
            })
            : raw;

        return Promise.resolve({ responses });
    }

    // Closed and fully drained?
    if (entity.closed && tokenState.position >= entity.responses.length) {
        tryCleanupEntity(entity, token);
        return Promise.resolve({ error: closedError });
    }

    // Wait for next response or timeout
    const ts = tokenState;
    const ent = entity;
    return new Promise((resolve) => {
        ts.pendingResolve = (response: LiveResponse | null) => {
            if (response === null) {
                // Timeout or closed notification
                if (ent.closed && ts.position >= ent.responses.length) {
                    tryCleanupEntity(ent, token);
                    resolve({ error: closedError });
                } else {
                    resolve({ error: "HttpRequestTimeout" });
                }
            } else {
                // Single response from pushLiveResponse; wrap in batch format
                resolve({ responses: [response] });
            }
        };
        setTimeout(() => {
            if (ts.pendingResolve) {
                const pendingResolve = ts.pendingResolve;
                ts.pendingResolve = null;
                pendingResolve(null);
            }
        }, timeoutMs);
    });
}

export function shutdownLiveEntity(entity: LiveEntityState): void {
    // Resolve all pending token waits with not-found and clear
    for (const [, tokenState] of entity.tokens) {
        if (tokenState.pendingResolve) {
            const resolve = tokenState.pendingResolve;
            tokenState.pendingResolve = null;
            resolve(null);
        }
    }
    entity.tokens.clear();
}

// ---- Copilot Client ----

let copilotClient: CopilotClient | null = null;
let copilotClientPromise: Promise<CopilotClient> | null = null;

export async function ensureCopilotClient(): Promise<CopilotClient> {
    if (copilotClient) return copilotClient;
    if (!copilotClientPromise) {
        copilotClientPromise = (async () => {
            const client = new CopilotClient();
            await client.start();
            copilotClient = client;
            copilotClientPromise = null;
            return client;
        })();
    }
    return copilotClientPromise;
}

export function stopCoplilotClient(): void {
    copilotClientPromise = null;
    if (copilotClient) {
        copilotClient.stop();
        copilotClient = null;
    }
}
