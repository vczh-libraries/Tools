import { SessionResponseRenderer } from "./sessionResponse.js";

// ---- Redirect if no jobName or jobId ----
const params = new URLSearchParams(window.location.search);
const jobName = params.get("jobName");
const jobId = params.get("jobId");
if (!jobName || !jobId) {
    window.location.href = "/index.html";
}

// ---- DOM references ----
const jobPart = document.getElementById("job-part");
const sessionResponsePart = document.getElementById("session-response-part");
const resizeBar = document.getElementById("resize-bar");
const rightPart = document.getElementById("right-part");

// ---- State ----
let chartController = null; // returned from renderFlowChartMermaid
let jobStatus = "RUNNING"; // RUNNING | SUCCEEDED | FAILED | CANCELED
let jobStopped = false;

// Map: workId -> { taskId, sessions: Map<sessionId, { name, renderer, div, active }>, attemptCount }
const workIdData = {};

// Currently inspected workId (null = none)
let inspectedWorkId = null;

// ---- JSON display state ----
let jobToRender = null;
let chartToRender = null;
let jsonPre = null;

// ---- Session response tab control ----
let tabContainer = null;

// ---- Job status bar elements ----
let statusLabel = null;
let stopJobButton = null;

function createStatusBar() {
    const bar = document.createElement("div");
    bar.id = "job-status-bar";

    statusLabel = document.createElement("div");
    statusLabel.id = "job-status-label";
    statusLabel.textContent = "JOB: RUNNING";
    bar.appendChild(statusLabel);

    stopJobButton = document.createElement("button");
    stopJobButton.id = "stop-job-button";
    stopJobButton.textContent = "Stop Job";
    stopJobButton.addEventListener("click", async () => {
        if (jobStopped) return;
        try {
            await fetch(`/api/copilot/job/${encodeURIComponent(jobId)}/stop`, { method: "POST" });
            jobStopped = true;
            jobStatus = "CANCELED";
            updateStatusLabel();
            stopJobButton.disabled = true;
        } catch (err) {
            console.error("Failed to stop job:", err);
        }
    });
    bar.appendChild(stopJobButton);

    return bar;
}

function updateStatusLabel() {
    if (statusLabel) {
        statusLabel.textContent = `JOB: ${jobStatus}`;
        statusLabel.className = "";
        statusLabel.classList.add(`job-status-${jobStatus.toLowerCase()}`);
    }
    if (stopJobButton) {
        stopJobButton.disabled = jobStatus !== "RUNNING";
    }
}

// ---- Session Response Part Management ----

function showJsonView() {
    sessionResponsePart.innerHTML = "";
    if (tabContainer) {
        tabContainer = null;
    }
    jsonPre = document.createElement("pre");
    jsonPre.textContent = JSON.stringify({ job: jobToRender, chart: chartToRender }, undefined, 4);
    sessionResponsePart.appendChild(jsonPre);
}

function showTaskSessionTabs(workId) {
    sessionResponsePart.innerHTML = "";
    const data = workIdData[workId];
    if (!data) {
        sessionResponsePart.textContent = "No session data for this task.";
        return;
    }

    tabContainer = document.createElement("div");
    tabContainer.className = "tab-container";

    const tabHeaders = document.createElement("div");
    tabHeaders.className = "tab-headers";
    tabContainer.appendChild(tabHeaders);

    const tabContent = document.createElement("div");
    tabContent.className = "tab-content";
    tabContainer.appendChild(tabContent);

    sessionResponsePart.appendChild(tabContainer);

    let activeTab = null;

    for (const [sessionId, sessionInfo] of data.sessions) {
        const tabBtn = document.createElement("button");
        tabBtn.className = "tab-header-btn";
        tabBtn.textContent = sessionInfo.name;
        tabBtn.dataset.sessionId = sessionId;
        tabBtn.addEventListener("click", () => {
            switchTab(sessionId);
        });
        tabHeaders.appendChild(tabBtn);

        // Append the session's div to tab content (hidden by default)
        sessionInfo.div.style.display = "none";
        tabContent.appendChild(sessionInfo.div);
    }

    // Activate the first tab
    const firstEntry = data.sessions.entries().next().value;
    if (firstEntry) {
        switchTab(firstEntry[0]);
    }

    function switchTab(sessionId) {
        if (activeTab === sessionId) return;
        activeTab = sessionId;
        // Update header buttons
        for (const btn of tabHeaders.querySelectorAll(".tab-header-btn")) {
            btn.classList.toggle("active", btn.dataset.sessionId === sessionId);
        }
        // Show/hide tab content
        for (const [sid, sInfo] of data.sessions) {
            sInfo.div.style.display = sid === sessionId ? "block" : "none";
        }
    }
}

