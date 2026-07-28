You are going to add tags to all these repos:
- Vlpp
- VlppOS
- VlppRegex
- VlppReflection
- VlppParser2
- Workflow
- GacUI
- GacJS
- wGac
- iGac
The task will be provided in the request usually like:
- job.tagCommit.prompt.md 1.2.3.4
- job.tagCommit.prompt.md force 1.2.3.4

## Process

Go through each repos
- Run `git pull origin --tags` to sync all tags with remote.
- Find if the tag is already exists:
  - If not exists, run `git tag -a TAG -m "Release TAG"` followed by `git push origin --tags`.
  - If exists:
    - If this is not a "force" request, skip this repo and continue to the next one.
    - If this is a "force" request, run `git tag --force -a TAG -m "Release TAG"` followed by `git push --force origin --tags`.
