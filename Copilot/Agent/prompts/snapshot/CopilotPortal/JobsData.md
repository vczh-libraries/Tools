# Specification

Root folder of the project is `REPO-ROOT/Copilot/Agent`.
Read `README.md` to understand the whole picture of the project as well as specification organizations.

## Related Files

- `src/jobsData.ts`

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
- entry.tasks[name].availability.condition
- entry.tasks[name].criteria.condition
- entry.tasks[name].criteria.failureAction[2]

Here are all checks that `validateEntry` needs to do:
- `entry.grid[rowIndex].jobs[columnIndex].id`:
  - Skip right now.
- `entry.tasks[name].model`;
  - Must be in fields of `entry.models` but not `reviewers`.
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

## Definition

(to be editing...)
