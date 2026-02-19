import type { Entry, Work, TaskWork, Model } from "./jobsDef.js";
import { retryWithNewSessionCondition, retryFailed, retryFailedCondition, validateEntry } from "./jobsDef.js";

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
            postCondition: [false, makeRefWork("review-final-task")],
            body: {
                kind: "Par",
                works: ["reviewers1", "reviewers2", "reviewers3"].map(reviewerKey => makeRefWork(`review-${keyword}-task`, { category: reviewerKey }))
            }
        },
        makeRefWork(`review-apply-task`)]
    }
}

function makeDocumentWork(jobName: string, keyword: "scrum" | "design" | "plan" | "summary"): Work<never> {
    return {
        kind: "Seq",
        works: [
            makeRefWork(`${jobName}-task`),
            makeReviewWork(keyword)
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
            "## Your Identity",
            "You are $task-model, one of the reviewers in the review board.",
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
            "YOU MUST use the job_prepare_document tool with an argument: an absolute path of the document you are about to create or update.",
            "YOU MUST use the job_prepare_document tool even when you think nothing needs to be updated, it is to make sure you are clear about which document to work on."
        ],
        reportBoolean: [
            "YOU MUST use either job_boolean_true tool or job_boolean_false tool to answer an yes/no question, with the reason in the argument."
        ],
        simpleCondition: [
            "$defineRepoRoot",
            "$reportBoolean",
            "Use job_boolean_true tool if the below condition satisfies, or use job_boolean_false tool if it does not satisfy."
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
        clearBuildTestLog: [
            "In REPO-ROOT/.github/Scripts, delete both Build.log and Execute.log."
        ],
        buildSucceededFragment: [
            "REPO-ROOT/.github/Scripts/Build.log must exist and the last several lines shows there is no error"
        ],
        testPassedFragment: [
            "REPO-ROOT/.github/Scripts/Execute.log must exist and the last several lines shows how many test files and test cases passed"
        ]
    },
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
                condition: ["$execDocReady", "$clearBuildTestLog"]
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
                condition: ["$execDocReady", "$clearBuildTestLog"]
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
                condition: ["$execDocReady", "$clearBuildTestLog"]
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
                condition: ["$execDocReady", "$clearBuildTestLog"]
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
                "# Final",
                "$reviewerBoardFiles"
            ],
            criteria: {
                runConditionInSameSession: false,
                condition: ["$reviewDocReady"],
                failureAction: retryFailedCondition(0)
            }
        },
        "review-apply-task": {
            model: { category: "planning" },
            requireUserInput: false,
            prompt: ["$cppjob", "$review", "# Apply", "$reviewerBoardFiles"],
            availability: {
                previousTasks: ["review-final-task"]
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
        "scrum-problem": { work: makeDocumentWork("scrum-problem", "scrum") },
        "scrum-update": { work: makeDocumentWork("scrum-update", "scrum") },
        "design-problem-next": { work: makeDocumentWork("design-problem-next", "design") },
        "design-update": { work: makeDocumentWork("design-update", "design") },
        "design-problem": { work: makeDocumentWork("design-problem", "design") },
        "plan-problem": { work: makeDocumentWork("plan-problem", "plan") },
        "plan-update": { work: makeDocumentWork("plan-update", "plan") },
        "summary-problem": { work: makeDocumentWork("summary-problem", "summary") },
        "summary-update": { work: makeDocumentWork("summary-update", "summary") },
        "execute-start": { work: makeRefWork("execute-task") },
        "execute-update": { work: makeRefWork("execute-update-task") },
        "verify-start": { work: makeRefWork("verify-task") },
        "verify-update": { work: makeRefWork("verify-update-task") },
        "scrum-learn": { work: makeRefWork("scrum-learn-task") },
        "refine": { work: makeRefWork("refine-task") },
    },
    grid: [{
        keyword: "scrum",
        jobs: [
            { name: "problem", jobName: "scrum-problem" },
            { name: "update", jobName: "scrum-update" }
        ]
    }, {
        keyword: "design",
        jobs: [
            { name: "problem next", jobName: "design-problem-next" },
            { name: "update", jobName: "design-update" },
            { name: "problem", jobName: "design-problem" }
        ]
    }, {
        keyword: "plan",
        jobs: [
            { name: "problem", jobName: "plan-problem" },
            { name: "update", jobName: "plan-update" }
        ]
    }, {
        keyword: "summary",
        jobs: [
            { name: "problem", jobName: "summary-problem" },
            { name: "update", jobName: "summary-update" }
        ]
    }, {
        keyword: "execute",
        jobs: [
            { name: "start", jobName: "execute-start" },
            { name: "update", jobName: "execute-update" }
        ]
    }, {
        keyword: "verify",
        jobs: [
            { name: "start", jobName: "verify-start" },
            { name: "update", jobName: "verify-update" }
        ]
    }, {
        keyword: "scrum",
        jobs: [
            { name: "learn", jobName: "scrum-learn" }
        ]
    }, {
        keyword: "refine",
        jobs: [
            { name: "start", jobName: "refine" }
        ]
    }]
}

export const entry = validateEntry(entryInput, "jobsData.ts:");
