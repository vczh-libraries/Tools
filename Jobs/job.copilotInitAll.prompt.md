You are going to sync context for coding agent across different repros.

## Understanding Learning

Read the `## Orders` section in `Learning.md` of knowledge base, remember it in a temporary file or by any mean that is more convenient for you. `orders copy` below refer to this.
In `Learning.md`, each section is an item of knowledge, and all knowledges have their titles written in `## Orders`. You will see there are scores after each items in `## Orders`. Scores means importance of the item, and they should always be in descending order.

## Order of Processing Repos

## Consume Unlearned Materials

Run `REPO-ROOT/.github/prompts/refine.prompt.md` in the follow repos following `Order of Processing Repos`:
- You should keep executing the `refine.prompt.md` until all folders in `REPO-ROOT/.github/Learning` are processed.
- If there is any empty folders in `REPO-ROOT/.github/Learning`, just delete them.
`REPO-ROOT` means each repo to process, be awared that instructions in different repros might be in different version, follow each instruction file separately.
- After finishing processing one repo, commit and push changes, before moving to the next repo.

## Merge Knowledge Base

This step uploads any new documents created from each repo.

Run `Tools\Copilot\copilotInit.ps1 --UpdateKB` in the follow repos following `Order of Processing Repos`:
- pwd must be in each repo when running the script.
- After running the script in any repo, verify, fix and commit any change in te `Tools` repo, before moving to the next repo.
  - This is important because each might have different changes.
  - If you don't commit changes uploaded from one repo, the next one will override those changes, and you will lose documents.
  - By committing after running the script in each repo, you need to verify changes in `Tools` repo immediately:
    - In `Index.md` of knowledge base:
      - If any whole section is deleted, it means the current repo doesn't know new sections comming from some previous repos, you have to restore the deletion.
    - In `Learning.md` of knowledge base:
      - If any whole section is deleted, it means the current repo doesn't know new sections comming from some previous repos, you have to restore the deletion.
      - If scores of some sections are changed, you need to know pull out 3 versions of a score for each section:
        - One in the `orders copy`, says `scoreA`.
        - One in the `Learning.md` before current change, says `scoreB`.
        - One in the `Learning.md` after current change, says `scoreC`.
        - The new score will be `scoreA` + (`scoreC` - `scoreB`), which means the change of score in current repo should be added to the original score in `orders copy`.
      - Reorder items in `## Orders` in descending order of scores.
        - Make sure and make sure all items in `Learning.md` are in `## Orders` section, and all items in `## Orders` section are in `Learning.md`. Otherwise you messed up the file.
    - Any details documents are supposed to be only owned by one repo so there should not be conflict, but if it is any, you need to carefully merge them.
- Push `Tools` repo to the current branch (should be `master`).
  - If there is any conflict during pushing, merge by yourself. Instructions, documents and scripts are relatively simple, make your own judgement.
  - If `Index.md` or `Learning.md` of knowledge base has conflict, follow the same rule as above.

## Sync Back Knowledge Base and Instructions

Run `Tools\Copilot\copilotInitAll.ps1` followed by `Tools\Tools\CheckRepo.ps1 CheckAll`, and you will find many other repos are also updated. git commit and push all changes in affected repos.
