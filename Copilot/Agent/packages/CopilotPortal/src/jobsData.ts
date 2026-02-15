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

export type FailureAction =
    // retry X times with a new session, but if job_prerequisite_failed is called, fails directly.
    | ["RetryWithNewSession", number]
    // retry X times within the same session with an additional prompt, but if job_prerequisite_failed is called, fails directly.
    | ["RetryWithUserPrompt", number, Prompt]
    ;

export interface Task {
    model?: string;
    prompt: Prompt;
    requireUserInput: boolean;
    availability?: {
        previousJobKeywords?: string[];
        previousTasks?: string[];
        condition?: Prompt;
    };
    criteria?: {
        toolExecuted?: string[];
        failureAction: FailureAction;
    } & ({
        condition: Prompt;
        runConditionInSameSession: boolean;
    } | never);
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
    "job_boolean_false",
    "job_prerequisite_failed"
];

export const runtimeVariables: string[] = [
    "$user-input",
    "$reported-document",
    "$reported-true-reason",
    "$reported-false-reason"
];

function retryWithNewSessionCondition(retryTimes: number = 3): FailureAction {
    return ["RetryWithNewSession", retryTimes];
}

function retryFailedCondition(retryTimes: number = 3): FailureAction {
    return ["RetryWithUserPrompt", 3, ["Please continue as you seemed to be accidentally stopped, because I spotted that: $reported-false-reason"]];
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
        ask: [
            "Execute the instruction in REPO-ROOT/.github/prompts/ask.prompt.md immediately."
        ],
        code: [
            "Execute the instruction in REPO-ROOT/.github/prompts/code.prompt.md immediately."
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
            "$simpleCondition",
            "REPO-ROOT/.github/TaskLogs/Copilot_Scrum.md should exist and its content should not be just a title."
        ],
        designDocReady: [
            "$simpleCondition",
            "REPO-ROOT/.github/TaskLogs/Copilot_Task.md should exist and its content should not be just a title."
        ],
        planDocReady: [
            "$simpleCondition",
            "REPO-ROOT/.github/TaskLogs/Copilot_Planning.md should exist and its content should not be just a title."
        ],
        execDocReady: [
            "$simpleCondition",
            "REPO-ROOT/.github/TaskLogs/Copilot_Execution.md should exist and its content should not be just a title."
        ],
        execDocVerified: [
            "$simpleCondition",
            "REPO-ROOT/.github/TaskLogs/Copilot_Execution.md should exist and its has a `# !!!VERIFIED!!!`."
        ],
        reviewDocReady: [
            "$simpleCondition",
            "REPO-ROOT/.github/TaskLogs/Copilot_Review.md should exist and its content should not be just a title."
        ],
        reportedDocReady: [
            "$simpleCondition",
            "$reported-document should exist and its content should not be just a title."
        ],
        buildSucceededFragment: [
            "REPO-ROOT/.github/Scripts/Build.log must exists and the last several lines shows there is no error"
        ],
        testPassedFragment: [
            "REPO-ROOT/.github/Scripts/Execute.log must exists and the last several lines shows how many test files and test cases passed"
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
            requireUserInput: true,
            prompt: ["$cppjob", "$scrum", "#Problem", "$user-input"],
            criteria: {
                runConditionInSameSession: false,
                condition: ["$scrumDocReady"],
                failureAction: retryFailedCondition()
            }
        },
        "scrum-update-task": {
            model: "planning",
            requireUserInput: true,
            prompt: ["$cppjob", "$scrum", "#Update", "$user-input"],
            availability: {
                condition: ["$scrumDocReady"]
            }
        },
        "design-problem-next-task": {
            model: "planning",
            requireUserInput: false,
            prompt: ["$cppjob", "$design", "#Problem", "Next"],
            availability: {
                condition: ["$scrumDocReady"]
            },
            criteria: {
                runConditionInSameSession: false,
                condition: ["$designDocReady"],
                failureAction: retryFailedCondition()
            }
        },
        "design-update-task": {
            model: "planning",
            requireUserInput: true,
            prompt: ["$cppjob", "$design", "#Update", "$user-input"],
            availability: {
                condition: ["$designDocReady"]
            }
        },
        "design-problem-task": {
            model: "planning",
            requireUserInput: true,
            prompt: ["$cppjob", "$design", "#Problem", "$user-input"],
            criteria: {
                runConditionInSameSession: false,
                condition: ["$designDocReady"],
                failureAction: retryFailedCondition()
            }
        },
        "plan-problem-task": {
            model: "planning",
            requireUserInput: false,
            prompt: ["$cppjob", "$plan", "#Problem"],
            availability: {
                condition: ["$designDocReady"]
            },
            criteria: {
                runConditionInSameSession: false,
                condition: ["$planDocReady"],
                failureAction: retryFailedCondition()
            }
        },
        "plan-update-task": {
            model: "planning",
            requireUserInput: true,
            prompt: ["$cppjob", "$plan", "#Update", "$user-input"],
            availability: {
                condition: ["$planDocReady"]
            }
        },
        "summary-problem-task": {
            model: "planning",
            requireUserInput: false,
            prompt: ["$cppjob", "$summary", "#Problem"],
            availability: {
                condition: ["$planDocReady"]
            },
            criteria: {
                runConditionInSameSession: false,
                condition: ["$execDocReady"],
                failureAction: retryFailedCondition()
            }
        },
        "summary-update-task": {
            model: "planning",
            requireUserInput: true,
            prompt: ["$cppjob", "$summary", "#Update", "$user-input"],
            availability: {
                condition: ["$execDocReady"]
            }
        },
        "execute-task": {
            model: "coding",
            requireUserInput: false,
            prompt: ["$cppjob", "$execute"],
            availability: {
                condition: ["$execDocReady"]
            },
            criteria: {
                runConditionInSameSession: false,
                condition: ["$simpleCondition", "$buildSucceededFragment."],
                failureAction: retryFailedCondition()
            }
        },
        "execute-update-task": {
            model: "coding",
            requireUserInput: true,
            prompt: ["$cppjob", "$execute", "#Update", "$user-input"],
            availability: {
                previousJobKeywords: ["execute", "verify"],
                condition: ["$execDocReady"]
            },
            criteria: {
                runConditionInSameSession: false,
                condition: ["$simpleCondition", "$buildSucceededFragment."],
                failureAction: retryFailedCondition()
            }
        },
        "verify-task": {
            model: "coding",
            requireUserInput: false,
            prompt: ["$cppjob", "$verify"],
            availability: {
                previousJobKeywords: ["execute", "verify"],
                condition: ["$execDocReady"]
            },
            criteria: {
                runConditionInSameSession: false,
                condition: ["$simpleCondition", "$testPassedFragment."],
                failureAction: retryFailedCondition()
            }
        },
        "verify-update-task": {
            model: "coding",
            requireUserInput: true,
            prompt: ["$cppjob", "$verify", "#Update", "$user-input"],
            availability: {
                previousJobKeywords: ["execute", "verify"],
                condition: ["$execDocReady"]
            },
            criteria: {
                runConditionInSameSession: false,
                condition: ["$simpleCondition", "$testPassedFragment."],
                failureAction: retryFailedCondition()
            }
        },
        "scrum-learn-task": {
            model: "planning",
            requireUserInput: false,
            prompt: ["$cppjob", "$scrum", "#Learn"],
            availability: {
                condition: ["$execDocVerified"]
            },
            criteria: {
                runConditionInSameSession: false,
                condition: ["$simpleCondition", "All REPO-ROOT/.github/TaskLogs/Copilot_(Task|Planning|Execution).md must have been deleted."],
                failureAction: retryFailedCondition()
            }
        },
        "refine-task": {
            model: "planning",
            requireUserInput: false,
            prompt: ["$cppjob", "$refine"],
            availability: {
                previousTasks: ["scrum-learn-task"]
            }
        },
        "review-scrum": {
            prompt: ["$cppjob", "$review", "$reportDocument", "#Scrum"],
            requireUserInput: false,
            criteria: {
                toolExecuted: ["job_prepare_document"],
                runConditionInSameSession: false,
                condition: ["$reportedDocReady"],
                failureAction: retryWithNewSessionCondition()
            }
        },
        "review-design": {
            prompt: ["$cppjob", "$review", "$reportDocument", "#Design"],
            requireUserInput: false,
            criteria: {
                toolExecuted: ["job_prepare_document"],
                runConditionInSameSession: false,
                condition: ["$reportedDocReady"],
                failureAction: retryWithNewSessionCondition()
            }
        },
        "review-plan": {
            prompt: ["$cppjob", "$review", "$reportDocument", "#Plan"],
            requireUserInput: false,
            criteria: {
                toolExecuted: ["job_prepare_document"],
                runConditionInSameSession: false,
                condition: ["$reportedDocReady"],
                failureAction: retryWithNewSessionCondition()
            }
        },
        "review-summary": {
            prompt: ["$cppjob", "$review", "$reportDocument", "#Summary"],
            requireUserInput: false,
            criteria: {
                toolExecuted: ["job_prepare_document"],
                runConditionInSameSession: false,
                condition: ["$reportedDocReady"],
                failureAction: retryWithNewSessionCondition()
            }
        },
        "review-final": {
            model: "planning",
            requireUserInput: false,
            prompt: [
                "$cppjob",
                "$review",
                "YOU MUST call job_prerequisite_failed if 1) in the last round not all models created their review document or 2) not all replies in all review documents from the last round are agree.",
                "#Final"
            ],
            criteria: {
                runConditionInSameSession: false,
                condition: ["$reviewDocReady"],
                failureAction: retryFailedCondition()
            }
        },
        "review-apply": {
            model: "planning",
            requireUserInput: false,
            prompt: ["$cppjob", "$review", "#Apply"],
            availability: {
                previousTasks: ["review-final"]
            },
            criteria: {
                runConditionInSameSession: false,
                condition: ["$simpleCondition", "Every REPO-ROOT/.github/TaskLogs/Copilot_Review*.md must have been deleted."],
                failureAction: retryFailedCondition()
            }
        },
        "ask-task": {
            model: "planning",
            requireUserInput: true,
            prompt: ["$cppjob", "$ask", "$user-input"]
        },
        "code-task": {
            model: "planning",
            requireUserInput: true,
            prompt: ["$cppjob", "$code", "$user-input"],
            criteria: {
                runConditionInSameSession: true,
                condition: ["$simpleCondition", "Both condition satisfies: 1) $buildSucceededFragment; 2) $testPassedFragment."],
                failureAction: retryFailedCondition()
            }
        }
    }
}

