// ---- Redirect if no jobId ----
const params = new URLSearchParams(window.location.search);
const jobId = params.get("jobId");
const workingDir = params.get("wb");
const userInput = params.get("userInput") || "";
if (!jobId) {
    window.location.href = "/index.html";
}

// ---- DOM references ----
const jobPart = document.getElementById("job-part");
const sessionResponsePart = document.getElementById("session-response-part");
const resizeBar = document.getElementById("resize-bar");
const rightPart = document.getElementById("right-part");

// ---- ELK instance ----
const elk = new ELK();

// ---- State ----
let jobDefinition = null;
let elkGraph = null;
let nodeElements = {};
let expandedNodes = new Set();

// ---- Load job data ----
async function loadJobData() {
    try {
        const res = await fetch("/api/copilot/job");
        const data = await res.json();
        jobDefinition = data.jobs[jobId];
        if (!jobDefinition) {
            jobPart.textContent = `Job "${jobId}" not found.`;
            return;
        }
        await renderFlowChart(jobDefinition.work);
    } catch (err) {
        console.error("Failed to load job data:", err);
        jobPart.textContent = "Failed to load job data.";
    }
}

// ---- Flow Chart Rendering ----

let nextNodeId = 0;
function genId(prefix) {
    return `${prefix}-${nextNodeId++}`;
}

