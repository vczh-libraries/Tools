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

// ---- Node style definitions ----
const nodeStyles = {
    TaskNode: {
        border: "#3b82f6",
        background: "#dbeafe",
        minWidth: 140,
        minHeight: 40,
        shape: "rect",
    },
    ParBegin: {
        border: "#222",
        background: "#222",
        minWidth: 60,
        minHeight: 10,
        shape: "rect",
    },
    ParEnd: {
        border: "#222",
        background: "#222",
        minWidth: 60,
        minHeight: 10,
        shape: "rect",
    },
    AltEnd: {
        border: "#222",
        background: "#222",
        minWidth: 60,
        minHeight: 10,
        shape: "rect",
    },
    CondBegin: {
        border: "#eab308",
        background: "#fef9c3",
        minWidth: 60,
        minHeight: 10,
        shape: "rect",
    },
    CondEnd: {
        border: "#eab308",
        background: "#fef9c3",
        minWidth: 30,
        minHeight: 30,
        shape: "diamond",
    },
    LoopEnd: {
        border: "#9ca3af",
        background: "#f3f4f6",
        minWidth: 24,
        minHeight: 24,
        shape: "circle",
    },
};

function getHintKey(hint) {
    return Array.isArray(hint) ? hint[0] : hint;
}

function getNodeStyle(hint) {
    const key = getHintKey(hint);
    return nodeStyles[key] || nodeStyles.TaskNode;
}

// ---- SVG rendering helpers ----

function createSvgElement(tag, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) {
        el.setAttribute(k, String(v));
    }
    return el;
}

function renderNodeSvg(svg, node, chartNode) {
    const style = getNodeStyle(chartNode.hint);
    const x = node.x || 0;
    const y = node.y || 0;
    const w = node.width || style.minWidth;
    const h = node.height || style.minHeight;

    if (style.shape === "diamond") {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const hw = w / 2;
        const hh = h / 2;
        const points = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;
        svg.appendChild(createSvgElement("polygon", {
            points,
            fill: style.background,
            stroke: style.border,
            "stroke-width": 2,
        }));
    } else if (style.shape === "circle") {
        const r = Math.min(w, h) / 2;
        svg.appendChild(createSvgElement("circle", {
            cx: x + w / 2,
            cy: y + h / 2,
            r,
            fill: style.background,
            stroke: style.border,
            "stroke-width": 2,
        }));
    } else {
        svg.appendChild(createSvgElement("rect", {
            x,
            y,
            width: w,
            height: h,
            rx: 4,
            ry: 4,
            fill: style.background,
            stroke: style.border,
            "stroke-width": 2,
        }));
    }

    // Add label for TaskNode
    if (chartNode.label) {
        const hintKey = getHintKey(chartNode.hint);
        if (hintKey === "TaskNode") {
            svg.appendChild(createSvgElement("text", {
                x: x + w / 2,
                y: y + h / 2 + 5,
                "text-anchor": "middle",
                "font-size": 13,
                "font-family": "sans-serif",
                fill: "#1e3a5f",
            })).textContent = chartNode.label;
        }
    }
}

function renderEdgeSvg(svg, edge) {
    const sections = edge.sections || [];
    for (const section of sections) {
        const points = [];
        if (section.startPoint) {
            points.push(section.startPoint);
        }
        if (section.bendPoints) {
            points.push(...section.bendPoints);
        }
        if (section.endPoint) {
            points.push(section.endPoint);
        }

        if (points.length < 2) continue;

        // Draw path
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            d += ` L ${points[i].x} ${points[i].y}`;
        }
        svg.appendChild(createSvgElement("path", {
            d,
            fill: "none",
            stroke: "#9ca3af",
            "stroke-width": 1.5,
            "marker-end": "url(#arrowhead)",
        }));

        // Draw label if any
        if (edge.labels && edge.labels.length > 0) {
            const label = edge.labels[0];
            if (label.x !== undefined && label.y !== undefined) {
                svg.appendChild(createSvgElement("text", {
                    x: label.x + (label.width || 0) / 2,
                    y: label.y + (label.height || 12) / 2 + 4,
                    "text-anchor": "middle",
                    "font-size": 11,
                    "font-family": "sans-serif",
                    fill: "#6b7280",
                })).textContent = label.text || "";
            }
        }
    }
}