export function expandPromptStatic(entry: Entry, codePath: string, prompt: Prompt, requiresBooleanTool?: boolean): Prompt {
    if (prompt.length === 0) {
        throw new Error(`${codePath}: Prompt is empty.`);
    }
    const joined = prompt.join("\n");
    const resolved = resolveVariablesStatic(entry, codePath, joined);
    if (requiresBooleanTool) {
        if (!resolved.includes("job_boolean_true") && !resolved.includes("job_boolean_false")) {
            throw new Error(`${codePath}: Boolean tool (job_boolean_true or job_boolean_false) must be mentioned.`);
        }
    }
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

export function validateEntry(entry: Entry, codePath: string): Entry {
    const modelKeys = Object.keys(entry.models).filter(k => k !== "reviewers");
    const gridKeywords = entry.grid.map(row => row.keyword);

    for (const [taskName, task] of Object.entries(entry.tasks)) {
        const taskBase = `${codePath}entry.tasks["${taskName}"]`;

        // Validate model
        if (task.model !== undefined) {
            if (!modelKeys.includes(task.model)) {
                throw new Error(`${taskBase}.model: "${task.model}" is not a valid model key.`);
            }
        }

        // Expand and validate prompt
        task.prompt = expandPromptStatic(entry, `${taskBase}.prompt`, task.prompt);

        // Validate requireUserInput
        const expandedPromptText = task.prompt[0];
        if (task.requireUserInput) {
            if (!expandedPromptText.includes("$user-input")) {
                throw new Error(`${taskBase}.requireUserInput: Prompt should use $user-input when requireUserInput is true.`);
            }
        } else {
            if (expandedPromptText.includes("$user-input")) {
                throw new Error(`${taskBase}.requireUserInput: Prompt should not use $user-input when requireUserInput is false.`);
            }
        }

        // Validate availability
        if (task.availability) {
            if (task.availability.previousJobKeywords) {
                for (let i = 0; i < task.availability.previousJobKeywords.length; i++) {
                    const kw = task.availability.previousJobKeywords[i];
                    if (!gridKeywords.includes(kw)) {
                        throw new Error(`${taskBase}.availability.previousJobKeywords[${i}]: "${kw}" is not a valid grid keyword.`);
                    }
                }
            }
            if (task.availability.previousTasks) {
                for (let i = 0; i < task.availability.previousTasks.length; i++) {
                    const pt = task.availability.previousTasks[i];
                    if (!(pt in entry.tasks)) {
                        throw new Error(`${taskBase}.availability.previousTasks[${i}]: "${pt}" is not a valid task name.`);
                    }
                }
            }
            if (task.availability.condition) {
                task.availability.condition = expandPromptStatic(entry, `${taskBase}.availability.condition`, task.availability.condition, true);
            }
        }

        // Validate criteria
        if (task.criteria) {
            if (task.criteria.toolExecuted) {
                for (let i = 0; i < task.criteria.toolExecuted.length; i++) {
                    const tool = task.criteria.toolExecuted[i];
                    if (!availableTools.includes(tool)) {
                        throw new Error(`${taskBase}.criteria.toolExecuted[${i}]: "${tool}" is not an available tool.`);
                    }
                }
            }
            if (task.criteria.condition) {
                task.criteria.condition = expandPromptStatic(entry, `${taskBase}.criteria.condition`, task.criteria.condition, true);
            }
            if (task.criteria.failureAction && task.criteria.failureAction.length === 3) {
                task.criteria.failureAction[2] = expandPromptStatic(entry, `${taskBase}.criteria.failureAction[2]`, task.criteria.failureAction[2]);
            }
        }
    }

    return entry;
}

export const entry = validateEntry(entryInput, "jobsData.ts:");
