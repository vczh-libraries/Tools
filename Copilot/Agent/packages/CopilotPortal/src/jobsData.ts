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
        previousTasks?: string[];
        condition?: Prompt;
    };
    criteria?: {
        toolExecuted?: string[];
        condition?: Prompt;
    };
}

export interface Entry {
    models: {
        driving: string;
        planning: string;
        coding: string;
        reviewers: string[];
    };
    promptVariables: {[key in string]: string[]};
    grid: GridRow[];
    tasks: {[key in string]: Task};
}

export const availableTools: string[] = [
    "job_prepare_document",
    "job_boolean_true",
    "job_boolean_false"
];

export const runtimeVariables: string[] = [
    "$user-input",
    "$reported-document"
];

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
    promptVariables: {
        defineRepoRoot: [
            "REPO-ROOT is the root directory of the repo (aka the working directory you are currently in)"
        ],
        cppjob: [
            "$defineRepoRoot",
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
        simpleCondition: [
            "$defineRepoRoot",
            "$reportBoolean",
            "Call job_boolean_true if the below condition satisfies, or call job_boolean_false if it does not satisfy."
        ],
        scrumDocReady: [
            "$defineRepoRoot",
            "$simpleCondition",
            "REPO-ROOT/.github/TaskLogs/Copilot_Scrum.md should exist and its content should not be just a title."
        ],
        designDocReady: [
            "$defineRepoRoot",
            "$simpleCondition",
            "REPO-ROOT/.github/TaskLogs/Copilot_Task.md should exist and its content should not be just a title."
        ],
        planDocReady: [
            "$defineRepoRoot",
            "$simpleCondition",
            "REPO-ROOT/.github/TaskLogs/Copilot_Planning.md should exist and its content should not be just a title."
        ],
        execDocReady: [
            "$defineRepoRoot",
            "$simpleCondition",
            "REPO-ROOT/.github/TaskLogs/Copilot_Execution.md should exist and its content should not be just a title."
        ],
        execDocVerified: [
            "$defineRepoRoot",
            "$simpleCondition",
            "REPO-ROOT/.github/TaskLogs/Copilot_Execution.md should exist and its has a `# !!!VERIFIED!!!`."
        ],
        reviewDocReady: [
            "$defineRepoRoot",
            "$simpleCondition",
            "REPO-ROOT/.github/TaskLogs/Copilot_Review.md should exist and its content should not be just a title."
        ],
        reportedDocReady: [
            "$simpleCondition",
            "$reported-document should exist and its content should not be just a title."
        ],
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
            prompt: ["$cppjob", "$scrum", "#Problem", "$user-input"],
            criteria: {
                condition: ["$scrumDocReady"]
            }
        },
        "scrum-update-task": {
            model: "planning",
            prompt: ["$cppjob", "$scrum", "#Update", "$user-input"],
            availability: {
                condition: ["$scrumDocReady"]
            }
        },
        "design-problem-next-task": {
            model: "planning",
            prompt: ["$cppjob", "$design", "#Problem", "Next"],
            availability: {
                condition: ["$scrumDocReady"]
            },
            criteria: {
                condition: ["$designDocReady"]
            }
        },
        "design-update-task": {
            model: "planning",
            prompt: ["$cppjob", "$design", "#Update", "$user-input"],
            availability: {
                condition: ["$designDocReady"]
            }
        },
        "design-problem-task": {
            model: "planning",
            prompt: ["$cppjob", "$design", "#Problem", "$user-input"],
            criteria: {
                condition: ["$designDocReady"]
            }
        },
        "plan-problem-task": {
            model: "planning",
            prompt: ["$cppjob", "$plan", "#Problem"],
            availability: {
                condition: ["$designDocReady"]
            },
            criteria: {
                condition: ["$planDocReady"]
            }
        },
        "plan-update-task": {
            model: "planning",
            prompt: ["$cppjob", "$plan", "#Update", "$user-input"],
            availability: {
                condition: ["$planDocReady"]
            }
        },
        "summary-problem-task": {
            model: "planning",
            prompt: ["$cppjob", "$summary", "#Problem"],
            availability: {
                condition: ["$planDocReady"]
            },
            criteria: {
                condition: ["$execDocReady"]
            }
        },
        "summary-update-task": {
            model: "planning",
            prompt: ["$cppjob", "$summary", "#Update", "$user-input"],
            availability: {
                condition: ["$execDocReady"]
            }
        },
        "execute-task": {
            model: "coding",
            prompt: ["$cppjob", "$execute"],
            availability: {
                condition: ["$execDocReady"]
            }
        },
        "execute-update-task": {
            model: "coding",
            prompt: ["$cppjob", "$execute", "#Update", "$user-input"],
            availability: {
                previousJobKeywords: ["execute", "verify"],
                condition: ["$execDocReady"]
            }
        },
        "verify-task": {
            model: "coding",
            prompt: ["$cppjob", "$verify"],
            availability: {
                previousJobKeywords: ["execute", "verify"],
                condition: ["$execDocReady"]
            }
        },
        "verify-update-task": {
            model: "coding",
            prompt: ["$cppjob", "$verify", "#Update", "$user-input"],
            availability: {
                previousJobKeywords: ["execute", "verify"],
                condition: ["$execDocReady"]
            }
        },
        "scrum-learn-task": {
            model: "planning",
            prompt: ["$cppjob", "$scrum", "#Learn"],
            availability: {
                condition: ["$execDocVerified"]
            }
        },
        "refine-task": {
            model: "planning",
            prompt: ["$cppjob", "$refine"],
            availability: {
                previousTasks: ["scrum-learn-task"]
            }
        },
        "review-scrum": {
            prompt: ["$cppjob", "$review", "$reportDocument", "#Scrum"]
        },
        "review-design": {
            prompt: ["$cppjob", "$review", "$reportDocument", "#Design"]
        },
        "review-plan": {
            prompt: ["$cppjob", "$review", "$reportDocument", "#Plan"]
        },
        "review-summary": {
            prompt: ["$cppjob", "$review", "$reportDocument", "#Summary"]
        },
        "review-final": {
            model: "planning",
            prompt: ["$cppjob", "$review", "#Final"]
        },
        "review-apply": {
            model: "planning",
            prompt: ["$cppjob", "$review", "#Apply"],
            availability: {
                previousTasks: ["review-final"]
            }
        }
    }
}