function refreshSessionResponsePart() {
    if (inspectedWorkId !== null) {
        showTaskSessionTabs(inspectedWorkId);
    } else {
        showJsonView();
    }
}

function onInspect(workId) {
    inspectedWorkId = workId;
    refreshSessionResponsePart();
}

// ---- Live Polling Helpers ----

async function pollLive(url, handler, shouldStop) {
    while (true) {
        if (shouldStop()) break;
        try {
            const res = await fetch(`/api/${url}`);
            const data = await res.json();
            if (data.error === "HttpRequestTimeout") continue;
            // Only treat error as a system-level stop signal when there's no callback field.
            // Callback payloads like onEndToolExecution can have an error field as part of the data.
            if (data.error && !data.callback) break;
            if (data.jobError || data.taskError || data.sessionError) {
                handler(data);
                break;
            }
            const shouldContinue = handler(data);
            if (shouldContinue === false) break;
        } catch (err) {
            console.error(`Poll error for ${url}:`, err);
            break;
        }
    }
}

// ---- Session Polling ----

function startSessionPolling(sessionId, workId) {
    const data = workIdData[workId];
    if (!data) return;

    const sessionInfo = data.sessions.get(sessionId);
    if (!sessionInfo) return;

    pollLive(
        `copilot/session/${encodeURIComponent(sessionId)}/live`,
        (response) => {
            if (response.sessionError) {
                console.error(`Session ${sessionId} error:`, response.sessionError);
                return false;
            }
            if (response.callback) {
                sessionInfo.renderer.processCallback(response);
            }
            return true;
        },
        () => !sessionInfo.active
    );
}

// ---- Task Polling ----

function startTaskPolling(taskId, workId) {
    const data = workIdData[workId];
    if (!data) return;
    data.taskPollingActive = true;

    pollLive(
        `copilot/task/${encodeURIComponent(taskId)}/live`,
        (response) => {
            if (response.taskError) {
                console.error(`Task ${taskId} error:`, response.taskError);
                return false;
            }
            const cb = response.callback;

            if (cb === "taskSessionStarted") {
                const sessionId = response.sessionId;
                const isDriving = response.isDriving;
                if (sessionId) {
                    let name;
                    if (isDriving) {
                        name = "Driving";
                    } else {
                        data.attemptCount = (data.attemptCount || 0) + 1;
                        name = `Attempt #${data.attemptCount}`;
                    }

                    const div = document.createElement("div");
                    div.className = "session-renderer-container";
                    const renderer = new SessionResponseRenderer(div);

                    data.sessions.set(sessionId, {
                        name,
                        renderer,
                        div,
                        active: true,
                    });

                    // If this task is currently inspected, update the tab display
                    if (inspectedWorkId === workId) {
                        // Add new tab header without switching to it
                        if (tabContainer) {
                            const tabHeaders = tabContainer.querySelector(".tab-headers");
                            const tabContent = tabContainer.querySelector(".tab-content");
                            if (tabHeaders && tabContent) {
                                const tabBtn = document.createElement("button");
                                tabBtn.className = "tab-header-btn";
                                tabBtn.textContent = name;
                                tabBtn.dataset.sessionId = sessionId;
                                tabBtn.addEventListener("click", () => {
                                    // Activate this tab
                                    for (const btn of tabHeaders.querySelectorAll(".tab-header-btn")) {
                                        btn.classList.toggle("active", btn.dataset.sessionId === sessionId);
                                    }
                                    for (const [sid, sInfo] of data.sessions) {
                                        sInfo.div.style.display = sid === sessionId ? "block" : "none";
                                    }
                                });
                                tabHeaders.appendChild(tabBtn);

                                div.style.display = "none";
                                tabContent.appendChild(div);
                            }
                        }
                    }

                    // Start polling this session
                    startSessionPolling(sessionId, workId);
                }
            } else if (cb === "taskSessionStopped") {
                const sessionId = response.sessionId;
                if (sessionId) {
                    const sInfo = data.sessions.get(sessionId);
                    if (sInfo) {
                        sInfo.active = false;
                    }
                }
            } else if (cb === "taskSucceeded" || cb === "taskFailed") {
                // Stop all session polling for this task
                for (const [, sInfo] of data.sessions) {
                    sInfo.active = false;
                }
                data.taskPollingActive = false;
                return false;
            } else if (cb === "taskDecision") {
                // Create a "User" message block in the driving session's renderer
                const drivingEntry = [...data.sessions.entries()].find(([, s]) => s.name === "Driving");
                if (drivingEntry) {
                    const [, drivingInfo] = drivingEntry;
                    drivingInfo.renderer.addUserMessage(response.reason, "TaskDecision");
                }
            }

            return true;
        },
        () => !data.taskPollingActive
    );
}