// Convert Work AST to ELK graph nodes and edges
function workToElk(work, nodes, edges) {
    switch (work.kind) {
        case "Ref": {
            const id = `task-${work.workIdInJob}`;
            const textWidth = Math.max(120, work.taskId.length * 8 + 20);
            nodes.push({
                id,
                width: textWidth,
                height: 40,
                labels: [{ text: work.taskId }],
                _type: "task",
                _work: work,
            });
            return { entryId: id, exitId: id };
        }
        case "Seq": {
            if (work.works.length === 0) {
                const id = genId("pass");
                nodes.push({
                    id,
                    width: 60,
                    height: 30,
                    labels: [{ text: "pass" }],
                    _type: "pass",
                });
                return { entryId: id, exitId: id };
            }
            let prevExit = null;
            let firstEntry = null;
            let lastExit = null;
            for (const child of work.works) {
                const sub = workToElk(child, nodes, edges);
                if (firstEntry === null) firstEntry = sub.entryId;
                if (prevExit !== null) {
                    edges.push({
                        id: genId("edge"),
                        sources: [prevExit],
                        targets: [sub.entryId],
                    });
                }
                prevExit = sub.exitId;
                lastExit = sub.exitId;
            }
            return { entryId: firstEntry, exitId: lastExit };
        }
        case "Par": {
            if (work.works.length === 0) {
                const id = genId("pass");
                nodes.push({
                    id,
                    width: 60,
                    height: 30,
                    labels: [{ text: "pass" }],
                    _type: "pass",
                });
                return { entryId: id, exitId: id };
            }
            const forkId = genId("fork");
            const joinId = genId("join");
            nodes.push({ id: forkId, width: 40, height: 8, labels: [], _type: "fork" });
            nodes.push({ id: joinId, width: 40, height: 8, labels: [], _type: "join" });
            for (const child of work.works) {
                const sub = workToElk(child, nodes, edges);
                edges.push({ id: genId("edge"), sources: [forkId], targets: [sub.entryId] });
                edges.push({ id: genId("edge"), sources: [sub.exitId], targets: [joinId] });
            }
            return { entryId: forkId, exitId: joinId };
        }
        case "Loop": {
            let entryId = null;
            let bodyResult;
            let preCondResult = null;

            // preCondition
            if (work.preCondition) {
                const [expectedBool, condWork] = work.preCondition;
                const condId = genId("cond");
                nodes.push({
                    id: condId,
                    width: 60,
                    height: 60,
                    labels: [{ text: "?" }],
                    _type: "condition",
                    _condWork: condWork,
                });
                // Render the condition's sub-work
                const condSub = workToElk(condWork, nodes, edges);
                edges.push({ id: genId("edge"), sources: [condId], targets: [condSub.entryId] });
                // Use condSub.exitId -> condId feedback for the decision
                // Actually the condition node IS the decision point
                // Let me simplify: the condition work is evaluated, its exit leads to the decision
                // Re-approach: condition work is the evaluation, its exit is the decision
                // For ELK, represent pre-condition as: condSub -> decision diamond
                // Actually, let me use the condSub directly as the entry
                preCondResult = condSub;
                entryId = condSub.entryId;

                const skipId = genId("skip");
                nodes.push({
                    id: skipId, width: 1, height: 1, labels: [],
                    _type: "invisible",
                });

                const enterLabel = expectedBool ? "enter" : "skip";
                const skipLabel = expectedBool ? "skip" : "enter";

                // Body
                bodyResult = workToElk(work.body, nodes, edges);
                edges.push({
                    id: genId("edge"),
                    sources: [condSub.exitId],
                    targets: [bodyResult.entryId],
                    labels: [{ text: enterLabel }],
                });
                edges.push({
                    id: genId("edge"),
                    sources: [condSub.exitId],
                    targets: [skipId],
                    labels: [{ text: skipLabel }],
                });

                // postCondition
                if (work.postCondition) {
                    const [postExpBool, postCondWork] = work.postCondition;
                    const postSub = workToElk(postCondWork, nodes, edges);
                    edges.push({
                        id: genId("edge"),
                        sources: [bodyResult.exitId],
                        targets: [postSub.entryId],
                    });
                    edges.push({
                        id: genId("edge"),
                        sources: [postSub.exitId],
                        targets: [entryId],
                        labels: [{ text: postExpBool ? "repeat" : "exit" }],
                        _backEdge: true,
                    });
                    edges.push({
                        id: genId("edge"),
                        sources: [postSub.exitId],
                        targets: [skipId],
                        labels: [{ text: postExpBool ? "exit" : "repeat" }],
                    });
                    return { entryId, exitId: skipId };
                }

                return { entryId, exitId: skipId };
            } else {
                // No preCondition
                bodyResult = workToElk(work.body, nodes, edges);
                entryId = bodyResult.entryId;

                if (work.postCondition) {
                    const [postExpBool, postCondWork] = work.postCondition;
                    const postSub = workToElk(postCondWork, nodes, edges);
                    edges.push({
                        id: genId("edge"),
                        sources: [bodyResult.exitId],
                        targets: [postSub.entryId],
                    });

                    const exitId = genId("loop-exit");
                    nodes.push({
                        id: exitId, width: 1, height: 1, labels: [],
                        _type: "invisible",
                    });

                    edges.push({
                        id: genId("edge"),
                        sources: [postSub.exitId],
                        targets: [entryId],
                        labels: [{ text: postExpBool ? "repeat" : "exit" }],
                        _backEdge: true,
                    });
                    edges.push({
                        id: genId("edge"),
                        sources: [postSub.exitId],
                        targets: [exitId],
                        labels: [{ text: postExpBool ? "exit" : "repeat" }],
                    });
                    return { entryId, exitId };
                }

                return { entryId: bodyResult.entryId, exitId: bodyResult.exitId };
            }
        }
        case "Alt": {
            // Condition as decision diamond
            const condSub = workToElk(work.condition, nodes, edges);

            const mergeId = genId("merge");
            nodes.push({
                id: mergeId,
                width: 20,
                height: 20,
                labels: [],
                _type: "merge",
            });

            if (work.trueWork) {
                const trueSub = workToElk(work.trueWork, nodes, edges);
                edges.push({
                    id: genId("edge"),
                    sources: [condSub.exitId],
                    targets: [trueSub.entryId],
                    labels: [{ text: "true" }],
                });
                edges.push({
                    id: genId("edge"),
                    sources: [trueSub.exitId],
                    targets: [mergeId],
                });
            } else {
                edges.push({
                    id: genId("edge"),
                    sources: [condSub.exitId],
                    targets: [mergeId],
                    labels: [{ text: "true" }],
                });
            }

            if (work.falseWork) {
                const falseSub = workToElk(work.falseWork, nodes, edges);
                edges.push({
                    id: genId("edge"),
                    sources: [condSub.exitId],
                    targets: [falseSub.entryId],
                    labels: [{ text: "false" }],
                });
                edges.push({
                    id: genId("edge"),
                    sources: [falseSub.exitId],
                    targets: [mergeId],
                });
            } else {
                edges.push({
                    id: genId("edge"),
                    sources: [condSub.exitId],
                    targets: [mergeId],
                    labels: [{ text: "false" }],
                });
            }

            return { entryId: condSub.entryId, exitId: mergeId };
        }
    }
}

