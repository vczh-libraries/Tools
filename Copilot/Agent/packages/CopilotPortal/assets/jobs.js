// ---- Redirect if no working directory ----
const params = new URLSearchParams(window.location.search);
const workingDir = params.get("wd");
if (!workingDir) {
    window.location.href = "/index.html";
}

// ---- State ----
let selectedJobName = null;
let jobsData = null;

// ---- DOM references ----
const matrixPart = document.getElementById("matrix-part");
const jobPart = document.getElementById("job-part");
const userInputPart = document.getElementById("user-input-part");
const sessionResponsePart = document.getElementById("session-response-part");
const startJobButton = document.getElementById("start-job-button");
const resizeBar = document.getElementById("resize-bar");
const leftPart = document.getElementById("left-part");
const rightPart = document.getElementById("right-part");

// ---- Load jobs data ----
async function loadJobs() {
    try {
        const res = await fetch("/api/copilot/job");
        jobsData = await res.json();
        renderMatrix();
    } catch (err) {
        console.error("Failed to load jobs:", err);
    }
}

// ---- Matrix Rendering ----
function renderMatrix() {
    matrixPart.innerHTML = "";
    const grid = jobsData.grid;

    if (grid.length === 0) {
        matrixPart.textContent = "No jobs available.";
        return;
    }

    const table = document.createElement("table");
    table.id = "matrix-table";

    // Title row
    const titleRow = document.createElement("tr");
    // Count max columns: keyword + automate(if any) + max jobs
    const hasAutomate = grid.some(row => row.automate);
    const maxJobCols = Math.max(...grid.map(row => row.jobs.length));
    const totalCols = 1 + (hasAutomate ? 1 : 0) + maxJobCols;
    const titleCell = document.createElement("th");
    titleCell.colSpan = totalCols;
    titleCell.textContent = "Available Jobs";
    titleCell.className = "matrix-title";
    titleRow.appendChild(titleCell);
    table.appendChild(titleRow);

    // Data rows
    for (const row of grid) {
        const tr = document.createElement("tr");

        // Keyword column
        const kwCell = document.createElement("td");
        kwCell.textContent = row.keyword;
        kwCell.className = "matrix-keyword";
        tr.appendChild(kwCell);

        // Automate column (only if any row has automate)
        if (hasAutomate) {
            const autoCell = document.createElement("td");
            if (row.automate) {
                const btn = document.createElement("button");
                btn.textContent = "automate";
                btn.className = "matrix-automate-btn";
                autoCell.appendChild(btn);
            }
            tr.appendChild(autoCell);
        }

        // Job columns
        for (let i = 0; i < maxJobCols; i++) {
            const jobCell = document.createElement("td");
            if (i < row.jobs.length) {
                const col = row.jobs[i];
                const btn = document.createElement("button");
                btn.textContent = col.name;
                btn.className = "matrix-job-btn";
                btn.dataset.jobName = col.jobName;
                btn.addEventListener("click", () => onJobButtonClick(btn, col.jobName));
                jobCell.appendChild(btn);
            }
            tr.appendChild(jobCell);
        }

        table.appendChild(tr);
    }

    matrixPart.appendChild(table);
}

// ---- Job Selection ----
function onJobButtonClick(btn, jobName) {
    if (selectedJobName === jobName) {
        // Deselect
        btn.classList.remove("selected");
        selectedJobName = null;
        startJobButton.disabled = true;
        startJobButton.textContent = "Job Not Selected";
    } else {
        // Deselect previous
        const prev = matrixPart.querySelector(".matrix-job-btn.selected");
        if (prev) prev.classList.remove("selected");
        // Select new
        btn.classList.add("selected");
        selectedJobName = jobName;
        startJobButton.disabled = false;
        startJobButton.textContent = `Start Job: ${jobName}`;
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
loadJobs();