// ---- Job Polling ----

function startJobPolling() {
    pollLive(
        `copilot/job/${encodeURIComponent(jobId)}/live`,
        (response) => {
            if (response.jobError) {
                jobStatus = "FAILED";
                updateStatusLabel();
                return false;
            }
            const cb = response.callback;

            if (cb === "workStarted") {
                const workId = response.workId;
                const taskId = response.taskId;

                // Clear previous data if task runs again (loop scenario)
                if (workIdData[workId]) {
                    const oldData = workIdData[workId];
                    // Stop all old session polling
                    for (const [, sInfo] of oldData.sessions) {
                        sInfo.active = false;
                    }
                    oldData.taskPollingActive = false;
                }

                workIdData[workId] = {
                    taskId,
                    sessions: new Map(),
                    attemptCount: 0,
                    taskPollingActive: false,
                };

                // Update flow chart - running indicator
                if (chartController) {
                    chartController.setRunning(workId);
                }

                // Start task polling
                if (taskId) {
                    startTaskPolling(taskId, workId);
                }
            } else if (cb === "workStopped") {
                const workId = response.workId;
                const succeeded = response.succeeded;

                if (chartController) {
                    if (succeeded) {
                        chartController.setCompleted(workId);
                    } else {
                        chartController.setFailed(workId);
                    }
                }
            } else if (cb === "jobSucceeded") {
                jobStatus = "SUCCEEDED";
                updateStatusLabel();
                return false;
            } else if (cb === "jobFailed") {
                jobStatus = "FAILED";
                updateStatusLabel();
                return false;
            }

            return true;
        },
        () => jobStopped
    );
}

// ---- Load job data and render chart ----
async function loadJobData() {
    try {
        const res = await fetch("/api/copilot/job");
        const data = await res.json();
        const jobDefinition = data.jobs[jobName];
        if (!jobDefinition) {
            jobPart.textContent = `Job "${jobName}" not found.`;
            return;
        }

        const chart = data.chart && data.chart[jobName];
        if (!chart || !chart.nodes || chart.nodes.length === 0) {
            jobPart.textContent = "No chart data available for this job.";
            return;
        }

        jobToRender = jobDefinition;
        chartToRender = chart;

        // Show JSON initially
        showJsonView();

        // Create status bar
        const statusBar = createStatusBar();

        // Build job part layout
        jobPart.innerHTML = "";
        jobPart.appendChild(statusBar);

        const chartContainer = document.createElement("div");
        chartContainer.id = "chart-container";
        jobPart.appendChild(chartContainer);

        // Render with Mermaid
        chartController = await renderFlowChartMermaid(chart, chartContainer, onInspect);

        // Start job live polling
        startJobPolling();
    } catch (err) {
        console.error("Failed to load job data:", err);
        jobPart.textContent = "Failed to load job data.";
    }
}

// ---- Resize bar (horizontal) ----
let resizing = false;

resizeBar.addEventListener("mousedown", (e) => {
    resizing = true;
    e.preventDefault();
});

document.addEventListener("mousemove", (e) => {
    if (!resizing) return;
    const totalWidth = document.body.clientWidth;
    const barWidth = resizeBar.offsetWidth;
    let rightWidth = totalWidth - e.clientX - barWidth / 2;
    if (rightWidth < 200) rightWidth = 200;
    if (rightWidth > totalWidth - 200) rightWidth = totalWidth - 200;
    rightPart.style.width = rightWidth + "px";
});

document.addEventListener("mouseup", () => {
    resizing = false;
});

// ---- Init ----
loadJobData();