async function renderFlowChart(work) {
    const nodes = [];
    const edges = [];
    workToElk(work, nodes, edges);

    elkGraph = {
        id: "root",
        layoutOptions: {
            "elk.algorithm": "layered",
            "elk.direction": "DOWN",
            "elk.edgeRouting": "ORTHOGONAL",
            "elk.layered.spacing.nodeNodeBetweenLayers": "40",
            "elk.spacing.nodeNode": "20",
        },
        children: nodes.map(n => ({
            id: n.id,
            width: n.width,
            height: n.height,
            labels: n.labels,
        })),
        edges: edges.map(e => ({
            id: e.id,
            sources: e.sources,
            targets: e.targets,
            labels: e.labels || [],
        })),
    };

    const layout = await elk.layout(elkGraph);
    drawLayout(layout, nodes, edges);
}

function drawLayout(layout, nodesMeta, edgesMeta) {
    jobPart.innerHTML = "";
    const container = document.createElement("div");
    container.className = "flow-chart-container";

    // Calculate total dimensions
    let maxX = 0, maxY = 0;
    for (const node of layout.children) {
        maxX = Math.max(maxX, node.x + node.width);
        maxY = Math.max(maxY, node.y + node.height);
    }
    container.style.width = (maxX + 40) + "px";
    container.style.height = (maxY + 40) + "px";

    // Create node divs
    nodeElements = {};
    for (const node of layout.children) {
        const meta = nodesMeta.find(n => n.id === node.id);
        if (!meta) continue;

        if (meta._type === "invisible") continue;

        const div = document.createElement("div");
        div.className = "flow-node";
        div.style.left = node.x + "px";
        div.style.top = node.y + "px";
        div.style.width = node.width + "px";
        div.style.height = node.height + "px";
        div.dataset.nodeId = node.id;

        switch (meta._type) {
            case "task":
                div.classList.add("task-node");
                div.textContent = meta.labels[0]?.text || "";
                div.addEventListener("click", () => toggleNodeExpand(div, meta, layout, nodesMeta, edgesMeta));
                break;
            case "condition":
                div.classList.add("condition-node");
                const diamondInner = document.createElement("div");
                diamondInner.className = "diamond-inner";
                div.appendChild(diamondInner);
                break;
            case "fork":
                div.classList.add("fork-node");
                break;
            case "join":
                div.classList.add("join-node");
                break;
            case "merge":
                div.classList.add("merge-node");
                const mergeInner = document.createElement("div");
                mergeInner.className = "diamond-inner";
                div.appendChild(mergeInner);
                break;
            case "pass":
                div.classList.add("pass-node");
                div.textContent = "pass";
                break;
        }

        container.appendChild(div);
        nodeElements[node.id] = div;
    }

    // Create SVG overlay for edges
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("edge-overlay");
    svg.style.width = (maxX + 40) + "px";
    svg.style.height = (maxY + 40) + "px";

    // Draw edges
    if (layout.edges) {
        for (const edge of layout.edges) {
            const edgeMeta = edgesMeta.find(e => e.id === edge.id);
            if (!edge.sections) continue;

            for (const section of edge.sections) {
                const points = [];
                points.push(section.startPoint);
                if (section.bendPoints) {
                    points.push(...section.bendPoints);
                }
                points.push(section.endPoint);

                const pathData = points.map((p, i) =>
                    (i === 0 ? "M" : "L") + ` ${p.x} ${p.y}`
                ).join(" ");

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", pathData);
                if (edgeMeta?._backEdge) {
                    path.classList.add("back-edge");
                }

                // Add arrowhead
                const lastPt = points[points.length - 1];
                const prevPt = points[points.length - 2] || points[0];
                drawArrowhead(svg, prevPt, lastPt);

                svg.appendChild(path);

                // Edge labels
                if (edge.labels && edge.labels.length > 0) {
                    for (const label of edge.labels) {
                        if (!label.text) continue;
                        // Position label at midpoint of edge
                        const midIdx = Math.floor(points.length / 2);
                        const midPt = points[midIdx];
                        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                        text.classList.add("edge-label");
                        text.setAttribute("x", midPt.x + 4);
                        text.setAttribute("y", midPt.y - 4);
                        text.textContent = label.text;
                        svg.appendChild(text);
                    }
                }
            }
        }
    }

    container.appendChild(svg);
    jobPart.appendChild(container);
}

