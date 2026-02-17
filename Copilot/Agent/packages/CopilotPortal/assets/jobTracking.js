// ---- Redirect if no jobId ----
const params = new URLSearchParams(window.location.search);
const jobId = params.get("jobId");
if (!jobId) {
    window.location.href = "/index.html";
}

// ---- DOM references ----
const jobPart = document.getElementById("job-part");
const sessionResponsePart = document.getElementById("session-response-part");
const resizeBar = document.getElementById("resize-bar");
const rightPart = document.getElementById("right-part");

// ---- Load job data and render chart ----
async function loadJobData() {
    try {
        const res = await fetch("/api/copilot/job");
        const data = await res.json();
        const jobDefinition = data.jobs[jobId];
        if (!jobDefinition) {
            jobPart.textContent = `Job "${jobId}" not found.`;
            return;
        }

        const chart = data.chart && data.chart[jobId];
        if (!chart || !chart.nodes || chart.nodes.length === 0) {
            jobPart.textContent = "No chart data available for this job.";
            return;
        }

        const pre = document.createElement("pre");
        pre.textContent = JSON.stringify({job: jobDefinition, chart}, undefined, 4);
        sessionResponsePart.appendChild(pre);

        // Render with Mermaid
        await renderFlowChartMermaid(chart, jobPart);
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
