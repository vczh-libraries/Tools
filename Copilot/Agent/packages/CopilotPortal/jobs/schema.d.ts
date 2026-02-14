export interface Entry {
    models: {
        driving: string;
        planning: string;
        coding: string;
        reviewers: string[];
    };
    promptPrefix: {[key in string]: string[]};
    grid: {
        keyword: string;
        jobs: {
            name: string;
            id: string;
        }[];
    }[];
}
