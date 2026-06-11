You are going to sync context for coding agents across different repos.
If `git push` is blocked because of needing to merge, you are allowed to rebase by yourself:
  - Always rebase to the latest change of the remote branch, instead of making a rebase commit.
  - This is a pure document maintenance job so no testing is needed.
**IMPORTANT** If you are instructed to "skip learning", you should start from `## Sync Back Knowledge Base and Instructions`.

## Preparing

- Run `Tools/Tools/CheckRepo.ps1 CheckAll` to find how if there are any uncommitte local changes in any repo, commit but no need to push.
- Run `Tools/Tools/CheckRepo.ps1 SyncAll` to pull the latest changes from remotes, pay attention to pull failure, which means you need to resolve conflicts manually.
- Resolve all conflicts.
  - No need to run tests as this job is pure document maintenance.
  - No need to push as they will be covered in the subsequent steps.
  - Even when there are code conflicts, just merge them by your best judgment, no testing is required, but you need to warn at the end of the process.

## Understanding Learning

Read the `# Orders` section in `Learning.md` of the knowledge base, remember it in a temporary file or by any means that is more convenient for you. `orders copy` below refers to this.
In `Learning.md`, each section is an item of knowledge, and all knowledge items have their titles written in `# Orders`. You will see there are scores after each item in `# Orders`. Scores mean the importance of the item, and they should always be in descending order.

## Order of Processing Repos

The order of processing repos is important, because there are dependencies between repos:
- Vlpp
- VlppOS
- VlppRegex
- VlppReflection
- VlppParser2
- Workflow
- GacUI

## Consume Unlearned Materials

Run `REPO-ROOT/.github/Scripts/copilotRemember.ps1` in the repos listed in `Order of Processing Repos`:
- This script picks up documents that are not archived and turn them into learning materials.
Run `REPO-ROOT/.github/prompts/refine.prompt.md` in the repos listed in `Order of Processing Repos`:
- You should keep executing the `refine.prompt.md` until all folders in `REPO-ROOT/.github/Learning` are processed.
- If there are any empty folders in `REPO-ROOT/.github/Learning`, just delete them.
`REPO-ROOT` means each repo to process. Be aware that instructions in different repos might be in different versions; follow each instruction file separately.
- After finishing processing one repo, commit and push changes before moving to the next repo.

## Merge Knowledge Base

This step uploads any new documents created from each repo.

Run `Tools\Copilot\copilotInit.ps1 -UpdateKB` in the repos listed in `Order of Processing Repos`:
- `pwd` must be in each repo when running the script.
- After running the script in any repo, verify, fix and commit any change in the `Tools` repo, before moving to the next repo.
  - This is important because each repo might have different changes.
  - If you don't commit changes uploaded from one repo, the next one will override those changes, and you will lose documents.
  - By committing after running the script in each repo, you need to verify changes in `Tools` repo immediately:
    - In `Index.md` of the knowledge base:
      - If a whole section is deleted, it means the current repo doesn't know new sections coming from some previous repos, you have to restore the deletion.
    - In `Learning.md` of the knowledge base:
      - If a whole section is deleted, it means the current repo doesn't know new sections coming from some previous repos, you have to restore the deletion.
      - If scores of some sections are changed, you need to pull out 3 versions of a score for each section:
        - One in the `orders copy`, called `scoreA`.
        - One in the `Learning.md` before current change, called `scoreB`.
        - One in the `Learning.md` after current change, called `scoreC`.
        - The new score will be `scoreB` + `scoreC` - `scoreA`, which means changing of a score to the same item from multiple scores sould be added together. This is a simple three-way merging of scores.
      - Reorder items in `# Orders` in descending order of scores.
        - Make sure all items in `Learning.md` are in the `# Orders` section, and all items in the `# Orders` section are in `Learning.md`. Otherwise, you have messed up the file.
    - Any detail documents are supposed to be owned by only one repo so there should be no conflict, but if there is any, you need to carefully merge them.
- Push `Tools` repo to the current branch (should be `master`).
  - If there is any conflict while pushing, merge by yourself. Instructions, documents and scripts are relatively simple, make your own judgment.
  - If `Index.md` or `Learning.md` of the knowledge base has a conflict, follow the same rule as above.

## Sync Back Knowledge Base and Instructions

Run `Tools\Copilot\copilotInitAll.ps1` followed by `Tools\Tools\CheckRepo.ps1 CheckAll`, and you will find many other repos are also updated. Run `git commit` and push all changes in affected repos.

## Report

Report how many repos:
- Updated learnings.
- Have new learnings comparing to `Tools`.
- git pushed.