export function expandPromptStatic(entry: Entry, codePath: string, prompt: Prompt): Prompt {
    if (prompt.length === 0) {
        throw new Error(`${codePath}: Prompt is empty.`);
    }
    const joined = prompt.join("\n");
    const resolved = resolveVariablesStatic(entry, codePath, joined);
    return [resolved];
}

function resolveVariablesStatic(entry: Entry, codePath: string, text: string): string {
    return text.replace(/\$[a-zA-Z]+(?:-[a-zA-Z]+)*/g, (match) => {
        const variableName = match;
        if (runtimeVariables.includes(variableName)) {
            return variableName;
        }
        const key = variableName.slice(1); // remove leading $
        if (key in entry.promptVariables) {
            const childCodePath = `${codePath}/${variableName}`;
            const childPrompt = entry.promptVariables[key];
            const expanded = expandPromptStatic(entry, childCodePath, childPrompt);
            return expanded[0];
        }
        throw new Error(`${codePath}: Cannot find prompt variable: ${variableName}.`);
    });
}

export function expandPromptDynamic(entry: Entry, prompt: Prompt, values: Record<string, string>): Prompt {
    if (prompt.length !== 1) {
        throw new Error(`expandPromptDynamic: Prompt must have exactly one item, got ${prompt.length}.`);
    }
    const text = prompt[0];
    const resolved = text.replace(/\$[a-zA-Z]+(?:-[a-zA-Z]+)*/g, (match) => {
        const variableName = match;
        const key = variableName.slice(1);
        if (key in values) {
            return values[key];
        }
        throw new Error(`expandPromptDynamic: Cannot find runtime variable: ${variableName}.`);
    });
    return [resolved];
}

function validateEntry(entry: Entry, codePath: string): Entry {
    const modelKeys = Object.keys(entry.models).filter(k => k !== "reviewers");
    const gridKeywords = entry.grid.map(row => row.keyword);

    for (const [taskName, task] of Object.entries(entry.tasks)) {
        const taskPath = `${codePath}/tasks/${taskName}`;

        // Validate model
        if (task.model !== undefined) {
            if (!modelKeys.includes(task.model)) {
                throw new Error(`${taskPath}: Model "${task.model}" is not a valid model key.`);
            }
        }

        // Expand and validate prompt
        task.prompt = expandPromptStatic(entry, `${taskPath}/prompt`, task.prompt);

        // Validate availability
        if (task.availability) {
            if (task.availability.previousJobKeywords) {
                for (const kw of task.availability.previousJobKeywords) {
                    if (!gridKeywords.includes(kw)) {
                        throw new Error(`${taskPath}: previousJobKeywords "${kw}" is not a valid grid keyword.`);
                    }
                }
            }
            if (task.availability.previousTasks) {
                for (const pt of task.availability.previousTasks) {
                    if (!(pt in entry.tasks)) {
                        throw new Error(`${taskPath}: previousTasks "${pt}" is not a valid task name.`);
                    }
                }
            }
            if (task.availability.condition) {
                task.availability.condition = expandPromptStatic(entry, `${taskPath}/availability/condition`, task.availability.condition);
            }
        }

        // Validate criteria
        if (task.criteria) {
            if (task.criteria.toolExecuted) {
                for (const tool of task.criteria.toolExecuted) {
                    if (!availableTools.includes(tool)) {
                        throw new Error(`${taskPath}: toolExecuted "${tool}" is not an available tool.`);
                    }
                }
            }
            if (task.criteria.condition) {
                task.criteria.condition = expandPromptStatic(entry, `${taskPath}/criteria/condition`, task.criteria.condition);
            }
        }
    }

    return entry;
}

export const entry = validateEntry(entryInput, "jobsData.ts:");
