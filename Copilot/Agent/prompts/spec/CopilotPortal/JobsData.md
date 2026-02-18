# Specification

Root folder of the project is `REPO-ROOT/Copilot/Agent`.
Read `README.md` to understand the whole picture of the project as well as specification organizations.

## Related Files

- `src/jobsDef.ts`
- `src/jobsChart.ts`
- `src/jobsData.ts`
- `src/jobsApi.ts`

## Functions

### expandPromptStatic

**Referenced by**:
- JobsData.md: `### expandPromptDynamic`, `### validateEntry`

A function convert from `Prompt` to `Prompt` with only one string.
`Prompt` is a string array, the function should join them with LF character.
In each string there might be variables.
An variable is $ followed by one or multiple words connected with hypens.
When an variable is in `entry.promptVariables`, replace the variable with its values.
When an variable is in `runtimeVariables`, keep them.
When it fails to look up the value, report an error `${codePath}: Cannot find prompt variable: ${variableName}.`.
Be aware of that, the value is still a `Prompt`, so it is recursive.

When calls `expandPromptStatic` recursively for a resolved prompt variable,
the `codePath` becomes `${codePath}/$${variableName}`.

Report an error if `prompt` is empty.

### expandPromptDynamic

**Referenced by**:
- JobsData.md: `## Running Tasks`

It works like `expandPromptStatic`, but assert `prompt` has exactly one item.
Look up all `runtimeVariables` in `values` argument.
Be aware of that, not all variable has an value assigned.
When it fails to look up the value, report an error.

### validateEntry

**Referenced by**:
- API.md: `### copilot/test/installJobsEntry`, `### sendPromptWithCrashRetry`

Perform all verifications, verify and update all prompts with `expandPromptStatic`:
- entry.tasks[name].prompt
- entry.tasks[name].availability.condition (run extra verification)
- entry.tasks[name].criteria.condition (run extra verification)
- entry.tasks[name].criteria.failureAction[2]

When extra verification is needed,
`expandPromptStatic`'s `requiresBooleanTool` will be set to true,
it verifies that `job_boolean_true` or `job_boolean_false` must be mentioned in the expanded prompt.

Here are all checks that `validateEntry` needs to do:
- `entry.models.driving`:
  - Should exist.
- `entry.grid[rowIndex].jobs[columnIndex].jobName`:
  - Must be in keys of `entry.jobs`.
- `entry.tasks[name].model.category`;
  - Must be in fields of `entry.models`.
- `entry.tasks[name].requireUserInput`:
  - If it is true, its evaluated `prompt` should use `$user-input`, otherwise should not use.
- `entry.tasks[name].availability.previousJobKeywords[index]`:
  - Must be in any `entry.grid[index].keyword`.
- `entry.tasks[name].availability.previousTasks[index]`:
  - Must be in keys of `entry.tasks`.
- `entry.tasks[name].criteria.toolExecuted[index]`:
  - Must be in `availableTools`.
- Any `TaskWork` in `entry.jobs[name]`, needs to inspect recursively:
  - `TaskWork.taskId` must be in `entry.tasks`.
  - `TaskWork.modelOverride.category` must be in fields of `entry.models`.
  - `TaskWork.modelOverride` must be defined if that task has no specified model.
- Any `SequencialWork` and `ParallelWork`:
  - `works` should have at least one element.
- `entry.jobs[name].requireUserInput`.
  - Find out if a job requires user input by inspecting all `Task` record referenced by any `TaskWork` in this job.
  - If any task `requireUserInput`, then the job `requireUserInput`, otherwise the job does not `requireUserInput`.
  - If `Job.requireUserInput` is defined, it should reflect the correct value.
  - If `requireUserInput` is undefined, fill it.
  - After `validateEntry` finishes, all `Job.requireUserInput` should be filled.
- `entry.jobs[name].work`:
  - Simplies the `work` tree:
    - Expand nested `SequencialWork`, that a `SequencialWork` directly in another `SequencialWork` should be flattened. They could be multiple level.
    - Expand nested `ParallelWork`, that a `ParallelWork` directly in another `ParallelWork` should be flattened. They could be multiple level.

If any validation runs directly in this function fails:
- The error code path will be `codePath` appended by the javascript expression without any variable.
  - For example, if `entry.tasks[name].model` fails with task `scrum-problem-task`, the error code path becomes `${codePath}entry.tasks["scrum-problem-task"].model`.
