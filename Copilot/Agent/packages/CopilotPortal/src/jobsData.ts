export interface GridColumn {
    name: string;
    jobName: string;
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

export type Model =
    | { category: string; }
    | { id: string; }
    ;

export interface Task {
    model?: Model;
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

export interface TaskWork<T> {
    kind: "Ref";
    workIdInJob: T;
    taskId: string;
    modelOverride?: Model;
}

export interface SequentialWork<T> {
    kind: "Seq";
    works: Work<T>[];
}

export interface ParallelWork<T> {
    kind: "Par";
    works: Work<T>[];
}

export interface LoopWork<T> {
    kind: "Loop";
    preCondition?: [boolean, Work<T>];
    postCondition?: [boolean, Work<T>];
    body: Work<T>;
}

export interface AltWork<T> {
    kind: "Alt";
    condition: Work<T>;
    trueWork?: Work<T>;
    falseWork?: Work<T>;
}

export type Work<T> = TaskWork<T> | SequentialWork<T> | ParallelWork<T> | LoopWork<T> | AltWork<T>;

export function assignWorkId(work: Work<never>): Work<number> {
    function helper(w: Work<never>, nextId: number[]): Work<number> {
        switch (w.kind) {
            case "Ref": {
                return { ...w, workIdInJob: nextId[0]++ };
            }
            case "Seq": {
                return { ...w, works: w.works.map(work => helper(work, nextId)) };
            }
            case "Par": {
                return { ...w, works: w.works.map(work => helper(work, nextId)) };
            }
            case "Loop": {
                return {
                    ...w,
                    preCondition: w.preCondition ? [w.preCondition[0], helper(w.preCondition[1], nextId)] : undefined,
                    postCondition: w.postCondition ? [w.postCondition[0], helper(w.postCondition[1], nextId)] : undefined,
                    body: helper(w.body, nextId)
                };
            }
            case "Alt": {
                return {
                    ...w,
                    condition: helper(w.condition, nextId),
                    trueWork: w.trueWork ? helper(w.trueWork, nextId) : undefined,
                    falseWork: w.falseWork ? helper(w.falseWork, nextId) : undefined
                };
            }
        }   
    }
    return helper(work, [0]);
}

export interface Job {
    work: Work<number>;
}

export interface Entry {
    models: { [key in string]: string };
    promptVariables: { [key in string]: string[] };
    grid: GridRow[];
    tasks: { [key in string]: Task };
    jobs: { [key in string]: Job };
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

export function getModelId(model: Model, entry: Entry): string {
    if ("category" in model) {
        return entry.models[model.category];
    } else {
        return model.id;
    }
}

function retryWithNewSessionCondition(retryTimes: number = 3): FailureAction {
    return ["RetryWithNewSession", retryTimes];
}

function retryFailedCondition(retryTimes: number = 3): FailureAction {
    return ["RetryWithUserPrompt", retryTimes, ["Please continue as you seemed to be accidentally stopped, because I spotted that: $reported-false-reason"]];
}

function makeRefWork(taskId: string, modelOverride?: Model): TaskWork<never> {
    return {
        kind: "Ref",
        workIdInJob: undefined as never,
        taskId,
        modelOverride
    };
}

function makeReviewWork(keyword: "scrum" | "design" | "plan" | "summary"): Work<never> {
    return {
        kind: "Seq",
        works: [{
            kind: "Loop",
            postCondition: [true, makeRefWork("review-final-task")],
            body: {
                kind: "Par",
                works: ["reviewers1", "reviewers2", "reviewers3"].map(reviewerKey => makeRefWork(`review-${keyword}`, { category: reviewerKey }))
            }
        },
        makeRefWork(`review-apply`)]
    }
}

function makeDocumentWork(jobName: string): Work<never> {
    return {
        kind: "Seq",
        works: [
            makeRefWork(`${jobName}-task`),
            makeReviewWork("scrum")
        ]
    };
}

const entryInput: Entry = {
    models: {
        driving: "gpt-5-mini",
        planning: "gpt-5.2",
        coding: "gpt-5.2-codex",
        reviewers1: "gpt-5.2-codex",
        reviewers2: "claude-opus-4.5",
        reviewers3: "gemini-3-pro-preview"
    },
    promptVariables: {
        reviewerBoardFiles: [
            "## Reviewer Board Files",
            "- gpt -> Copilot_Review_*_GPT.md",
            "- claude opus -> Copilot_Review_*_OPUS.md",
            "- gemini -> Copilot_Review_*_GEMINI.md",
        ],
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
            "REPO-ROOT/.github/TaskLogs/Copilot_Execution.md should exist and it has a `# !!!VERIFIED!!!`."
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
            "REPO-ROOT/.github/Scripts/Build.log must exist and the last several lines shows there is no error"
        ],
        testPassedFragment: [
            "REPO-ROOT/.github/Scripts/Execute.log must exist and the last several lines shows how many test files and test cases passed"
        ]
    },
    grid: [{
        keyword: "scrum",
        automate: false,
        jobs: [
            { name: "problem", jobName: "scrum-problem" },
            { name: "update", jobName: "scrum-update" }
        ]
    }, {
        keyword: "design",
        automate: true,
        jobs: [
            { name: "problem next", jobName: "design-problem-next" },
            { name: "update", jobName: "design-update" },
            { name: "problem", jobName: "design-problem" }
        ]
    }, {
        keyword: "plan",
        automate: true,
        jobs: [
            { name: "problem", jobName: "plan-problem" },
            { name: "update", jobName: "plan-update" }
        ]
    }, {
        keyword: "summary",
        automate: true,
        jobs: [
            { name: "problem", jobName: "summary-problem" },
            { name: "update", jobName: "summary-update" }
        ]
    }, {
        keyword: "execute",
        automate: true,
        jobs: [
            { name: "start", jobName: "execute-start" },
            { name: "update", jobName: "execute-update" }
        ]
    }, {
        keyword: "verify",
        automate: true,
        jobs: [
            { name: "start", jobName: "verify-start" },
            { name: "update", jobName: "verify-update" }
        ]
    }, {
        keyword: "scrum",
        automate: true,
        jobs: [
            { name: "learn", jobName: "scrum-learn" }
        ]
    }, {
        keyword: "refine",
        automate: false,
        jobs: [
            { name: "start", jobName: "refine" }
        ]
    }],
    tasks: {
        "scrum-problem-task": {
            model: { category: "planning" },
            requireUserInput: true,
            prompt: ["$cppjob", "$scrum", "# Problem", "$user-input"],
            criteria: {
                runConditionInSameSession: false,
                condition: ["$scrumDocReady"],
                failureAction: retryFailedCondition()
            }
        },
        "scrum-update-task": {
            model: { category: "planning" },
            requireUserInput: true,
            prompt: ["$cppjob", "$scrum", "# Update", "$user-input"],
            availability: {
                condition: ["$scrumDocReady"]
            }
        },
        "design-problem-next-task": {
            model: { category: "planning" },
            requireUserInput: false,
            prompt: ["$cppjob", "$design", "# Problem", "Next"],
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
            model: { category: "planning" },
            requireUserInput: true,
            prompt: ["$cppjob", "$design", "# Update", "$user-input"],
            availability: {
                condition: ["$designDocReady"]
            }
        },
        "design-problem-task": {
            model: { category: "planning" },
            requireUserInput: true,
            prompt: ["$cppjob", "$design", "# Problem", "$user-input"],
            criteria: {
                runConditionInSameSession: false,
                condition: ["$designDocReady"],
                failureAction: retryFailedCondition()
            }
        },
        "plan-problem-task": {
            model: { category: "planning" },
            requireUserInput: false,
            prompt: ["$cppjob", "$plan", "# Problem"],
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
            model: { category: "planning" },
            requireUserInput: true,
            prompt: ["$cppjob", "$plan", "# Update", "$user-input"],
            availability: {
                condition: ["$planDocReady"]
            }
        },
        "summary-problem-task": {
            model: { category: "planning" },
            requireUserInput: false,
            prompt: ["$cppjob", "$summary", "# Problem"],
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
            model: { category: "planning" },
            requireUserInput: true,
            prompt: ["$cppjob", "$summary", "# Update", "$user-input"],
            availability: {
                condition: ["$execDocReady"]
            }
        },
        "execute-task": {
            model: { category: "coding" },
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
            model: { category: "coding" },
            requireUserInput: true,
            prompt: ["$cppjob", "$execute", "# Update", "$user-input"],
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
            model: { category: "coding" },
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
            model: { category: "coding" },
            requireUserInput: true,
            prompt: ["$cppjob", "$verify", "# Update", "$user-input"],
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
            model: { category: "planning" },
            requireUserInput: false,
            prompt: ["$cppjob", "$scrum", "# Learn"],
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
            model: { category: "planning" },
            requireUserInput: false,
            prompt: ["$cppjob", "$refine"],
            availability: {
                previousTasks: ["scrum-learn-task"]
            }
        },
        "review-scrum-task": {
            prompt: ["$cppjob", "$review", "$reportDocument", "# Scrum", "$reviewerBoardFiles"],
            requireUserInput: false,
            criteria: {
                toolExecuted: ["job_prepare_document"],
                runConditionInSameSession: false,
                condition: ["$reportedDocReady"],
                failureAction: retryWithNewSessionCondition()
            }
        },
        "review-design-task": {
            prompt: ["$cppjob", "$review", "$reportDocument", "# Design", "$reviewerBoardFiles"],
            requireUserInput: false,
            criteria: {
                toolExecuted: ["job_prepare_document"],
                runConditionInSameSession: false,
                condition: ["$reportedDocReady"],
                failureAction: retryWithNewSessionCondition()
            }
        },
        "review-plan-task": {
            prompt: ["$cppjob", "$review", "$reportDocument", "# Plan", "$reviewerBoardFiles"],
            requireUserInput: false,
            criteria: {
                toolExecuted: ["job_prepare_document"],
                runConditionInSameSession: false,
                condition: ["$reportedDocReady"],
                failureAction: retryWithNewSessionCondition()
            }
        },
        "review-summary-task": {
            prompt: ["$cppjob", "$review", "$reportDocument", "# Summary", "$reviewerBoardFiles"],
            requireUserInput: false,
            criteria: {
                toolExecuted: ["job_prepare_document"],
                runConditionInSameSession: false,
                condition: ["$reportedDocReady"],
                failureAction: retryWithNewSessionCondition()
            }
        },
        "review-final-task": {
            model: { category: "planning" },
            requireUserInput: false,
            prompt: [
                "$cppjob",
                "$review",
                "YOU MUST call job_prerequisite_failed if 1) in the LATEST ROUND not all models created their review document or 2) not all replies in all review documents from the LATEST ROUND agree.",
                "# Final",
                "$reviewerBoardFiles"
            ],
            criteria: {
                runConditionInSameSession: false,
                condition: ["$reviewDocReady"],
                failureAction: retryFailedCondition()
            }
        },
        "review-apply-task": {
            model: { category: "planning" },
            requireUserInput: false,
            prompt: ["$cppjob", "$review", "# Apply", "$reviewerBoardFiles"],
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
            model: { category: "planning" },
            requireUserInput: true,
            prompt: ["$cppjob", "$ask", "$user-input"]
        },
        "code-task": {
            model: { category: "planning" },
            requireUserInput: true,
            prompt: ["$cppjob", "$code", "$user-input"],
            criteria: {
                runConditionInSameSession: true,
                condition: ["$simpleCondition", "Both conditions satisfy: 1) $buildSucceededFragment; 2) $testPassedFragment."],
                failureAction: retryFailedCondition()
            }
        }
    },
    jobs: {
        "scrum-problem": { work: makeDocumentWork("scrum-problem") },
        "scrum-update": { work: makeDocumentWork("scrum-update") },
        "design-problem-next": { work: makeDocumentWork("design-problem-next") },
        "design-update": { work: makeDocumentWork("design-update") },
        "design-problem": { work: makeDocumentWork("design-problem") },
        "plan-problem": { work: makeDocumentWork("plan-problem") },
        "plan-update": { work: makeDocumentWork("plan-update") },
        "summary-problem": { work: makeDocumentWork("summary-problem") },
        "summary-update": { work: makeDocumentWork("summary-update") },
        "execute-start": { work: makeRefWork("execute-task") },
        "execute-update": { work: makeRefWork("execute-update-task") },
        "verify-start": { work: makeRefWork("verify-task") },
        "verify-update": { work: makeRefWork("verify-update-task") },
        "scrum-learn": { work: makeRefWork("scrum-learn-task") },
        "refine": { work: makeRefWork("refine-task") },
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
        if (task?.model && "category" in task.model) {
            if (!modelKeys.includes(task.model.category)) {
                throw new Error(`${taskBase}.model.category: "${task.model.category}" is not a valid model key.`);
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

    // Validate jobs
    if (entry.jobs) {
        const allModelKeys = Object.keys(entry.models);
        for (const [jobName, job] of Object.entries(entry.jobs)) {
            const jobBase = `${codePath}entry.jobs["${jobName}"]`;
            validateWork(entry, job.work, jobBase + ".work", allModelKeys);
        }
    }

    return entry;
}

function validateWork(entry: Entry, work: Work<unknown>, codePath: string, modelKeys: string[]): void {
    switch (work.kind) {
        case "Ref": {
            const tw = work as TaskWork<unknown>;
            if (!(tw.taskId in entry.tasks)) {
                throw new Error(`${codePath}.taskId: "${tw.taskId}" is not a valid task name.`);
            }
            if (tw.modelOverride) {
                if ("category" in tw.modelOverride) {
                    if (!modelKeys.includes(tw.modelOverride.category)) {
                        throw new Error(`${codePath}.modelOverride.category: "${tw.modelOverride.category}" is not a valid model key.`);
                    }
                }
            } else {
                // modelOverride must be defined if the task has no specified model
                const task = entry.tasks[tw.taskId];
                if (!task.model) {
                    throw new Error(`${codePath}.modelOverride: must be defined because task "${tw.taskId}" has no specified model.`);
                }
            }
            break;
        }
        case "Seq": {
            const sw = work as SequentialWork<unknown>;
            for (let i = 0; i < sw.works.length; i++) {
                validateWork(entry, sw.works[i], `${codePath}.works[${i}]`, modelKeys);
            }
            break;
        }
        case "Par": {
            const pw = work as ParallelWork<unknown>;
            for (let i = 0; i < pw.works.length; i++) {
                validateWork(entry, pw.works[i], `${codePath}.works[${i}]`, modelKeys);
            }
            break;
        }
        case "Loop": {
            const lw = work as LoopWork<unknown>;
            if (lw.preCondition) {
                validateWork(entry, lw.preCondition[1], `${codePath}.preCondition[1]`, modelKeys);
            }
            if (lw.postCondition) {
                validateWork(entry, lw.postCondition[1], `${codePath}.postCondition[1]`, modelKeys);
            }
            validateWork(entry, lw.body, `${codePath}.body`, modelKeys);
            break;
        }
        case "Alt": {
            const aw = work as AltWork<unknown>;
            validateWork(entry, aw.condition, `${codePath}.condition`, modelKeys);
            if (aw.trueWork) {
                validateWork(entry, aw.trueWork, `${codePath}.trueWork`, modelKeys);
            }
            if (aw.falseWork) {
                validateWork(entry, aw.falseWork, `${codePath}.falseWork`, modelKeys);
            }
            break;
        }
    }
}

export const entry = validateEntry(entryInput, "jobsData.ts:");
