import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

const BASE = "http://localhost:8888";

async function fetchJson(path, options) {
    const res = await fetch(`${BASE}${path}`, options);
    return res.json();
}

describe("API: /api/test", () => {
    it("returns hello world message", async () => {
        const data = await fetchJson("/api/test");
        assert.deepStrictEqual(data, { message: "Hello, world!" });
    });
});

describe("API: /api/config", () => {
    it("returns repoRoot as a non-empty string", async () => {
        const data = await fetchJson("/api/config");
        assert.ok(typeof data.repoRoot === "string", "repoRoot should be a string");
        assert.ok(data.repoRoot.length > 0, "repoRoot should not be empty");
    });
});

describe("API: /api/copilot/models", () => {
    it("returns an array of models", async () => {
        const data = await fetchJson("/api/copilot/models");
        assert.ok(Array.isArray(data.models), "models should be an array");
        assert.ok(data.models.length > 0, "should have at least one model");
    });

    it("each model has name, id, multiplier", async () => {
        const data = await fetchJson("/api/copilot/models");
        for (const m of data.models) {
            assert.ok(typeof m.name === "string", `model name should be string: ${JSON.stringify(m)}`);
            assert.ok(typeof m.id === "string", `model id should be string: ${JSON.stringify(m)}`);
            assert.ok(typeof m.multiplier === "number", `model multiplier should be number: ${JSON.stringify(m)}`);
        }
    });

    it("has at least one free model (multiplier=0)", async () => {
        const data = await fetchJson("/api/copilot/models");
        const freeModels = data.models.filter((m) => m.multiplier === 0);
        assert.ok(freeModels.length > 0, "should have at least one free model");
    });
});

describe("API: session not found errors", () => {
    it("live returns SessionNotFound for invalid session", async () => {
        const data = await fetchJson("/api/copilot/session/live/nonexistent");
        assert.deepStrictEqual(data, { error: "SessionNotFound" });
    });

    it("stop returns SessionNotFound for invalid session", async () => {
        const data = await fetchJson("/api/copilot/session/stop/nonexistent");
        assert.deepStrictEqual(data, { error: "SessionNotFound" });
    });

    it("query returns SessionNotFound for invalid session", async () => {
        const data = await fetchJson("/api/copilot/session/query/nonexistent", {
            method: "POST",
            body: "test",
        });
        assert.deepStrictEqual(data, { error: "SessionNotFound" });
    });
});

describe("API: full session lifecycle", () => {
    // Use a free model to avoid cost
    let freeModelId;
    let sessionId;

    before(async () => {
        const data = await fetchJson("/api/copilot/models");
        const freeModel = data.models.find((m) => m.multiplier === 0);
        assert.ok(freeModel, "need a free model for testing");
        freeModelId = freeModel.id;
    });

    after(async () => {
        // Clean up session if still open
        if (sessionId) {
            try {
                await fetchJson(`/api/copilot/session/stop/${sessionId}`);
            } catch {
                // ignore
            }
        }
    });

    it("starts a session and returns sessionId", async () => {
        const data = await fetchJson(`/api/copilot/session/start/${freeModelId}`, {
            method: "POST",
            body: "C:\\Code\\VczhLibraries\\Tools",
        });
        assert.ok(typeof data.sessionId === "string", "should return sessionId");
        sessionId = data.sessionId;
    });

    it("live returns HttpRequestTimeout when idle", async () => {
        assert.ok(sessionId, "session must be started");
        const data = await fetchJson(`/api/copilot/session/live/${sessionId}`);
        assert.strictEqual(data.error, "HttpRequestTimeout");
    });

    it("query sends request and returns empty object (no error)", async () => {
        assert.ok(sessionId, "session must be started");
        const data = await fetchJson(`/api/copilot/session/query/${sessionId}`, {
            method: "POST",
            body: "What is 2+2? Reply with a single number only.",
        });
        assert.strictEqual(data.error, undefined, "query should not return error");
    });

    it("live returns callbacks after query", async () => {
        assert.ok(sessionId, "session must be started");
        const callbacks = [];
        let gotAgentEnd = false;

        // Drain responses until onAgentEnd (max 60 seconds)
        const timeout = Date.now() + 60000;
        while (!gotAgentEnd && Date.now() < timeout) {
            const data = await fetchJson(`/api/copilot/session/live/${sessionId}`);
            if (data.error === "HttpRequestTimeout") continue;
            if (data.error) break;
            callbacks.push(data);
            if (data.callback === "onAgentEnd") gotAgentEnd = true;
        }

        assert.ok(gotAgentEnd, "should receive onAgentEnd callback");

        // Should have onAgentStart
        const agentStart = callbacks.find((c) => c.callback === "onAgentStart");
        assert.ok(agentStart, "should receive onAgentStart");

        // Should have at least one message flow
        const hasMessage = callbacks.some((c) => c.callback === "onStartMessage");
        const hasReasoning = callbacks.some((c) => c.callback === "onStartReasoning");
        assert.ok(hasMessage || hasReasoning, "should receive at least message or reasoning callbacks");
    });

    it("stops the session and returns Closed", async () => {
        assert.ok(sessionId, "session must be started");
        const data = await fetchJson(`/api/copilot/session/stop/${sessionId}`);
        assert.deepStrictEqual(data, { result: "Closed" });
        sessionId = null;
    });

    it("stopping again returns SessionNotFound", async () => {
        const data = await fetchJson("/api/copilot/session/stop/session-that-was-just-stopped");
        assert.deepStrictEqual(data, { error: "SessionNotFound" });
    });
});


