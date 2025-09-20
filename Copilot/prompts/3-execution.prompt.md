# Execution

## Goal and Constraints

- Your goal is to finish an execution document in `Copilot_Execution.md` according to `Copilot_Task.md` and `Copilot_Planning.md`.
- You are also going to apply changes on the source code as well following `Copilot_Execution.md`.

## Copilot_Planning.md Structure

- `# !!!EXECUTION!!!`: This file always begin with this title.
- `# UPDATES`: An exact copy of the problem description I gave you.
  - `## UPDATE`: There could be multiple occurrences. Each one has an exact copy of the update description I gave you.
- `# IMPROVEMENT PLAN`.
- `# TEST PLAN`.

## Step 1. Identify the Problem

- The design document is in `Copilot_Task.md`, the planning document is in `Copilot_Planning.md`.
- Find `# Update` in the LATEST chat message. Ignore any `# Update` in the chat history.
- If there is an `# Update` section: it means I am going to propose some change to `Copilot_Execution.md` and the source code together.
  - Copy precisely my problem description in `# Update` from the LATEST chat message to the `# UPDATES` section, with a new sub-section `## UPDATE`.
  - Follow my update to change the execution document and the source code.
- If there is nothing:
  - If `Copilot_Execution.md` only has a title, you are on a fresh start.
  - If there is a `# !!!FINISHED!!!` mark in `Copilot_Execution.md`, it means you are accidentally stopped while changing the source code. Please continue your work.
  - If there is no `# !!!FINISHED!!!` mark in `Copilot_Execution.md`, it means you are accidentally stopped while finishing the document. Please continue your work.

## Step 2. Finish the Document

- Your need to summary code change in `Copilot_Execution.md`.
- All changes you need to made is already in `Copilot_Planning.md`, but it contains many explanations.
- Read `Copilot_Planning.md`, copy the following parts to `Copilot_Execution.md`:
  - `# IMPROVEMENT PLAN`
    - Only include actual code changes. Do not include any explanations or comments around them.
  - `# TEST PLAN`
    - Only include actual code changes. Do not include any explanations or comments around them.
- Do not copy `# UPDATES` from `Copilot_Planning.md` to `Copilot_Execution.md`. The `# UPDATES` in `Copilot_Execution.md` is for update requests for `Copilot_Execution.md` and the actual source code.

## Step 3. Mark the Completion

- Ensure there is a `# !!!FINISHED!!!` mark at the end of `Copilot_Execution.md` to indicate the document reaches the end.

## Step 4. Finish the Source Code

- Apply all instructions in `Copilot_Execution.md` to the source code.

## Step 5. Make Sure the Code Compiles

- Compile the solution and fix all compile errors.
- You do not have to worry about running unit tests at the moment. Do not run unit tests, you are good if the code compiles.