- It must throws an error like "${errorCodePath}: REASON".
- The functions must also use the error code path for any `Prompt` expression to call `expandPromptStatic`.

## Running Tasks

**Referenced by**:
- API.md: `### sendPromptWithCrashRetry`
- JobsData.md: `### TaskWork`

A task is represented by type `Task`.

If any session crashes after the task submitting a promot to the session:
- resend the prompt until 3 consecutive crashes.
- Add `SESSION_CRASH_PREFIX` (exported const from `jobsApi.ts`: `"The session crashed, please redo and here is the last request:\n"`) before the prompt when resend.
- The crash retry logic is implemented in a shared `sendPromptWithCrashRetry` function in `jobsApi.ts`, used by both task execution and condition evaluation.

If resending promot can't solve crashing:
- The task stops immediately and marked failed.
- The exception cannot be consumed silently.

There will be two options to run the task:
- The driving session and the task session is the same session.
- Double model option: The driving session uses `Entry.models.driving`. The task session uses the task model.
- Task model: `Entry.models[Task.model]` will be used. When `Task.model` does not exist, the model id should be assigned

Both driving session and task session shares the same runtime variables.
Names of runtime variables are defined in `runtimeVariables`.

Before sending any prompt to the driving or task session,
`expandPromptDynamic` will be called to apply runtime variables.
This function must be called every time a prompt is sent to the session,
because runtime variables could change.

### Tools and Runtime Variables

**Referenced by**:
- JobsData.md: `### expandPromptDynamic`, `### Task.availability`, `### Task.criteria`, `### validateEntry`

`$user-input` will be passed from the user directly.
`$task-model` will be the model name selected to run the task session. It is not the category, it is the actual model name.

The following tools could be called in the driving or task session.
- When `job_prepare_document` is called, its argument becomes `$reported-document`. If there is multiple line, only keep the first line and trim and space characters before and after it.
- When the `job_boolean_true` tool is called, the condition satisfies.
  - The argument will be assigned to the `$reported-true-reason` runtime variable.
  - `$reported-false-reason` will be deleted.
- When the `job_boolean_false` tool is called, the condition fails.
  - The argument will be assigned to the `$reported-false-reason` runtime variable.
  - `$reported-true-reason` will be deleted.

### Determine the Model Option

**Referenced by**:
- JobsData.md: `### TaskWork`

Single model option will be enabled when one of the following conditions satisfies:
- `Task.criteria.runConditionInSameSession` is undefined or it is true.
- Single model option is explicitly required.

### Task.availability

**Referenced by**:
- JobsData.md: `### TaskWork`, `### validateEntry`
- API.md: `### copilot/task/start/{task-name}/session/{session-id}`

If `Task.availability` is not defined,
there will be no prerequisite checking,
the task just run.

All conditions must satisfy at the same time to run the task:
- When `Task.availability.previousJobKeywords` is defined, the previous job's keyword must be in the list.
- When `Task.availability.previousTasks` is defined, the previous task's name must be in the list.
- When `Task.availability.condition` is defined, the condition must satisfy.
  - The driving session will run the prompt.
  - The condition satisfies when the `job_boolean_true` is called in this round of driving session response.

otherwise the `job_prerequisite_failed` tool will be called in the driving session,
indicating the task fails.

### Task.criteria

**Referenced by**:
- JobsData.md: `### TaskWork`, `### validateEntry`
- API.md: `### copilot/task/start/{task-name}/session/{session-id}`

If `Task.criteria` is not defined,
there will be no criteria checking,
the task is treat as succeeded.

All conditions must be satisfy to indicate that the task succeeded:
- When `Task.criteria.toolExecuted` is defined, all tools in the list should have been executed in the last round of task session response.
- When `Task.criteria.condition` is defined:
  - The driving session will run the prompt.
  - The condition satisfies when the `job_boolean_true` is called in this round of driving session response.

If `Task.criteria.condition` and `Task.criteria.runConditionInSameSession` both defined,
the driving session should react to `runConditionInSameSession` when task execution does not satisfy the condition:
- The first element is `RetryWithNewSession`:
  - Retry at most "the second element" times. Each time a new task session should be used. DO NOT reuse the previous task session.
  - If all task executions did not satisfy the condition, the task failed.
- The first element is `RetryWithUserPrompt`:
  - Retry at most "the second element" times. ALWAYS reuse the previous task session.
  - Send the prompt described by the third element to the task session, the task session should react to the prompt and retry.

