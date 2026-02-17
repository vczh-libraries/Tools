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
    label?: string;
    loopBack?: boolean;
}

export type ChartNodeHint =
    | ["TaskNode", TaskWork<number>["workIdInJob"]]
    | "ParBegin"
    | "ParEnd"
    | "LoopBegin"
    | "LoopEnd"
    | "AltBegin"
    | "AltEnd"
    ;

export type ChartNode = {
    id: number;
    hint: ChartNodeHint;
    label: string;
    arrows?: ChartArrow[];
}

export type ChartGraph = {
    nodes: ChartNode[];
}

export function generateChartNodes(work: Work<number>, nodeId: number[] = [0]): ChartGraph {
}