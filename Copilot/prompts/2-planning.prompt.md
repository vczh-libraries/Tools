# Planning

## Goal and Constraints

- Your goal is to finish a planning document in `Copilot_Planning.md` to address a problem from `Copilot_Task.md`.
- You are only allowed to update `Copilot_Planning.md`.
- You are not allowed to modify any other files.

## Step 1. Identify the Problem

- The design document is in `Copilot_Task.md`. You must carefully read through the file, it has the goal, the whole idea as well as analysis. If `Copilot_Task.md` mentions anything about updating the knowledge base, ignore it.
- Find `# Update` in the LATEST chat message. Ignore any `# Update` in the chat history.
- If there is an `# Update` section: it means I am going to propose some change to `Copilot_Planning.md`.
  - You should continue to work out more details.
  - Copy precisely my problem description in `# Update` from the LATEST chat message to the `# UPDATES` section, with a new sub-section `## UPDATE`.
  - Follow my update to change the planning document.
- If there is nothing:
  - If `Copilot_Planning.md` only has a title, you are on a fresh start.
  - Otherwise, it means you are accidentally stopped. Please continue your work.
    - Read `Copilot_Planning.md` througly, it is highly possibly that you were working on the request described in the last section in `# UPDATES`.

## Step 2. Understand the Goal and Quality Requirement

- You need to write complete two main sections in `Copilot_Planning.md`, `Improvement Plan` and `Test Plan`.
- **Improvement Plan**: as an experienced C++ developer for large scale systems, you need to:
  - Read through and understand the task in `Copilot_Task.md`.
  - C++ source files depends on each other, by just implementing the task it may not enough. Find out what will be affected.
  - Propose any code change you would like to do. It must be detailed enough to say which part of code will be replaced with what new code.
  - Explain why you want to make these changes.
  - When offering comments for code changes, do not just repeat what has been done, say why this has to be done.
    - If the code is simple and obvious, no comment is needed. Actually most of the code should not have comments.
    - Do not say something like `i++; // add one to i`, which offers no extra information. Usually no comments should be offered for such code, except there is any hidden or deep reason.
- **Test Plan**: as an experienced C++ developer for large scale systems, you need to:
  - Design test cases that cover all aspects of the changes made in the Improvement Plan.
  - Ensure test cases are clear enough to be easily understood and maintained.
  - Carefully think about corner cases to cover.
  - For refactoring work, existing test cases might have already most of the scenarios. Carefully review them and only add new test cases if necessary.
  - If you think any current test case must be updated or improved, explain why.

## Step 3. Finish the Document

- Your goal is to write a design document to `Copilot_Planning.md`. DO NOT update any other file including source code.
- When mentioned any C++ type name, you must use its full name followed by the file which has its definition.
- Append everything to `Copilot_Planning.md`.
- Make sure only code references are in code blocks. Do not emit code blocks for markdown.

## Step 5. Mark the Completion

- Ensure there is a `# !!!FINISHED!!!` mark at the end of `Copilot_Planning.md` to indicate the document reaches the end.
