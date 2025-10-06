# Planning

- Checkout `Accessing Log Files and PowerShell Scripts` for context about mentioned `*.md` and `*.ps1` files.
  - All `*.md` and `*.ps1` files should already be existing, you should not create any new files.

## Goal and Constraints

- Your goal is to finish a planning document in `Copilot_Planning.md` to address a problem from `Copilot_Task.md`.
- You are only allowed to update `Copilot_Planning.md`.
- You are not allowed to modify any other files.
- Anything in the instruction is a guidance to complete `Copilot_Planning.md`.
- DO NOT modify any source code.

## Copilot_Planning.md Structure

- `# !!!PLANNING!!!`: This file always begin with this title.
- `# UPDATES`:
  - `## UPDATE`: There could be multiple occurrences. Each one has an exact copy of the update description I gave you.
- `# IMPROVEMENT PLAN`.
  - `## STEP X: The Step Title`: One step in the improvement plan.
    - A clear description of what to change in the source code.
    - A clear explanation of why this change is necessary.
- `# TEST PLAN`.

## Step 1. Identify the Problem

- The design document is in `Copilot_Task.md`. You must carefully read through the file, it has the goal, the whole idea as well as analysis. If `Copilot_Task.md` mentions anything about updating the knowledge base, ignore it.
- Find `# Update` in the LATEST chat message. Ignore any `# Update` in the chat history.
- If there is an `# Update` section: it means I am going to propose some change to `Copilot_Planning.md`.
  - Copy precisely my problem description in `# Update` from the LATEST chat message to the `# UPDATES` section, with a new sub-section `## UPDATE`.
  - Follow my update to change the planning document.
- If there is nothing:
  - If `Copilot_Planning.md` only has a title, you are on a fresh start.
  - Otherwise, it means you are accidentally stopped. Please continue your work.
    - Read `Copilot_Planning.md` througly, it is highly possibly that you were working on the request described in the last section in `# UPDATES`.

## Step 2. Understand the Goal and Quality Requirement

- You need to write complete two main sections in `Copilot_Planning.md`, an improvement plan and a test plan.
- **Improvement Plan**:
  - Read through and understand the task in `Copilot_Task.md`.
  - C++ source files depends on each other, by just implementing the task it may not enough. Find out what will be affected.
  - Propose any code change you would like to do. It must be detailed enough to say which part of code will be replaced with what new code.
  - Explain why you want to make these changes.
  - When offering comments for code changes, do not just repeat what has been done, say why this has to be done.
    - If the code is simple and obvious, no comment is needed. Actually most of the code should not have comments.
    - Do not say something like `i++; // add one to i`, which offers no extra information. Usually no comments should be offered for such code, except there is any hidden or deep reason.
- **Test Plan**:
  - Design test cases that cover all aspects of the changes made in the improvement plan.
  - Ensure test cases are clear enough to be easily understood and maintained.
  - Carefully think about corner cases to cover.
  - For refactoring work, existing test cases might have already covered most of the scenarios. Carefully review them and only add new test cases if necessary.
  - If you think any current test case must be updated or improved, explain why.

## Step 3. Finish the Document

- Your goal is to write a design document to `Copilot_Planning.md`. DO NOT update any other file including source code.
- The code change proposed in the improvement plan must contain actual code. I need to review them before going to the next phrase.
- DO NOT copy `# UPDATES` from `Copilot_Task.md` to `Copilot_Planning.md`.

## Step 4. Mark the Completion

- Ensure there is a `# !!!FINISHED!!!` mark at the end of `Copilot_Planning.md` to indicate the document reaches the end.