// ---- Load job data and render chart with ELK ----
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
        await renderFlowChart(chart);
    } catch (err) {
        console.error("Failed to load job data:", err);
        jobPart.textContent = "Failed to load job data.";
    }
}

async function renderFlowChart(chart) {
    const nodeMap = new Map();
    for (const n of chart.nodes) {
        nodeMap.set(n.id, n);
    }

    // Build ELK graph
    const elkNodes = chart.nodes.map(n => {
        const style = getNodeStyle(n.hint);
        const hintKey = getHintKey(n.hint);
        let w = style.minWidth;
        let h = style.minHeight;
        // Make TaskNodes wider if label is long
        if (hintKey === "TaskNode" && n.label) {
            w = Math.max(w, n.label.length * 9 + 20);
        }
        return {
            id: String(n.id),
            width: w,
            height: h,
        };
    });

    const elkEdges = [];
    let edgeId = 0;
    for (const n of chart.nodes) {
        if (n.arrows) {
            for (const arrow of n.arrows) {
                const edge = {
                    id: `e${edgeId++}`,
                    sources: [String(n.id)],
                    targets: [String(arrow.to)],
                };
                if (arrow.label) {
                    edge.labels = [{ text: arrow.label, width: arrow.label.length * 7 + 4, height: 14 }];
                }
                elkEdges.push(edge);
            }
        }
    }

    const elkGraph = {
        id: "root",
        layoutOptions: {
            "elk.algorithm": "layered",
            "elk.direction": "DOWN",
            "elk.spacing.nodeNode": "30",
            "elk.layered.spacing.nodeNodeBetweenLayers": "40",
            "elk.edgeRouting": "ORTHOGONAL",
            "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
            "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
            "elk.layered.crossingMinimization.forceNodeModelOrder": "true",
            "elk.layered.cycleBreaking.strategy": "MODEL_ORDER",
        },
        children: elkNodes,
        edges: elkEdges,
    };

    // Run ELK layout
    const elk = new ELK();
    const layout = await elk.layout(elkGraph);

    // Render SVG
    const padding = 20;
    const totalWidth = (layout.width || 400) + padding * 2;
    const totalHeight = (layout.height || 400) + padding * 2;

    const svg = createSvgElement("svg", {
        width: totalWidth,
        height: totalHeight,
        viewBox: `0 0 ${totalWidth} ${totalHeight}`,
        style: "display: block; margin: auto;",
    });

    // Arrow marker definition
    const defs = createSvgElement("defs", {});
    const marker = createSvgElement("marker", {
        id: "arrowhead",
        markerWidth: 10,
        markerHeight: 7,
        refX: 10,
        refY: 3.5,
        orient: "auto",
    });
    marker.appendChild(createSvgElement("polygon", {
        points: "0 0, 10 3.5, 0 7",
        fill: "#9ca3af",
    }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Offset group for padding
    const g = createSvgElement("g", { transform: `translate(${padding}, ${padding})` });

    // Render edges first (behind nodes)
    if (layout.edges) {
        for (const edge of layout.edges) {
            renderEdgeSvg(g, edge);
        }
    }

    // Render nodes
    if (layout.children) {
        for (const layoutNode of layout.children) {
            const chartNode = nodeMap.get(parseInt(layoutNode.id));
            if (chartNode) {
                renderNodeSvg(g, layoutNode, chartNode);
            }
        }
    }

    svg.appendChild(g);

    // Clear and append
    jobPart.innerHTML = "";
    jobPart.appendChild(svg);
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
