// ---- Mermaid Flow Chart Renderer ----
// Renders a ChartGraph using Mermaid.js to generate a flowchart diagram.

function mermaidGetHintKey(hint) {
    return Array.isArray(hint) ? hint[0] : hint;
}

function mermaidBuildDefinition(chart) {
    const lines = ["graph TD"];

    // Define nodes
    for (const node of chart.nodes) {
        const hintKey = mermaidGetHintKey(node.hint);
        const id = `N${node.id}`;
        const label = node.label || "";

        switch (hintKey) {
            case "TaskNode":
                lines.push(`    ${id}["${label}"]`);
                break;
            case "CondNode":
                lines.push(`    ${id}{{"${label}"}}`);
                break;
            case "ParBegin":
            case "ParEnd":
                lines.push(`    ${id}[" "]`);
                break;
            case "AltEnd":
                lines.push(`    ${id}[" "]`);
                break;
            case "CondBegin":
                lines.push(`    ${id}[" "]`);
                break;
            case "CondEnd":
                lines.push(`    ${id}{" "}`);
                break;
            case "LoopEnd":
                lines.push(`    ${id}((" "))`);
                break;
            default:
                lines.push(`    ${id}["${label || hintKey}"]`);
                break;
        }
    }

    // Define edges
    for (const node of chart.nodes) {
        if (node.arrows) {
            for (const arrow of node.arrows) {
                const from = `N${node.id}`;
                const to = `N${arrow.to}`;
                if (arrow.label) {
                    lines.push(`    ${from} -->|"${arrow.label}"| ${to}`);
                } else {
                    lines.push(`    ${from} --> ${to}`);
                }
            }
        }
    }

    // Apply styles
    for (const node of chart.nodes) {
        const hintKey = mermaidGetHintKey(node.hint);
        const id = `N${node.id}`;

        switch (hintKey) {
            case "TaskNode":
                lines.push(`    style ${id} fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#1e3a5f`);
                break;
            case "CondNode":
                lines.push(`    style ${id} fill:#fef9c3,stroke:#eab308,stroke-width:2px,color:#92400e`);
                break;
            case "ParBegin":
            case "ParEnd":
                lines.push(`    style ${id} fill:#222,stroke:#222,stroke-width:2px,color:#222,font-size:0px,min-width:40px,min-height:6px,padding:0px`);
                break;
            case "AltEnd":
                lines.push(`    style ${id} fill:#fce7f3,stroke:#db2777,stroke-width:2px,color:#fce7f3,font-size:0px,min-width:40px,min-height:6px,padding:0px`);
                break;
            case "CondBegin":
                lines.push(`    style ${id} fill:#fef9c3,stroke:#eab308,stroke-width:2px,color:#fef9c3,font-size:0px,min-width:40px,min-height:6px,padding:0px`);
                break;
            case "CondEnd":
                lines.push(`    style ${id} fill:#fef9c3,stroke:#eab308,stroke-width:2px,color:#fef9c3,font-size:0px,padding:0px`);
                break;
            case "LoopEnd":
                lines.push(`    style ${id} fill:#f3f4f6,stroke:#9ca3af,stroke-width:2px,color:#f3f4f6,font-size:0px,padding:0px`);
                break;
        }
    }

    return lines.join("\n");
}

