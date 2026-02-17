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

async function renderFlowChartMermaid(chart, container) {
    const definition = mermaidBuildDefinition(chart);

    // Build a map for TaskNode/CondNode click handling
    const taskNodeIds = [];
    for (const node of chart.nodes) {
        const hintKey = mermaidGetHintKey(node.hint);
        if (hintKey === "TaskNode" || hintKey === "CondNode") {
            taskNodeIds.push(`N${node.id}`);
        }
    }

    // Render with Mermaid
    const { svg } = await mermaid.render("mermaid-chart", definition);
    container.innerHTML = "";
    container.innerHTML = svg;

    // Track currently bolded TaskNode/CondNode
    let currentBoldNode = null;

    // Add click handlers for TaskNode/CondNode elements
    for (const nodeId of taskNodeIds) {
        const nodeEl = container.querySelector(`[id^="flowchart-${nodeId}-"]`);
        if (!nodeEl) continue;
        const group = nodeEl.closest("g.node") || nodeEl;
        group.style.cursor = "pointer";
        group.addEventListener("click", () => {
            // Find the text element inside this node
            const textEl = group.querySelector(".nodeLabel") || group.querySelector("text");
            if (!textEl) return;

            if (currentBoldNode === textEl) {
                textEl.style.fontWeight = "";
                currentBoldNode = null;
            } else {
                if (currentBoldNode) {
                    currentBoldNode.style.fontWeight = "";
                }
                textEl.style.fontWeight = "bold";
                currentBoldNode = textEl;
            }
        });
    }
}

// Export as global
window.renderFlowChartMermaid = renderFlowChartMermaid;
