export interface GridColumn {
    name: string;
    id: string;
}

export interface GridRow {
    keyword: string;
    automate: boolean;
    jobs: GridColumn[];
}

export type Prompt = string[];

export interface Task {
    model?: string;
    prompt: Prompt;
    availability?: {
        previousJobKeywords?: string[];
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

const entryInput: Entry = {
    models: {
        driving: "gpt-5-mini",
        planning: "gpt-5.2",
        coding: "gpt-5.2-codex",
        reviewers: [
            "gpt-5.2-codex",
            "claude-opus-4.5",
            "gemini-3-pro-preview"
        ]
    },
    promptPrefix: {
        mandatory: [
            "REPO-ROOT is the root directory of the repo (aka the working directory you are currently in)"
        ],
        cppjob: [
            "YOU MUST FOLLOW REPO-ROOT/.github/copilot-instructions.md as a general guideline for all your tasks."
        ],
        scrum: [
            "Execute the instruction in REPO-ROOT/.github/prompts/0-scrum.prompt.md immediately."
        ],
        design: [
            "Execute the instruction in REPO-ROOT/.github/prompts/1-design.prompt.md immediately."
        ],
        plan: [
            "Execute the instruction in REPO-ROOT/.github/prompts/2-planning.prompt.md immediately."
        ],
        summary: [
            "Execute the instruction in REPO-ROOT/.github/prompts/3-summarizing.prompt.md immediately."
        ],
        execute: [
            "Execute the instruction in REPO-ROOT/.github/prompts/4-execution.prompt.md immediately."
        ],
        verify: [
            "Execute the instruction in REPO-ROOT/.github/prompts/5-verifying.prompt.md immediately."
        ],
        refine: [
            "Execute the instruction in REPO-ROOT/.github/prompts/refine.prompt.md immediately."
        ],
        review: [
            "Execute the instruction in REPO-ROOT/.github/prompts/review.prompt.md immediately."
        ],
        reportDocument: [
            "YOU MUST call the job_prepare_document with an argument: an absolute path of the document you are about to create or update."
        ],
        reportBoolean: [
            "YOU MUST call either job_boolean_true or job_boolean_false to answer an yes/no question, with the reason in the argument."
        ],
        scrumDocReady: [
            "REPO-ROOT/.github/TaskLogs/Copilot_Scrum.md should exist and its content should not be just a title."
        ],
        designDocReady: [
            "REPO-ROOT/.github/TaskLogs/Copilot_Task.md should exist and its content should not be just a title."
        ],
        planDocReady: [
            "REPO-ROOT/.github/TaskLogs/Copilot_Planning.md should exist and its content should not be just a title."
        ],
        execDocReady: [
            "REPO-ROOT/.github/TaskLogs/Copilot_Execution.md should exist and its content should not be just a title."
        ],
        execDocVerified: [
            "REPO-ROOT/.github/TaskLogs/Copilot_Execution.md should exist and its has a `# !!!VERIFIED!!!`."
        ]
    },
    grid: [{
        keyword: "scrum",
        automate: false,
        jobs: [
            {name: "problem", id: "scrum-problem" },
            {name: "update", id: "scrum-update" }
        ]
    }, {
        keyword: "design",
        automate: true,
        jobs: [
            {name: "problem next", id: "design-problem-next" },
            {name: "update", id: "design-update" },
            {name: "problem", id: "design-problem" }
        ]
    }, {
        keyword: "plan",
        automate: true,
        jobs: [
            {name: "problem", id: "plan-problem" },
            {name: "update", id: "plan-update" }
        ]
    }, {
        keyword: "summary",
        automate: true,
        jobs: [
            {name: "problem", id: "summary-problem" },
            {name: "update", id: "summary-update" }
        ]
    }, {
        keyword: "execute",
        automate: true,
        jobs: [
            {name: "start", id: "execute-start" },
            {name: "update", id: "execute-update" }
        ]
    }, {
        keyword: "verify",
        automate: true,
        jobs: [
            {name: "start", id: "verify-start" },
            {name: "update", id: "verify-update" }
        ]
    }, {
        keyword: "scrum",
        automate: true,
        jobs: [
            {name: "learn", id: "scrum-learn" }
        ]
    }, {
        keyword: "refine",
        automate: false,
        jobs: [
            {name: "start", id: "refine" }
        ]
    }],
    tasks: {
        "scrum-problem-task": {
            model: "planning",
            prompt: ["$mandatory", "$cppjob", "$scrum", "$reportDocument", "#Problem", "$user-input"],
            criteria: {
                toolExecuted: ["job_prepare_document"],
                condition: ["$mandatory", "$reportDocument", "$scrumDocReady"]
            }
        },
        "scrum-update-task": {
            model: "planning",
            prompt: ["$mandatory", "$cppjob", "$scrum", "$reportDocument", "#Update", "$user-input"],
            availability: {
                condition: ["$mandatory", "$scrumDocReady"]
            }
        },
        "design-problem-next-task": {
            model: "planning",
            prompt: ["$mandatory", "$cppjob", "$design", "$reportDocument", "#Problem", "Next"],
            availability: {
                condition: ["$mandatory", "$scrumDocReady"]
            }
        },
        "design-update-task": {
            model: "planning",
            prompt: ["$mandatory", "$cppjob", "$design", "$reportDocument", "#Update", "$user-input"],
            availability: {
                condition: ["$mandatory", "$designDocReady"]
            }
        },
        "design-problem-task": {
            model: "planning",
            prompt: ["$mandatory", "$cppjob", "$design", "$reportDocument", "#Problem", "$user-input"]
        },
        "plan-problem-task": {
            model: "planning",
            prompt: ["$mandatory", "$cppjob", "$plan", "$reportDocument", "#Problem"],
            availability: {
                condition: ["$mandatory", "$designDocReady"]
            }
        },
        "plan-update-task": {
            model: "planning",
            prompt: ["$mandatory", "$cppjob", "$plan", "$reportDocument", "#Update", "$user-input"],
            availability: {
                condition: ["$mandatory", "$planDocReady"]
            }
        },
        "summary-problem-task": {
            model: "planning",
            prompt: ["$mandatory", "$cppjob", "$summary", "$reportDocument", "#Problem"],
            availability: {
                condition: ["$mandatory", "$planDocReady"]
            }
        },
        "summary-update-task": {
            model: "planning",
            prompt: ["$mandatory", "$cppjob", "$summary", "$reportDocument", "#Update", "$user-input"],
            availability: {
                condition: ["$mandatory", "$execDocReady"]
            }
        },
        "execute-task": {
            model: "coding",
            prompt: ["$mandatory", "$cppjob", "$execute"],
            availability: {
                condition: ["$mandatory", "$execDocReady"]
            }
        },
        "execute-update-task": {
            model: "coding",
            prompt: ["$mandatory", "$cppjob", "$execute", "#Update", "$user-input"],
            availability: {
                previousJobKeywords: ["execute", "verify"],
                condition: ["$mandatory", "$execDocReady"]
            }
        },
        "verify-task": {
            model: "coding",
            prompt: ["$mandatory", "$cppjob", "$verify"],
            availability: {
                previousJobKeywords: ["execute", "verify"],
                condition: ["$mandatory", "$execDocReady"]
            }
        },
        "verify-update-task": {
            model: "coding",
            prompt: ["$mandatory", "$cppjob", "$verify", "#Update", "$user-input"],
            availability: {
                previousJobKeywords: ["execute", "verify"],
                condition: ["$mandatory", "$execDocReady"]
            }
        },
        "scrum-learn-task": {
            model: "planning",
            prompt: ["$mandatory", "$cppjob", "$scrum", "#Learn"],
            availability: {
                condition: ["$mandatory", "$execDocVerified"]
            }
        },
        "refine-task": {
            model: "planning",
            prompt: ["$mandatory", "$cppjob", "$refine"]
        },
        "review-scrum": {
            prompt: ["$mandatory", "$cppjob", "$review", "$reportDocument", "#Scrum"]
        },
        "review-design": {
            prompt: ["$mandatory", "$cppjob", "$review", "$reportDocument", "#Design"]
        },
        "review-plan": {
            prompt: ["$mandatory", "$cppjob", "$review", "$reportDocument", "#Plan"]
        },
        "review-summary": {
            prompt: ["$mandatory", "$cppjob", "$review", "$reportDocument", "#Summary"]
        },
        "review-final": {
            model: "planning",
            prompt: ["$mandatory", "$cppjob", "$review", "$reportDocument", "#Final"]
        },
        "review-apply": {
            model: "planning",
            prompt: ["$mandatory", "$cppjob", "$review", "#Apply"]
        }
    }
}

function validateEntry(entry: Entry): Entry {
    return entry;
}

export const entry = validateEntry(entryInput);
