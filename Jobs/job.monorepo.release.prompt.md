You are going to run full CI for the whole monorepo.

## Instructions

Run monorepo script and it will stops at the first failure.
When any repo fails, you need to identify which test project fails, find information from the repo's `AGENTS.md` and `Project.md`, figure out how to build, test and debug that specific test project.
To ensure if that repo is good, run the single repo script.
And after the first failure, you need to script to single repo script for the rest of the repos, because running CI on succeeded repos is a waste of time up to several hours, it is unacceptable.
Repos are ordered in Vlpp, VlppOS, VlppRegex, VlppReflection, VlppParser, VlppParser2, Workflow, GacUI, Release.
If the monorepo script succeeds directly, or if all repos are covered by the single repo script, full CI is done.
Find out how many repos have local changes, commit and push them.

## Windows Specific

Execute monorepo script `Tools/Tools/Build.ps1` to run CI for all repos in their dependency order until the first failure.
Execute single repo script `Tools/Tools/Build.ps1 <repo-name>` to run CI for a specific repo.
Execute `Tools/Tools/CheckRepo.ps1 CheckAll` to find out how many repos have local changes.

## Linux Specific

Execute monorepo script `vgo vmake` followed by `vgo vbuild` to run CI for all repos in their dependency order until the first failure.
Execute single repo script `vgo vmake <repo-name>` (only when you updated MSBuild project files) followed by `vgo vbuild <repo-name>` to run CI for a specific repo.
Execute `vsync --check` to find out how many repos have local changes.

Guidelines for each repo will tell you to run `build.sh` to build any test project, but when you are in monorepo context, you can run `vmake` (only when you updated MSBuild project files) followed by `vbuild -b` to achieve the same goal. Both way require you to be in the test project folder.

Usually Linux CI runs after Windows CI completes, so most of the time your job is to fix makefiles or C++ compatibility issues.
