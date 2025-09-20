# Execution

## Goal and Constraints

- Your goal is to finish an execution document in `Copilot_Execution.md` according to `Copilot_Task.md` and `Copilot_Planning.md`.
- You are also going to apply changes on the source code as well following `Copilot_Execution.md`.

## Copilot_Planning.md Structure

- `# !!!EXECUTION!!!`: This file always begin with this title.
- `# UPDATES`: An exact copy of the problem description I gave you.
  - `## UPDATE`: There could be multiple occurrences. Each one has an exact copy of the update description I gave you.
- `# CODE CHANGES`.
  - `## STEP X: The Step Title`: Copied from `Copilot_Planning.md`, only include code changes, do not copy explanations.
  - It must include both code changes in improvement plan and test plan from `Copilot_Planning.md`.
  - Code changes in test plan do not have a step title and step number, just continue with the numeber and add new `## STEP X` in `Copilot_Execution.md`.

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
- Read `Copilot_Planning.md`, copy only code changes to `Copilot_Execution.md`, including which part of code will be replaced with what new code.
- Code changes in both `Improvement Plan` and `Test Plan` will need to be included. Organize them as steps in `# CODE CHANGES` in `Copilot_Execution.md`.
- Do not include any explanations or comments around the code change, please only include the code changes.

## Step 3. Mark the Completion

- Ensure there is a `# !!!FINISHED!!!` mark at the end of `Copilot_Execution.md` to indicate the document reaches the end.

## Step 4. Finish the Source Code

- Apply all instructions in `Copilot_Execution.md` to the source code.

## Step 5. Make Sure the Code Compiles

- Compile the solution and fix all compile errors.
- You do not have to worry about running unit tests at the moment. Do not run unit tests, you are good if the code compiles.
