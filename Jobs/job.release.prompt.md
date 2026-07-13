You are going to run full CI for the whole monorepo.
If `git push` is blocked because of needing to merge, you are allowed to rebase by yourself:
  - Always rebase to the latest change of the remote branch, instead of making a rebase commit.
  - Only when the source code is changed from remote you should re-run the test process. If there is only document or instruction changes from remote, skip the test process.

## Preparing

- Run `Tools/Tools/CheckRepo.ps1 CheckAll` to find how if there are any uncommitted local changes in any repo, commit but no need to push.
- Run `Tools/Tools/CheckRepo.ps1 SyncAll` to pull the latest changes from remotes, pay attention to pull failure, which means you need to resolve conflicts manually.
- Resolve all conflicts.
  - No need to run tests and push as they will be covered in the subsequent steps.
- **IMPORTANT** only when make sure nothing is uncommitted in the following repos, run `git clean -xdf` to remove any temporary files:
  - Vlpp
  - VlppOS
  - VlppRegex
  - VlppReflection
  - VlppParser
  - VlppParser2
  - Workflow
  - GacUI
  - Release

## Instructions

Run monorepo script and it will stops at the first failure.
When any repo fails, you need to identify which test project fails, find information from the repo's `AGENTS.md` and `Project.md`, figure out how to build, test and debug that specific test project.
To ensure if that repo is good, run the single repo script.
And after the first failure, you need to switch to single repo script for the rest of the repos, because running CI on succeeded repos is a waste of time up to several hours, it is unacceptable.
Repos are ordered in Vlpp, VlppOS, VlppRegex, VlppReflection, VlppParser, VlppParser2, Workflow, GacUI, Release.
If the monorepo script succeeds directly, or if all repos are covered by the single repo script, full CI is done.
Find out how many repos have local changes, commit and push them.

### Qualify for Success

The goal of this job is to ensure the source code of this monorepo is qualified for release.
You are required to solve every errors, no matter who causes them.

## Fixing Cross-Repo Issues

Multiple C++ files will be merged into just a few pair of header and cpp files for release.
It is possible that the repo is good but merged files cause problems, and such problems may only be found in downstream repos.
In this way you are going to organize affected declarations in header and cpp files so that they both work in merged and unmerged versions.
It is possible that duplicated functions appear in merged files, you are recommended to create shared header files (or cpp files if necessary) to solve the sharing issue.

Pay attention to the `REPO-ROOT/Release` folder, because of some `.gitignore` issues, new files are not automatically tracked in this folder. You have to be careful about that.

## Windows Specific

Execute monorepo script `Tools/Tools/Build.ps1` to run CI for all repos in their dependency order until the first failure.
Execute single repo script `Tools/Tools/Build.ps1 <repo-name>` to run CI for a specific repo.
Execute `Tools/Tools/CheckRepo.ps1 CheckAll` to find out how many repos have local changes.

`Build.ps1` can pickup release from upstream repos and prepare release for downstream repos.

## Linux/macOS Specific

Execute monorepo script `vgo vmake` followed by `vgo vbuild` to run CI for all repos in their dependency order until the first failure.
Execute single repo script `vgo vmake <repo-name>` (only when you updated MSBuild project files) followed by `vgo vbuild <repo-name>` to run CI for a specific repo.
Execute `vsync --check` to find out how many repos have local changes.

Guidelines for each repo will tell you to run `build.sh` to build any test project, but when you are in monorepo context, you can run `vmake --make` (only when you updated MSBuild project files) followed by `vbuild -b` to achieve the same goal. Both way require you to be in the test project folder.

Linux build scripts do not prepare release. If any cross-repo issues are found (probably Linux specific issues), you can do manual release by:
- Build `VlppParser2/Tools/CodePack`.
- Run `VlppParser2/Tools/CodePack/Bin/CodePack`, feeding any `REPO-ROOT/Release/CodegenConfig.xml`, it creates a release for that repo.
- Copy released header and cpp files to a downstream repo. You are able to figure out what files to copy to what repos by checking if `DOWNSTREAM-REPO-ROOT/Release` has any files from `UPSTREAM-REPO-ROOT/Release`.

Usually Linux CI runs after Windows CI completes, so most of the time your job is to fix makefiles or C++ compatibility issues.

### Reverting Platform-Only Generated Resource Changes in GacUI repo before `git commit`

Linux GacUI CI can rewrite tracked generated `*.bin` and `*.cpp` resource files only because Windows and Linux check out text with different line endings. Serialized source positions and embedded text then change even when the resource has no functional change. Do not decode the binary format merely to decide whether these changes are valid.

Use Git history to identify platform-only changes:
- Compare the regenerated file's blob hash with the same path in an earlier Linux CI commit.
- Compare the pre-CI `HEAD` blob hash with the same path in that Linux commit's parent, or in a later known Windows regeneration commit.
- If both sides match exactly, the files are toggling between known Linux-generated and Windows-generated blobs. This proves platform-only churn without decoding the binaries.
- Corroborating signs include identical changes in x86 and x64 counterparts, unchanged resource inputs, unchanged or nearly unchanged binary sizes, and generated `*.cpp` payload differences limited to `CRLF` versus `LF` and the resulting byte counts.

When this historical toggle is proven, revert only those CI-created generated `*.bin` and `*.cpp` changes and do not commit them. Keep and commit independent valid changes, such as makefile updates or refreshed snapshots. If the regenerated blobs do not match a known Linux generation, or their inputs changed, treat them as potentially valid and investigate instead of reverting them.