async function renderFlowChartMermaid(chart, container, onInspect) {
    const definition = mermaidBuildDefinition(chart);

    // Build maps for TaskNode/CondNode click handling and workId lookup
    const taskNodeIds = [];
    const nodeIdToWorkId = {};
    for (const node of chart.nodes) {
        const hintKey = mermaidGetHintKey(node.hint);
        if (hintKey === "TaskNode" || hintKey === "CondNode") {
            const nid = `N${node.id}`;
            taskNodeIds.push(nid);
            // hint is [hintKey, workIdInJob]
            if (Array.isArray(node.hint) && node.hint.length >= 2) {
                nodeIdToWorkId[nid] = node.hint[1];
            }
        }
    }

    // Render with Mermaid
    const { svg } = await mermaid.render("mermaid-chart", definition);
    container.innerHTML = "";
    container.innerHTML = svg;

    // Track currently bolded TaskNode/CondNode
    let currentBoldNode = null;
    let currentBoldWorkId = null;

    // Map workId -> DOM group for status updates
    const workIdToGroup = {};
    const workIdToTextEl = {};

    // Add click handlers for TaskNode/CondNode elements
    for (const nodeId of taskNodeIds) {
        const nodeEl = container.querySelector(`[id^="flowchart-${nodeId}-"]`);
        if (!nodeEl) continue;
        const group = nodeEl.closest("g.node") || nodeEl;
        group.style.cursor = "pointer";

        const workId = nodeIdToWorkId[nodeId];
        if (workId !== undefined) {
            workIdToGroup[workId] = group;
            const textEl = group.querySelector(".nodeLabel") || group.querySelector("text");
            workIdToTextEl[workId] = textEl;
        }

        group.addEventListener("click", () => {
            const textEl = group.querySelector(".nodeLabel") || group.querySelector("text");
            if (!textEl) return;

            const wid = nodeIdToWorkId[nodeId];

            if (currentBoldNode === textEl) {
                textEl.style.fontWeight = "";
                currentBoldNode = null;
                currentBoldWorkId = null;
                if (onInspect) onInspect(null);
            } else {
                if (currentBoldNode) {
                    currentBoldNode.style.fontWeight = "";
                }
                textEl.style.fontWeight = "bold";
                currentBoldNode = textEl;
                currentBoldWorkId = wid;
                if (onInspect) onInspect(wid);
            }
        });
    }

    // Return controller for status updates
    return {
        // Helper: position an indicator at the center of the left border of the node
        _positionIndicator(indicator, group) {
            // Try to find the shape element (rect, polygon, etc.) of the node
            const shape = group.querySelector("rect, polygon, circle, ellipse, path");
            if (shape) {
                const shapeBBox = shape.getBBox ? shape.getBBox() : null;
                if (shapeBBox) {
                    // Center of the left border, but outside
                    indicator.setAttribute("x", String(shapeBBox.x - 20));
                    indicator.setAttribute("y", String(shapeBBox.y + shapeBBox.height / 2 + 5));
                    return;
                }
            }
            // Fallback: use text position
            const textEl = workIdToTextEl[parseInt(indicator.getAttribute("data-work-id"))];
            if (textEl) {
                const textBBox = textEl.getBBox ? textEl.getBBox() : null;
                if (textBBox) {
                    indicator.setAttribute("x", String(textBBox.x - 20));
                    indicator.setAttribute("y", String(textBBox.y + textBBox.height * 0.8));
                }
            }
        },
        // Set a node to running state (green triangle emoji)
        setRunning(workId) {
            const group = workIdToGroup[workId];
            if (!group) return;
            this._clearIndicator(workId);
            const indicator = document.createElementNS("http://www.w3.org/2000/svg", "text");
            indicator.textContent = "\u25B6\uFE0F"; // ▶️ green triangle emoji
            indicator.setAttribute("fill", "#22c55e");
            indicator.setAttribute("font-size", "14");
            indicator.setAttribute("class", "task-status-indicator");
            indicator.setAttribute("data-work-id", String(workId));
            const parent = group;
            parent.insertBefore(indicator, parent.firstChild);
            this._positionIndicator(indicator, group);
        },
        // Set a node to completed state (green tick emoji)
        setCompleted(workId) {
            const group = workIdToGroup[workId];
            if (!group) return;
            this._clearIndicator(workId);
            const indicator = document.createElementNS("http://www.w3.org/2000/svg", "text");
            indicator.textContent = "\u2705"; // ✅ green tick emoji
            indicator.setAttribute("font-size", "14");
            indicator.setAttribute("class", "task-status-indicator");
            indicator.setAttribute("data-work-id", String(workId));
            const parent = group;
            parent.insertBefore(indicator, parent.firstChild);
            this._positionIndicator(indicator, group);
        },
        // Set a node to failed state (red cross emoji)
        setFailed(workId) {
            const group = workIdToGroup[workId];
            if (!group) return;
            this._clearIndicator(workId);
            const indicator = document.createElementNS("http://www.w3.org/2000/svg", "text");
            indicator.textContent = "\u274C"; // ❌ red cross emoji
            indicator.setAttribute("font-size", "14");
            indicator.setAttribute("class", "task-status-indicator");
            indicator.setAttribute("data-work-id", String(workId));
            const parent = group;
            parent.insertBefore(indicator, parent.firstChild);
            this._positionIndicator(indicator, group);
        },
        _clearIndicator(workId) {
            const svgEl = container.querySelector("svg");
            if (svgEl) {
                const existing = svgEl.querySelectorAll(`.task-status-indicator[data-work-id="${workId}"]`);
                existing.forEach(el => el.remove());
            }
        },
        get inspectedWorkId() {
            return currentBoldWorkId;
        },
    };
}

// Export as global
window.renderFlowChartMermaid = renderFlowChartMermaid;