function drawArrowhead(svg, from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const ux = dx / len;
    const uy = dy / len;
    const size = 6;

    const p1x = to.x - ux * size - uy * size * 0.5;
    const p1y = to.y - uy * size + ux * size * 0.5;
    const p2x = to.x - ux * size + uy * size * 0.5;
    const p2y = to.y - uy * size - ux * size * 0.5;

    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", `${to.x},${to.y} ${p1x},${p1y} ${p2x},${p2y}`);
    polygon.setAttribute("fill", "#666");
    svg.appendChild(polygon);
}

async function toggleNodeExpand(div, meta, layout, nodesMeta, edgesMeta) {
    const nodeId = div.dataset.nodeId;
    if (expandedNodes.has(nodeId)) {
        expandedNodes.delete(nodeId);
        div.classList.remove("expanded");
        div.textContent = meta.labels[0]?.text || "";
        // Reset size
        const elkNode = elkGraph.children.find(n => n.id === nodeId);
        if (elkNode) {
            elkNode.width = 120;
            elkNode.height = 40;
        }
    } else {
        expandedNodes.add(nodeId);
        div.classList.add("expanded");
        // Show expanded content
        div.innerHTML = "";
        const title = document.createElement("div");
        title.style.fontWeight = "bold";
        title.textContent = meta.labels[0]?.text || "";
        div.appendChild(title);

        if (meta._work) {
            if (meta._work.modelOverride) {
                const modelDiv = document.createElement("div");
                modelDiv.style.fontSize = "11px";
                modelDiv.style.color = "#666";
                const overrideText = meta._work.modelOverride.category || meta._work.modelOverride.id || "";
                modelDiv.textContent = `model: ${overrideText}`;
                div.appendChild(modelDiv);
            }
            const idDiv = document.createElement("div");
            idDiv.style.fontSize = "11px";
            idDiv.style.color = "#888";
            idDiv.textContent = `workId: ${meta._work.workIdInJob}`;
            div.appendChild(idDiv);
        }

        // Measure new size
        const elkNode = elkGraph.children.find(n => n.id === nodeId);
        if (elkNode) {
            elkNode.width = Math.max(150, div.scrollWidth + 20);
            elkNode.height = Math.max(60, div.scrollHeight + 10);
        }
    }

    // Re-layout
    const newLayout = await elk.layout(elkGraph);
    drawLayout(newLayout, nodesMeta, edgesMeta);
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
