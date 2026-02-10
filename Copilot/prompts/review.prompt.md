# Review

- Check out `Accessing Task Documents` for context about mentioned `*.md` files.
- Following `Leveraging the Knowledge Base` in `REPO-ROOT/.github/copilot-instructions.md`, find knowledge and documents for this project in `REPO-ROOT/.github/KnowledgeBase/Index.md`.

## Goal and Constraints

- Your goal is to review a document as one member of a 4-model review panel.
- The review panel consists of: `GPT 5.2`, `Opus 4.6`, `Grok`, `Gemini 3 Pro`.
- Each model writes its review to a separate file.
- You are only allowed to create or update your own review file (except during `Final Review`).
- Each round of review should consider learnings from `KnowledgeBase/Learning.md`, `Learning/Learning_Coding.md`, and `Learning/Learning_Testing.md` if they exist.

## Identify Yourself

- You are one of the 4 models in the review panel. Identify yourself:
  - If you are GPT, your file name is `GPT`.
  - If you are Claude (Opus), your file name is `Opus`.
  - If you are Grok, your file name is `Grok`.
  - If you are Gemini, your file name is `Gemini`.
- Use your file name in all file operations below.

## Step 1. Identify the Review Target

- Find the title in the LATEST chat message:
  - `# Scrum` → review `Copilot_Scrum.md`, focus only on unfinished tasks (those marked `[ ]`).
  - `# Design` → review `Copilot_Task.md`.
  - `# Plan` → review `Copilot_Planning.md`.
  - `# Execution` → review `Copilot_Execution.md`.
  - `# Final` → skip all remaining steps and go to the `Final Review` section.
- If there is nothing: it means you are accidentally stopped. Please continue your work.

## Step 2. Determine the Current Round Index

- Look for existing `Copilot_Review_*_*.md` files.
- If no review files exist, the current round index is `1`.
- Otherwise:
  - Starting from `1`, find the highest round number `N` where all 4 model files exist (`Copilot_Review_N_GPT.md`, `Copilot_Review_N_Opus.md`, `Copilot_Review_N_Grok.md`, `Copilot_Review_N_Gemini.md`).
  - If all 4 exist for round `N`, the current round index is `N + 1`.
  - If not all 4 exist for the highest found round, that is the current round index.
- If your file for the current round already exists, report that you have already completed this round and stop.

## Step 3. Read Context

- Read the target document identified in Step 1.
  - For `Copilot_Scrum.md`, focus only on unfinished tasks.
- If the current round index is greater than `1`, read all 4 review files from the previous round (round index - 1) to collect other models' opinions.
- Read learning files if they exist for additional context.

## Step 4. Write Your Review

- Create file: `Copilot_Review_{RoundIndex}_{YourFileName}.md`

### Review File Structure

The file must follow this structure:

```
# Review Target: {TargetDocumentName}

# Opinion

{Your summarized feedback and suggestions for the target document.}
```

When the current round is greater than `1`, append a `# Replies` section:

```
# Replies

## Reply to {ModelName1}

{Your response to their opinion, or AGREE if you fully agree and have nothing to add.}

## Reply to {ModelName2}

{Your response to their opinion, or AGREE if you fully agree and have nothing to add.}

## Reply to {ModelName3}

{Your response to their opinion, or AGREE if you fully agree and have nothing to add.}
```

- Only include reply sections for the other 3 models (not yourself).
- If you fully agree with a model's opinion and have nothing to add, write only `AGREE`.

## Final Review (only when `# Final` appears in the LATEST chat message)

Ignore this section if there is no `# Final` in the LATEST chat message.

### Step F1. Verify Convergence

- Find the latest round of review files.
- Check that in the latest round, every model's reply to every other model is `AGREE`.
- If not all replies are `AGREE`, report that the review has not converged and stop.

### Step F2. Identify the Target Document

- Read any review file to find `# Review Target` and identify which document was reviewed.

### Step F3. Create the Summary

- Read all review files across all rounds.
- Collect all unique ideas, feedback, and suggestions from all models across all rounds.
- Consolidate them into `Copilot_Review.md` as a cohesive set of actionable feedback.

### Step F4. Apply the Review

- Apply `Copilot_Review.md` to the target document as if it were a user comment:
  - Add a `## UPDATE` section in the `# UPDATES` section of the target document containing the consolidated review feedback.
  - Update the target document content according to the review feedback.

### Step F5. Clean Up

- Delete all `Copilot_Review*.md` files, including the round files and `Copilot_Review.md` itself.
