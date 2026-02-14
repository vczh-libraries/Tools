export interface GridColumn {
    name: string;
    id: string;
}

export interface GridRow {
    keyword: string;
    jobs: GridColumn[];
}

export type Prompt = string[];

export interface Task {
    model?: string;
    prompt: Prompt;
    availability: {
        condition: Prompt;
    };
    criteria?: {
        toolExecuted?: string[];
        condition: Prompt;
    };
}

export interface Entry {
    models: {
        driving: string;
        planning: string;
        coding: string;
        reviewers: string[];
    };
    promptPrefix: {[key in string]: string[]};
    grid: GridRow[];
    tasks: {[key in string]: Task};
}
