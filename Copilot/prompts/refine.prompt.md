# Refine

- Check out `Accessing Script Files` for context about mentioned `*.ps1` files.
- All `*.md` and `*.ps1` files should exist; you should not create any new files unless explicitly instructed.
- Following `Leveraging the Knowledge Base` in `REPO-ROOT/.github/copilot-instructions.md`, find knowledge and documents for this project in `REPO-ROOT/.github/KnowledgeBase/Index.md`.

## Goal and Constraints

- Your goal is to extract learnings from completed task logs and write them to learning files.
- The `KnowledgeBase` and `Learning` folders mentioned in this document are in `REPO-ROOT/.github/`.
- You are not allowed to modify any source code.
- Write learnings to these files, including not only best practices but the user's preferences:
  - `KnowledgeBase/Learning.md`: Learnings that apply across projects, including C++, library usage, and general best practices.
  - `Learning/Learning_Coding.md`: Learnings specific to this project's source code.
  - `Learning/Learning_Testing.md`: Learnings specific to this project's test code.
- Put learnings in `Learning/` instead of `KnowledgeBase/` when the knowledge is specific to this project.

## Document Structure (Learning.md, Learning_Coding.md, Learning_Testing.md)

- `# !!!LEARNING!!!`: This file always begins with this title.
- `# Orders`: Bullet points of each learnings and its counter in this format `- TITLE [COUNTER]`.
- `# Refinements`:
  - `## Title`: Learning and its actual content.

## Step 1. Find the Earliest Backup Folder

- Find and execute `copilotPrepare.ps1 -Earliest` to get the absolute path to the earliest backup folder in `Learning`.
- If no folder is found, stops.

## Step 2. Read All Documents

- Read all files in the earliest backup folder. These may include:
  - `Copilot_Task.md`
  - `Copilot_Planning.md`
  - `Copilot_Execution.md`
  - `Copilot_Execution_Finding.md`

## Step 3. Extract Findings

- Focus on the following sections across all documents:
  - All `## UPDATE` sections in each document.
  - `# Comparing to User Edit` from `Copilot_Execution_Finding.md`.
- From these sections, identify learnings about:
  - Best practices and coding preferences.
  - Mistakes made and corrections applied.
  - Patterns the user prefers or dislikes.
  - Any insight into the user's philosophy about code quality, style, or approach.

## Step 4. Write Learnings

- Log whatever is found to the appropriate learning file.
- If any finding repeats an existing learning, increase its counter.
- If a finding is new, add it with counter `[1]`.
- Create the learning file if it does not exist.

### Learning File Format

Each learning file follows this structure:

- The first section is an index listing all learnings sorted by counter in descending order:
  ```
  - [N] Short title with key idea
  ```
- Each learning has its own section with the short title as the heading, containing the detailed description.
- The title must be short and include the key idea.

## Step 5. Delete the Processed Folder

- After all learnings have been written, delete the earliest backup folder that was processed.