### Calling ICopilotTaskCallback.taskDecision

In above sessions there are a lot of thing happenes in the driving session. A reason should be provided to `taskDecision`, including but not limited to:
- The availability test passed.
- The availability test failed with details.
- The criteria toolExecuted check failed with details (specific tools not called).
- The criteria condition test passed.
- The criteria condition test failed with details.
- Starting a retry (RetryWithNewSession or RetryWithUserPrompt) with retry number.
- Retry budget drained because of availability or criteria failure.
- Retry budget drained because of crashing.
  - These two budgets are separated: crash retries are per-call (3 max in `sendPromptWithCrashRetry`), criteria retries are per failure action loop. A crash exhausting its per-call budget during a criteria retry loop is treated as a failed iteration rather than killing the task.
- Any error generated in the copilot session.
- A final decision about the task succeeded or failed.

## Running Jobs

**Referenced by**:
- API.md: `### sendPromptWithCrashRetry`

A `Job` is workflow of multiple `Task`. If its work fails, the job fails.

### Work

**Referenced by**:
- JobsData.md: `### TaskWork`, `### Determine TaskWork.workId`
- API.md: `### copilot/job/start/{job-name}`

- `TaskWork`: run the task, if `modelOverride` is defined that model is used.
  - If `category` is defined, the model id is `entry.models[category]`.
  - Otherwise `id` is the model id.
- `SequentialWork`, run each work sequentially, any failing work immediately fails the `SequentialWork` without continuation.
  - Empty `works` makes `SequentialWork` succeeds.
- `ParallelWork`, run all works parallelly, any failing work fails the `ParallelWork`, but it needs to wait until all works finishes.
  - Empty `works` makes `ParallelWork` succeeds.
- `LoopWork`:
  - Before running `body`, if `preCondition` succeeds (first element is true) or fails (first element is false), run `body`, otherwise `LoopWork` finishes as succeeded.
  - After running `body`, if `postCondition` succeeds (first element is true) or fails (first element is false), redo `LoopWork`, otherwise `LoopWork` finishes as succeeded.
  - If `body` fails, `LoopWork` finishes and fail.
- `AltWork`:
  - If `condition` succeeds, choose `trueWork`, otherwise choose `falseWork`.
  - If the chosen work is undefined, `AltWork` finishes as succeeded.
  - If the chosen work succeeds, `AltWork` finishes as succeeded.

**TEST-NOTE-BEGIN**
Need individual test cases for each type of `Work` in `work.test.mjs`, verifying details of each statement in the above bullet-point.
Such test case could be implemented by making up a job and calls `api/copilot/job/start/{job-name}` to start a work.
You can firstly obtain the updated work by calling `api/copilot/job`, find your target job, `workIdForJob` should have been attached to each `TaskWork`.
By calling the `api/copilot/job/{job-id}/live` api, you are able to see the starting and ending order of each `TaskWork`, by their own `workIdForJob`.

With such information, you can verify:
- If the job succeeded or failed as expected.
- If each `TaskWork` actually triggered in the expected order or logic.
  - For `AltWork`, only one of `trueWork` or `falseWork` triggers.
  - For `ParallelWork`, all `works` should trigger but the order may vary.
- Any task could fail, assert its side effect on the control flow.
  - For example, if `AltWork.condition` succeeds but a defined `trueWork` does not happen, there should be problems.
  - You need to check all possible equivalence classes of execution paths according to the control flow.

More details for api and additional test notes could be found in `API.md`.
**TEST-NOTE-END**

### TaskWork

**Referenced by**:
- JobsData.md: `### Determine TaskWork.workId`

When a task is executed by a `TaskWork`, it is in double session model.
The job has to start all sessions.
`TaskWork` fails if the last retry:
- Does not pass `Task.availability` checking. Undefined means successful.
- Does not pass `Task.criteria` checking. Undefined means successful.

### Determine TaskWork.workId

**Referenced by**:
- API.md: `### copilot/job`

Any `TaskWork` must have an unique `workIdInJob` in a Job.
The `assignWorkId` function converts a `Work<never>` to `Work<number>` with property `workIdInJob` assigned.
When creating a `Work` AST, you can create one in `Work<never>` without worrying about `workIdInJob`, and call `assignWorkId` to fix that for you.

### Exception Handling

**Referenced by**:
- API.md: `### sendPromptWithCrashRetry`

If any task crashes:
- The job stops immediately and marked failed.
- The exception cannot be consumed silently.
