# Summarizing

- Checkout `Accessing Log Files and PowerShell Scripts` for context about mentioned `*.md` and `*.ps1` files.
  - All `*.md` and `*.ps1` files should already be existing, you should not create any new files.

## Goal and Constraints

- Your goal is to finish an execution document in `Copilot_Execution.md` according to `Copilot_Task.md` and `Copilot_Planning.md`.

## Copilot_Planning.md Structure

- `# !!!EXECUTION!!!`: This file always begin with this title.
- `# UPDATES`:
  - `## UPDATE`: There could be multiple occurrences. Each one has an exact copy of the update description I gave you.
- `# IMPROVEMENT PLAN`.
- `# TEST PLAN`.
- `# FIXING ATTEMPTS`.

## Step 1. Identify the Problem

- The design document is in `Copilot_Task.md`, the planning document is in `Copilot_Planning.md`.
- Find `# Update` in the LATEST chat message. Ignore any `# Update` in the chat history.
- If there is an `# Update` section: it means I am going to propose some change to `Copilot_Execution.md` and the source code together.
  - Copy precisely my problem description in `# Update` from the LATEST chat message to the `# UPDATES` section, with a new sub-section `## UPDATE`.
  - Follow my update to change the execution document.
- If there is nothing:
  - If `Copilot_Execution.md` only has a title, you are on a fresh start.
  - If there is a `# !!!FINISHED!!!` mark in `Copilot_Execution.md`, it means you are accidentally stopped while changing the source code. Please continue your work.
  - If there is no `# !!!FINISHED!!!` mark in `Copilot_Execution.md`, it means you are accidentally stopped while finishing the document. Please continue your work.

## Step 2. Finish the Document

- Your need to summary code change in `Copilot_Execution.md`.
- All changes you need to made is already in `Copilot_Planning.md`, but it contains many explanations.
- Read `Copilot_Planning.md`, copy the following parts to `Copilot_Execution.md`:
  - `# IMPROVEMENT PLAN`
    - Copy EVERY code block exactly as written
    - If Planning has 1000 lines of test code, Execution must have those same 1000 lines
    - Remove only the explanatory text between code blocks
    - Keep ALL actual code
  - `# TEST PLAN`
    - Copy EVERY code block exactly as written
    - If Planning has 1000 lines of test code, Execution must have those same 1000 lines
    - Remove only the explanatory text between code blocks
    - Keep ALL actual code
  - DO NOT copy `# UPDATES` from `Copilot_Planning.md` to `Copilot_Execution.md`. The `# UPDATES` in `Copilot_Execution.md` is for update requests for `Copilot_Execution.md` and the actual source code.

## Step 3. Document Quality Check List

- [ ] Can someone copy-paste ONLY from Execution.md and apply all changes? (No need to refer to Planning.md)
- [ ] Does every STEP show the complete code to write, not just describe it?
- [ ] Is there any phrase like "including:", "such as:", "etc.", "refer to"? (If yes, you did it wrong!)
- [ ] Count lines of code in Planning.md STEP X vs Execution.md STEP X - are they similar?

## Step 4. Completion
- Ensure there is a `# !!!FINISHED!!!` mark at the end of `Copilot_Execution.md` to indicate the document reaches the end.
