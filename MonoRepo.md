# MonoRepo Guide

This document describes the relationship between repos and how to work with them.
The repos covered are: Vlpp, VlppOS, VlppRegex, VlppReflection, VlppParser2, Workflow, GacUI, GacJS, iGac, Release and WebsiteSource.
Read `Tools/MonoRepo.md` and compare the content with this file. If anything is changed, replace this file with `Tools/MonoRepo.md`.
Use `git` to access repos, `gh` is generally not available. Unless explicitly instructed by me, you are going to work directly on the current branch, which is usually the `master` branch.
When `job:*` is mentioned, it means either `Tools/Jobs/job.*.prompt.md` or `Tools/Jobs/job.Windows.*.prompt.md`.
When commit and/or push are required, you should always commit and push once finishing a request, no matter whatever is pending or not. Github repos and clones are more for the backup purpose, there is no strong requirement of completeness of tasks before committing.

## Must-Read Files

`Project.md` and `.github\copilot-instructions.md` in each repo that provides them are must-read before editing the source code. Follow repository-specific `AGENTS.md` instructions as well.
`.github\copilot-instructions.md` and other contents (including instructions and documents) in each `.github` folder are the same across all repos.
`Project.md` contains repo specific instructions.

## Import and Release Folders

Each repo has an `Import` folder and a `Release` folder.
The `Import` folder contains files copied from the `Release` folders of depended repos.
The `Release` folder contains C++ source files that are concatenated from the `Source` folder to largely decrease the number of files.

`Release` is a downstream packaging repository. Maintenance projects should depend on the owning upstream repositories instead of reading framework sources back from `Release`. In particular, iGac assembles its committed `Import` snapshot from `GacUI/Import` and `GacUI/Release`; this keeps iGac eligible to be published into `Release` without a dependency cycle.

## Fixing Bugs in the Import Folder

Do not fix bugs directly in the `Import` folder.
Instead, identify the original repo where the bug originates, fix the bug there, and update its `Release` folder.
Then copy the generated C++ source files (but not the `IncludeOnly` folder) to the `Import` folder of the downstream repo,
and recompile the solution to test it with downstream code.

## When Updating Knowledge Base Pages

Knowledge base pages are grouped by projects; update each page only in its owning repository. GacUI framework guidance is maintained under `GacUI/.github/KnowledgeBase`.

## When Updating Document Website

Checkout `WebsiteSource/AGENTS.md` for more details.

## Debugging GacUI in Browser

Some GacUI issues can be addressed by running the GacUI core with UI in a browser using the website in the GacJS repo.
GacJS is also part of the release, Check out `GacUI\.github\Jobs\DebugRemoteProtocolWithGacJS.md` for details.

## Windows Specific

### Updating Release Folder

To update the `Release` folder, run `Tools\Tools\Codepack.backup.exe` on each `Release` folder's `CodegenConfig.xml`.
If you can't find this file, the source code is in `VlppParser2\Tools\Codepack`.

### Debugging GacUI with Remote Protocol

Remote Protocol is a feature that enables a remote rendering process connecting to headless a GacUI app.
It is the foundation of GacJS, and of future non-C++ renderers.
Check out `GacUI\.github\Jobs\DebugRemoteProtocolWithNativeRenderer.md` for details.

## Linux/macOS Specific

If any script reporting `VCPROOT` is missing, it should point to `Tools/Ubuntu`.

### Updating Release Folder

To update the `Release` folder, run `VlppParser2/Tools/Codepack/Bin/Codepack` on each `Release` folder's `CodegenConfig.xml`.
If you can't find this file, the source code is in `VlppParser2/Tools/Codepack`.

### Maintaining Build Scripts

Build scripts are in `Tools/Ubuntu`, and `<EACH-REPO>/.github/Ubuntu`.
When fixing build tools, fix `Tools/Ubuntu` and run `Tools/Ubuntu/vl/cmd/vgo uci` to spread the change to all other C++ repos.
These build tools are expected to run in Ubuntu and macOS. If platform differences require compatibility code:
- First detect the Bash version and use the newer solution when possible.
- Then detect macOS if a cross-platform solution is unavailable.
- Assume we are running on Ubuntu, no further detection needs to do.

## Linux Specific (wGac repo)

Wayland platform implementation for `GacUI` is in `wGac` repo. This repo is dedicated for running GacUI applications as actual UI applications on Linux. `wGac/AGENTS.md` must be read before doing any change on this repo.

## macOS Specific (iGac repo)

macOS platform implementation for `GacUI` is in `iGac` repo. This repo is dedicated for running GacUI applications as actual UI applications on macOS. `iGac/AGENTS.md` must be read before doing any change on this repo.
