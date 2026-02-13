import { MessageBlock } from "./messageBlock.js";

// ---- State ----
let sessionId = null;
let livePollingActive = false;
let sendEnabled = false;
const messageBlocks = new Map(); // key: "blockType-blockId" -> MessageBlock

// ---- DOM references ----
const setupUi = document.getElementById("setup-ui");
const sessionUi = document.getElementById("session-ui");
const modelSelect = document.getElementById("model-select");
const workingDirInput = document.getElementById("working-dir");
const startButton = document.getElementById("start-button");
const sessionPart = document.getElementById("session-part");
const requestTextarea = document.getElementById("request-textarea");
const sendButton = document.getElementById("send-button");
const stopButton = document.getElementById("stop-button");
const resizeBar = document.getElementById("resize-bar");
const requestPart = document.getElementById("request-part");
const awaitingStatus = document.getElementById("awaiting-status");

// ---- Setup: Load models and defaults ----

async function loadModels() {
    try {
        const res = await fetch("/api/copilot/models");
        const data = await res.json();
        const models = data.models.sort((a, b) => a.name.localeCompare(b.name));
        modelSelect.innerHTML = "";
        for (const m of models) {
            const option = document.createElement("option");
            option.value = m.id;
            option.textContent = m.name;
            modelSelect.appendChild(option);
        }
        // Default to gpt-5.2
        const defaultOption = modelSelect.querySelector('option[value="gpt-5.2"]');
        if (defaultOption) {
            defaultOption.selected = true;
        }
    } catch (err) {
        console.error("Failed to load models:", err);
    }
}

function initWorkingDir() {
    const params = new URLSearchParams(window.location.search);
    const project = params.get("project");
    if (project) {
        workingDirInput.value = `C:\\Code\\VczhLibraries\\${project}`;
    }
}

// ---- Start Session ----

startButton.addEventListener("click", async () => {
    const modelId = modelSelect.value;
    if (!modelId) return;

    startButton.disabled = true;
    try {
        const res = await fetch(`/api/copilot/session/start/${encodeURIComponent(modelId)}`, {
            method: "POST",
            body: workingDirInput.value,
        });
        const data = await res.json();
        if (data.error) {
            alert("Failed to start session: " + data.error);
            startButton.disabled = false;
            return;
        }
        sessionId = data.sessionId;
        setupUi.style.display = "none";
        sessionUi.style.display = "flex";
        sendEnabled = true;
        sendButton.disabled = false;
        startLivePolling();
    } catch (err) {
        alert("Failed to start session: " + err);
        startButton.disabled = false;
    }
});

// ---- Live Polling ----

function startLivePolling() {
    livePollingActive = true;
    pollLive();
}

async function pollLive() {
    while (livePollingActive) {
        try {
            const res = await fetch(`/api/copilot/session/live/${encodeURIComponent(sessionId)}`);
            if (!livePollingActive) break;
            const data = await res.json();
            if (!livePollingActive) break;

            if (data.error === "HttpRequestTimeout") {
                // Timeout, just resend
                continue;
            }
            if (data.error === "SessionNotFound") {
                livePollingActive = false;
                break;
            }
            if (data.sessionError) {
                console.error("Session error:", data.sessionError);
                continue;
            }
            if (data.callback) {
                processCallback(data);
            }
        } catch (err) {
            if (!livePollingActive) break;
            // Network error, retry after brief delay
            await new Promise(r => setTimeout(r, 500));
        }
    }
}

// ---- Process Callbacks ----

function getOrCreateBlock(blockType, blockId) {
    const key = `${blockType}-${blockId}`;
    let block = messageBlocks.get(key);
    if (!block) {
        block = new MessageBlock(blockType);
        messageBlocks.set(key, block);
        sessionPart.appendChild(block.divElement);
    }
    return block;
}

function processCallback(data) {
    const cb = data.callback;

    // Reasoning
    if (cb === "onStartReasoning") {
        getOrCreateBlock("Reasoning", data.reasoningId);
    } else if (cb === "onReasoning") {
        const block = getOrCreateBlock("Reasoning", data.reasoningId);
        block.appendData(data.delta);
    } else if (cb === "onEndReasoning") {
        const block = getOrCreateBlock("Reasoning", data.reasoningId);
        block.complete();
    }

    // Message
    else if (cb === "onStartMessage") {
        getOrCreateBlock("Message", data.messageId);
    } else if (cb === "onMessage") {
        const block = getOrCreateBlock("Message", data.messageId);
        block.appendData(data.delta);
    } else if (cb === "onEndMessage") {
        const block = getOrCreateBlock("Message", data.messageId);
        block.complete();
    }

    // Tool
    else if (cb === "onStartToolExecution") {
        const block = getOrCreateBlock("Tool", data.toolCallId);
        block.appendData(`${data.toolName}\n${data.toolArguments}`);
    } else if (cb === "onToolExecution") {
        const block = getOrCreateBlock("Tool", data.toolCallId);
        block.appendData(data.delta);
    } else if (cb === "onEndToolExecution") {
        const block = getOrCreateBlock("Tool", data.toolCallId);
        if (data.error) {
            block.appendData(`\nError: ${data.error.message}`);
        }
        block.complete();
    }

    // Agent lifecycle
    else if (cb === "onAgentEnd") {
        setSendEnabled(true);
    }

    // Auto-scroll session part to bottom
    sessionPart.scrollTop = sessionPart.scrollHeight;
}

// ---- Send / Request ----

function setSendEnabled(enabled) {
    sendEnabled = enabled;
    sendButton.disabled = !enabled;
    awaitingStatus.style.display = enabled ? "none" : "block";
}

async function sendRequest() {
    if (!sendEnabled) return;
    const text = requestTextarea.value.trim();
    if (!text) return;

    setSendEnabled(false);
    requestTextarea.value = "";

    // Create a "User" message block, append the request and immediately complete it
    const userBlock = new MessageBlock("User");
    const userKey = `User-request-${Date.now()}`;
    messageBlocks.set(userKey, userBlock);
    sessionPart.appendChild(userBlock.divElement);
    userBlock.appendData(text);
    userBlock.complete();
    sessionPart.scrollTop = sessionPart.scrollHeight;

    try {
        await fetch(`/api/copilot/session/query/${encodeURIComponent(sessionId)}`, {
            method: "POST",
            body: text,
        });
    } catch (err) {
        console.error("Failed to send query:", err);
        setSendEnabled(true);
    }
}

sendButton.addEventListener("click", sendRequest);

requestTextarea.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        sendRequest();
    }
});

// ---- Stop ----

stopButton.addEventListener("click", async () => {
    livePollingActive = false;
    try {
        await fetch(`/api/copilot/session/stop/${encodeURIComponent(sessionId)}`);
        await fetch("/api/stop");
    } catch (err) {
        // Ignore errors during shutdown
    }
    window.close();
});

// ---- Resize Bar ----

let resizing = false;

resizeBar.addEventListener("mousedown", (e) => {
    e.preventDefault();
    resizing = true;
});

document.addEventListener("mousemove", (e) => {
    if (!resizing) return;
    const containerRect = sessionUi.getBoundingClientRect();
    const newRequestHeight = containerRect.bottom - e.clientY - resizeBar.offsetHeight / 2;
    const clamped = Math.max(100, Math.min(newRequestHeight, containerRect.height - 100));
    requestPart.style.height = clamped + "px";
});

document.addEventListener("mouseup", () => {
    resizing = false;
});

// ---- Init ----

loadModels();
initWorkingDir();
