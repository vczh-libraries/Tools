// ---- ELK Flow Chart Renderer ----
// Renders a ChartGraph into an SVG using ELK.js layout engine.

const elkNodeStyles = {
    TaskNode: {
        minWidth: 140,
        minHeight: 40,
        shape: "rect",
    },
    ParBegin: {
        minWidth: 60,
        minHeight: 10,
        shape: "rect",
    },
    ParEnd: {
        minWidth: 60,
        minHeight: 10,
        shape: "rect",
    },
    AltEnd: {
        minWidth: 60,
        minHeight: 10,
        shape: "rect",
    },
    CondBegin: {
        minWidth: 60,
        minHeight: 10,
        shape: "rect",
    },
    CondEnd: {
        minWidth: 30,
        minHeight: 30,
        shape: "diamond",
    },
    LoopEnd: {
        minWidth: 24,
        minHeight: 24,
        shape: "circle",
    },
};

function elkGetHintKey(hint) {
    return Array.isArray(hint) ? hint[0] : hint;
}

function elkGetNodeStyle(hint) {
    const key = elkGetHintKey(hint);
    return elkNodeStyles[key] || elkNodeStyles.TaskNode;
}

// ---- SVG rendering helpers ----

function elkCreateSvgElement(tag, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) {
        el.setAttribute(k, String(v));
    }
    return el;
}

function elkRenderNodeSvg(svg, node, chartNode, onTaskNodeClick) {
    const style = elkGetNodeStyle(chartNode.hint);
    const hintKey = elkGetHintKey(chartNode.hint);
    const x = node.x || 0;
    const y = node.y || 0;
    const w = node.width || style.minWidth;
    const h = node.height || style.minHeight;

    const group = elkCreateSvgElement("g", { class: `elk-node-${hintKey}` });

    if (style.shape === "diamond") {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const hw = w / 2;
        const hh = h / 2;
        const points = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;
        group.appendChild(elkCreateSvgElement("polygon", { points }));
    } else if (style.shape === "circle") {
        const r = Math.min(w, h) / 2;
        group.appendChild(elkCreateSvgElement("circle", {
            cx: x + w / 2,
            cy: y + h / 2,
            r,
        }));
    } else {
        group.appendChild(elkCreateSvgElement("rect", {
            x,
            y,
            width: w,
            height: h,
            rx: 4,
            ry: 4,
        }));
    }

    // Add label for TaskNode
    if (chartNode.label && hintKey === "TaskNode") {
        const textEl = elkCreateSvgElement("text", {
            x: x + w / 2,
            y: y + h / 2 + 5,
            "text-anchor": "middle",
        });
        textEl.textContent = chartNode.label;
        group.appendChild(textEl);

        // TaskNode click interaction
        if (onTaskNodeClick) {
            group.style.cursor = "pointer";
            group.addEventListener("click", () => onTaskNodeClick(chartNode, textEl));
        }
    }

    svg.appendChild(group);
}

function elkRenderEdgeSvg(svg, edge) {
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

        const group = elkCreateSvgElement("g", { class: "elk-edge" });

        // Draw path
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            d += ` L ${points[i].x} ${points[i].y}`;
        }
        group.appendChild(elkCreateSvgElement("path", {
            d,
            "marker-end": "url(#arrowhead)",
        }));

        // Draw label if any
        if (edge.labels && edge.labels.length > 0) {
            const label = edge.labels[0];
            if (label.x !== undefined && label.y !== undefined) {
                const textEl = elkCreateSvgElement("text", {
                    x: label.x + (label.width || 0) / 2,
                    y: label.y + (label.height || 12) / 2 + 4,
                    "text-anchor": "middle",
                    class: "elk-edge-label",
                });
                textEl.textContent = label.text || "";
                group.appendChild(textEl);
            }
        }

        svg.appendChild(group);
    }
}

// ---- Main render function ----
// Exported as global for use by jobTracking.js
async function renderFlowChartELK(chart, container) {
    const nodeMap = new Map();
    for (const n of chart.nodes) {
        nodeMap.set(n.id, n);
    }

    // Build ELK graph
    const elkNodes = chart.nodes.map(n => {
        const style = elkGetNodeStyle(n.hint);
        const hintKey = elkGetHintKey(n.hint);
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
            "elk.edgeRouting": "SPLINES",
            "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
            "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
            "elk.layered.crossingMinimization.forceNodeModelOrder": "true",
            "elk.layered.cycleBreaking.strategy": "MODEL_ORDER",
            "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
        },
        children: elkNodes,
        edges: elkEdges,
    };

    // Run ELK layout
    const elk = new ELK();
    const layout = await elk.layout(elkGraph);

    // Track currently bolded TaskNode text element
    let currentBoldText = null;

    function onTaskNodeClick(chartNode, textEl) {
        if (currentBoldText === textEl) {
            // Unbold
            textEl.classList.remove("bold");
            currentBoldText = null;
        } else {
            // Unbold previous
            if (currentBoldText) {
                currentBoldText.classList.remove("bold");
            }
            // Bold this one
            textEl.classList.add("bold");
            currentBoldText = textEl;
        }
    }

    // Render SVG
    const padding = 20;
    const totalWidth = (layout.width || 400) + padding * 2;
    const totalHeight = (layout.height || 400) + padding * 2;

    const svg = elkCreateSvgElement("svg", {
        width: totalWidth,
        height: totalHeight,
        viewBox: `0 0 ${totalWidth} ${totalHeight}`,
        style: "display: block; margin: auto;",
    });

    // Arrow marker definition
    const defs = elkCreateSvgElement("defs", {});
    const marker = elkCreateSvgElement("marker", {
        id: "arrowhead",
        markerWidth: 10,
        markerHeight: 7,
        refX: 10,
        refY: 3.5,
        orient: "auto",
    });
    marker.appendChild(elkCreateSvgElement("polygon", {
        points: "0 0, 10 3.5, 0 7",
        fill: "#9ca3af",
    }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Offset group for padding
    const g = elkCreateSvgElement("g", { transform: `translate(${padding}, ${padding})` });

    // Render edges first (behind nodes)
    if (layout.edges) {
        for (const edge of layout.edges) {
            elkRenderEdgeSvg(g, edge);
        }
    }

    // Render nodes
    if (layout.children) {
        for (const layoutNode of layout.children) {
            const chartNode = nodeMap.get(parseInt(layoutNode.id));
            if (chartNode) {
                elkRenderNodeSvg(g, layoutNode, chartNode, onTaskNodeClick);
            }
        }
    }

    svg.appendChild(g);

    // Clear and append
    container.innerHTML = "";
    container.appendChild(svg);
}

// Export as global
window.renderFlowChartELK = renderFlowChartELK;
