# Sync the Whole Github Organization

- Run `Tools/Tools/CheckRepo.ps1 CheckAll` to find how if there are any uncommitted local changes in any repo, commit but no need to push.
- Run `Tools/Tools/CheckRepo.ps1 SyncAll` to pull the latest changes from remotes, pay attention to pull failure, which means you need to resolve conflicts manually.
- Resolve all conflicts.
  - Resolve all conflicts with rebase.
  - Push all resolved changes.
