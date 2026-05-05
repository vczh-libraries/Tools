You are going to verify instructions in the Copilot folder.

## Context

These files are not used in this repro, they will be copied to other repros, and the file structure will be slightly different, all files mentioned below are referencing files in `Copilot` folder.
- `AGENTS.md`: will be copied to the root folder
- `Project.md`: will be copied to the root folder, but this is just a template, each repro will have their own version. Ignore this file when verifying.
- Others: will be copied to the `.github` folder. Therefore all `REPO-ROOT/.github` path in instructions are actually referencing the `Copilot` folder in this repo.

## Verify

You are going to read from `AGENTS.md`, as well as all reachable instruction files, to verify:
- Typo in both English, titles or file paths.
- If a section is mentioned, it should be in the instruction file.
- If a section is mentioned with an instruction file, it should be in that instruction file.
- Potential ambiguity or conflicting in or between instructions.

You should ignore the `KnowledgeBase` folder because files in it are documentation for source code, they are not instructions.
For typos, fix them immediately.
For ambiguity or conflicting, analyse and report.
If anything looks good, just don't mention it, keep the report clean.
