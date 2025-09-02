# Design

## Goal and Constraints

- Your goal is to finish a design document in `Copilot_Task.md` to address a problem.
- You are only allowed to update `Copilot_Task.md` and add `[PROCESSED]` mark in `Copilot_Scrum.md`.
- You are not allowed to modify any other files.

## Step 1. Identify the Problem

- The problem I would like to solve is in the chat messages sending with this request.
- Find `# Problem` or `# Update` in the LATEST chat message. Ignore any `# Problem` or `# Update` in the chat history.
- If there is a `# Problem` section: it means you are on a fresh start.
  - Make sure the current working directory is set to the folder containing the solution file, which I believe is the default location.
  - You must execute `.\copilotPrepare.ps1` to clean up everything from the last run.
  - You must execute `.\copilotPrepare.ps1`, must not be `copilotPrepare.ps1`, as PowerShell refuses to run a script file if there is only a simple file name.
  - After executing, copy precisely my problem description in `# Problem` from the LATEST chat message under a `# PROBLEM DESCRIPTION`.
    - If the problem description is like `Complete task a-b`:
      - `a` and `b` are numbers, they locates the specific task in `Copilot_Scrum.md`.
      - Append `[PROCESSED]` to the title of the specific task in `Copilot_Scrum.md`. Only append it after the task, not the phrase.
- If there is an `# Update` section: it means I am going to propose some change to `Copilot_Task.md`.
  - You should continue to work out more details.
  - Copy precisely my problem description in `# Update` from the LATEST chat message to the `# PROBLEM DESCRIPTION` section, with a new sub-section `## UPDATE`.
  - Follow my update to change the design document.
- If there is nothing: it means you are accidentally stopped. Please continue your work.
  - Read `Copilot_Task.md` througly, it is highly possibly that you were working on the request described in the last section in `# PROBLEM DESCRIPTION`.

## Step 2. Understand the Goal and Quality Requirement

- As an experienced C++ developer for large scale systems, you need to:
  - Analyse the source code and provide a high-level design document.
  - The design document must present your idea, about how to solve the problem in architecture-wide level.
  - The design document must describe the what to change, keep the description in high-level without digging into details about how to update the source code.
  - The design document must explain the reason behind the proposed changes.
  - It is completely OK and even encouraged to have multiple solutions. You must explain each solution in a way mentioned above, and provide a comparison of their pros and cons.

## Step 3. Finish the Document

- Your goal is to write a design document to `Copilot_Task.md`. DO NOT update any other file including source code.
- When mentioned any C++ type name, you must use its full name followed by the file which has its definition.
- Append everything to `Copilot_Task.md`.
- Make sure only code references are in code blocks. Do not emit code blocks for markdown.

## Step 4. Mark the Completion

- Ensure there is a `# !!!FINISHED!!!` mark at the end of `Copilot_Task.md` to indicate the document reaches the end.
