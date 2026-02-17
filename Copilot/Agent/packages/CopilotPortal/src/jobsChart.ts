import {
    Work,
    TaskWork,
    SequentialWork,
    ParallelWork,
    LoopWork,
    AltWork,
} from "./jobsDef.js";

export type ChartArrow = {
    to: number;
    loopBack: boolean;
    label?: string;
}

export type ChartNodeHint =
    | ["TaskNode", TaskWork<number>["workIdInJob"]]
    | "ParBegin"
    | "ParEnd"
    | "CondBegin"
    | "CondEnd"
    | "LoopEnd"
    | "AltEnd"
    ;

export type ChartNode = {
    id: number;
    hint: ChartNodeHint;
    label?: string;
    arrows?: ChartArrow[];
}

export type ChartGraph = {
    nodes: ChartNode[];
}

function connectNodes(fromNode: ChartNode, toNode: ChartNode, label?: string, loopBack: boolean = false) {
    fromNode.arrows = fromNode.arrows || [];
    fromNode.arrows.push({ to: toNode.id, label, loopBack });
}

function buildConditionNode(condition: Work<number>, nodeId: number[], nodes: ChartNode[]): [ChartNode, ChartNode] {
    if (condition.kind === "Seq" && condition.works.length > 1) {
        const beginNode: ChartNode = {
            id: nodeId[0]++,
            hint: "CondBegin",
        };
        nodes.push(beginNode);
        const nodePairs = buildChart(condition, nodeId, nodes);
        const endNode: ChartNode = {
            id: nodeId[0]++,
            hint: "CondEnd",
        };
        nodes.push(endNode);
        connectNodes(beginNode, nodePairs[0]);
        connectNodes(nodePairs[1], endNode);
        return [beginNode, endNode];
    } else {
        return buildChart(condition, nodeId, nodes);
    }
}

function buildChart(work: Work<number>, nodeId: number[], nodes: ChartNode[]): [ChartNode, ChartNode] {
    switch (work.kind) {
        case "Ref": {
            const node: ChartNode = {
                id: nodeId[0]++,
                hint: ["TaskNode", work.workIdInJob],
                label: work.taskId,
            }
            nodes.push(node);
            return [node, node];
        }
        case "Seq": {
            const nodePairs = work.works.map(w => buildChart(w, nodeId, nodes));
            for (let i = 0; i < nodePairs.length - 2; i++) {
                const fromNode = nodePairs[i][1];
                const toNode = nodePairs[i + 1][0];
                connectNodes(fromNode, toNode);
            }
            return [nodePairs[0][0], nodePairs[nodePairs.length - 1][1]];
        }
        case "Par": {
            const beginNode: ChartNode = {
                id: nodeId[0]++,
                hint: "ParBegin",
            };
            nodes.push(beginNode);
            const nodePairs = work.works.map(w => buildChart(w, nodeId, nodes));
            const endNode: ChartNode = {
                id: nodeId[0]++,
                hint: "ParEnd",
            };
            nodes.push(endNode);
            for (const [firstNode, lastNode] of nodePairs) {
                connectNodes(beginNode, firstNode);
                connectNodes(lastNode, endNode);
            }
            return [beginNode, endNode];
        }
        case "Loop": {
            let beginPair: [ChartNode, ChartNode] | undefined;
            if (work.preCondition) {
                beginPair = buildConditionNode(work.preCondition[1], nodeId, nodes);
            } else {
                const node: ChartNode = {
                    id: nodeId[0]++,
                    hint: "CondBegin",
                }
                nodes.push(node);
                beginPair = [node, node];
            }
            const bodyNode = buildChart(work.body, nodeId, nodes);
            const endPair = (work.postCondition ? buildConditionNode(work.postCondition[1], nodeId, nodes) : undefined) as [ChartNode, ChartNode];
            const endNode: ChartNode = {
                id: nodeId[0]++,
                hint: "LoopEnd",
            }
            nodes.push(endNode);
            if (work.preCondition) {
                connectNodes(beginPair[1], bodyNode[0], `${work.preCondition[0]}`);
                connectNodes(beginPair[1], endNode, `${!work.preCondition[0]}`);
            } else {
                connectNodes(beginPair[1], bodyNode[0]);
            }
            if (work.postCondition) {
                connectNodes(bodyNode[1], endPair[0]);
                connectNodes(endPair[1], beginPair[0], `${work.postCondition[0]}`, true);
                connectNodes(endPair[1], endNode, `${!work.postCondition[0]}`);
            } else {
                connectNodes(bodyNode[1], endNode);
            }
            return [beginPair[0], endNode];
        }
        case "Alt": {
            const conditionPair = buildChart(work.condition, nodeId, nodes);
            const endNode: ChartNode = {
                id: nodeId[0]++,
                hint: "AltEnd",
            };
            nodes.push(endNode);
            if (work.trueWork) {
                const truePair = buildConditionNode(work.trueWork, nodeId, nodes);
                connectNodes(conditionPair[1], truePair[0], "true");
                connectNodes(truePair[1], endNode);
            } else {
                connectNodes(conditionPair[1], endNode, "true");
            }
            if (work.falseWork) {
                const falsePair = buildConditionNode(work.falseWork, nodeId, nodes);
                connectNodes(conditionPair[1], falsePair[0], "false");
                connectNodes(falsePair[1], endNode);
            } else {
                connectNodes(conditionPair[1], endNode, "false");
            }
            return [conditionPair[0], endNode];
        }
    }
}

export function generateChartNodes(work: Work<number>): ChartGraph {
    const nodes: ChartNode[] = [];
    buildChart(work, [0], nodes);
    return { nodes };
}
