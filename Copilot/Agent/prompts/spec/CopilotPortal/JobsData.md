# Specification

Root folder of the project is `REPO-ROOT/Copilot/Agent`.
Read `README.md` to understand the whole picture of the project as well as specification organizations.

## Related Files

- `src/jobsData.ts`
- `src/jobsApi.ts`

## Functions

### expandPromptStatic

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

It works like `expandPromptStatic`, but assert `prompt` has exactly one item.
Look up all `runtimeVariables` in `values` argument.
Be aware of that, not all variable has an value assigned.
When it fails to look up the value, report an error.

### validateEntry

Perform all verifications, verify and update all prompts with `expandPromptStatic`:
- entry.tasks[name].prompt
- entry.tasks[name].availability.condition (run extra verification)
- entry.tasks[name].criteria.condition (run extra verification)
- entry.tasks[name].criteria.failureAction[2]

When extra verification is needed,
`expandPromptStatic`'s `requiresBooleanTool` will be set to true,
it verifies that `job_boolean_true` or `job_boolean_false` must be mentioned in the expanded prompt.

Here are all checks that `validateEntry` needs to do:
- `entry.grid[rowIndex].jobs[columnIndex].id`:
  - Skip right now.
- `entry.tasks[name].model`;
  - Must be in fields of `entry.models` but not `reviewers`.
- `entry.tasks[name].requireUserInput`:
  - If it is true, its evaluated `prompt` should use `$user-input`, otherwise should not use.
- `entry.tasks[name].availability.previousJobKeywords[index]`:
  - Must be in any `entry.grid[index].keyword`.
- `entry.tasks[name].availability.previousTasks[index]`:
  - Must be in keys of `entry.tasks`.
- `entry.tasks[name].criteria.toolExecuted[index]`:
  - Must be in `availableTools`.

If any validation runs directly in this function fails:
- The error code path will be `codePath` appended by the javascript expression without any variable.
  - For example, if `entry.tasks[name].model` fails with task `scrum-problem-task`, the error code path becomes `${codePath}entry.tasks["scrum-problem-task"].model`.
- It must throws an error like "${errorCodePath}: REASON".
- The functions must also use the error code path for any `Prompt` expression to call `expandPromptStatic`.

## Running Tasks

A task is represented by type `Task`.

If any session crashes, the task stops immediately and marked failed.

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

`$user-input` will be passed from the user directly.
**TASK**: Check if tools are registered during createSession. Register them if not.
**TASK**: In `jobsData.test.mjs` there is some `// We need to call validateEntry, but it's not exported`. The function has already exported, fix them if necessary.

The following tools could be called in the driving or task session.
- When `job_prepare_document` is called, its argument becomes `$reported-document`. If there is multiple line, only keep the first line and trim and space characters before and after it.
- When the `job_boolean_true` tool is called, the condition satisfies.
  - The argument will be assigned to the `$reported-true-reason` runtime variable.
  - `$reported-false-reason` will be deleted.
- When the `job_boolean_false` tool is called, the condition fails.
  - The argument will be assigned to the `$reported-false-reason` runtime variable.
  - `$reported-true-reason` will be deleted.

### Determine the Model Option

Single model option will be enabled when one of the following conditions satisfies:
- `Task.criteria.runConditionInSameSession` is undefined or it is true.
- Single model option is explicitly required.

### Task.availability

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

## Running Jobs

(to be editing ...)
