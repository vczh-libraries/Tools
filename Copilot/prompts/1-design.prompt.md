# Design

- Checkout `Accessing Log Files and PowerShell Scripts` for context about mentioned `*.md` and `*.ps1` files.
  - All `*.md` and `*.ps1` files should already be existing, you should not create any new files.

## Goal and Constraints

- Your goal is to finish a design document in `Copilot_Task.md` to address a problem.
- You are only allowed to update `Copilot_Task.md` and mark a task completed in `Copilot_Scrum.md`.
- You are not allowed to modify any other files.
- Anything in the instruction is a guidance to complete `Copilot_Task.md`.
- DO NOT modify any source code.

## Copilot_Task.md Structure

- `# !!!TASK!!!`: This file always begin with this title.
- `# PROBLEM DESCRIPTION`: An exact copy of the problem description I gave you.
- `# UPDATES`:
  - `## UPDATE`: There could be multiple occurrences. Each one has an exact copy of the update description I gave you.
- `# INSIGHTS AND REASONING`.

## Step 1. Identify the Problem

- The problem I would like to solve is in the chat messages sending with this request.
- Find `# Problem` or `# Update` in the LATEST chat message. Ignore any `# Problem` or `# Update` in the chat history.
- If there is a `# Problem` section: it means you are on a fresh start.
  - Find and execute `copilotPrepare.ps1` to clean up everything from the last run.
  - After `copilotPrepare.ps1` finishes, copy precisely my problem description in `# Problem` from the LATEST chat message under a `# PROBLEM DESCRIPTION`.
    - If the problem description is `Next`:
      - Find the first incomplete task in `Copilot_Scrum.md`, and follow the intruction below to process that task.
    - If the problem description is like `Complete task No.X`:
      - Locate the specific task in `Copilot_Scrum.md`.
      - There is a bullet list of all tasks at the beginning of `# TASKS`. Mark the specific task as being processed by changing `[ ]` to `[x]`.
      - Find the details of the specific task, copy everything in this task to `# PROBLEM DESCRIPTION`.
- If there is an `# Update` section: it means I am going to propose some change to `Copilot_Task.md`.
  - Copy precisely my problem description in `# Update` from the LATEST chat message to the `# PROBLEM DESCRIPTION` section, with a new sub-section `## UPDATE`.
  - Follow my update to change the design document.
- If there is nothing: it means you are accidentally stopped. Please continue your work.
  - Read `Copilot_Task.md` througly, it is highly possibly that you were working on the request described in the last section in `# PROBLEM DESCRIPTION`.

## Step 2. Understand the Goal and Quality Requirement

- Analyse the source code and provide a high-level design document.
- The design document must present your idea, about how to solve the problem in architecture-wide level.
- The design document must describe the what to change, keep the description in high-level without digging into details about how to update the source code.
- The design document must explain the reason behind the proposed changes.
- The design document must include any support evidences from source code or knowledge base.
- It is completely OK and even encouraged to have multiple solutions. You must explain each solution in a way mentioned above, and provide a comparison of their pros and cons.

## Step 3. Finish the Document

- Your goal is to write a design document to `Copilot_Task.md`. DO NOT update any other file including source code.
- Whatever you think or found, write it down in the `# INSIGHTS AND REASONING` section.

## Step 4. Mark the Completion

- Ensure there is a `# !!!FINISHED!!!` mark at the end of `Copilot_Task.md` to indicate the document reaches the end.
