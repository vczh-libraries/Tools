# Execution

## Goal and Constraints

- You are going to apply changes on the source code as well following `Copilot_Execution.md`.

## Step 1. Identify the Problem

- The execution document is in `Copilot_Execution.md`
- Find `# Update` in the LATEST chat message. Ignore any `# Update` in the chat history.
- If there is an `# Update` section: it means I am going to propose some change to `Copilot_Execution.md` and the source code together.
  - Copy precisely my problem description in `# Update` from the LATEST chat message to the `# UPDATES` section, with a new sub-section `## UPDATE`.
  - Follow my update to change the execution document and the source code.
- If there is nothing:
  - Apply all code changes in `Copilot_Execution.md` to the source code.
  - After applying each step in `Copilot_Execution.md`, mark the step as completed by appending `[DONE]` after the step title. This allow you to find where you are if you are interrupted.

## Step 2. Make Sure the Code Compiles but DO NOT Run Unit Test

- Check out `Compile the Solution` for details about compiling the solution but DO NOT run unit test. If there is any compilation warning or error, address all of them:
  - If there is any compile warning, only fix warnings that caused by your code change. Do no fix any other warnings.
  - If there is any compile error, you need to carefully identify, is the issue in the callee side or the caller side. Check out similar code before making a decision.
  - For every attempt of fixing the source code:
    - Explain why the original change did not work.
    - Explain what you need to do.
    - Explain why you think it would solve the build break.
    - Log these in `Copilot_Execution.md`, with section `## Fixing attempt No.<attempt_number>` in `# FIXING ATTEMPTS`.
  - Redo `Step 2. Make Sure the Code Compiles but DO NOT Run Unit Test`.
- When the code compiles:
  - DO NOT run any tests, the code will be verified in future tasks.
