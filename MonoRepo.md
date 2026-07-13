# MonoRepo Guide

This document describes the relationship between repos and how to work with them.
The repos covered are: Vlpp, VlppOS, VlppRegex, VlppReflection, VlppParser2, Workflow, GacUI, Release and WebsiteSource.

Read `Tools/MonoRepo.md` and compare the content with this file, it anything is changed, override this file with `Tools/MonoRepo.md`.

Use `git` to access repos, `gh` is generally not available. Unless explicitly instructed by me, you are going to work directly on the current branch, which is usually the `master` branch.

## Must-Read Files

`Project.md` and `.github\copilot-instructions.md` in each repo are must-read before editing the source code.
`.github\copilot-instructions.md` and other contents (including instructions and documents) in each `.github` folder are the same across all repos.
`Project.md` contains repo specific instructions.

## Import and Release Folders

Each repo has an `Import` folder and a `Release` folder.
The `Import` folder contains files copied from the `Release` folders of depended repos.
The `Release` folder contains C++ source files that are concatenated from the `Source` folder to largely decrease the number of files.

## Fixing Bugs in the Import Folder

Do not fix bugs directly in the `Import` folder.
Instead, identify the original repo where the bug originates, fix the bug there, and update its `Release` folder.
Then copy the generated C++ source files (but not the `IncludeOnly` folder) to the `Import` folder of the downstream repo,
and recompile the solution to test it with downstream code.

## When Updating Knowledge Base Pages

Knowledge base pages are grouped by projects, you should only update pages beloning to a project in its own repo.

## When Updating Document Website

Checkout `WebsiteSource/AGENTS.md` for more details.

## Windows Specific

### Updating Release Folder

To update the `Release` folder, run `Tools\Tools\Codepack.backup.exe` on each `Release` folder's `CodegenConfig.xml`.
If you can't find this file, the source code is in `VlppParser2\Tools\Codepack`.

### Debugging GacUI in Browser

Some GacUI issues can be addressed by running the GacUI core with UI in a browser using the website in the GacJS repo.
GacJS is also part of the release, Check out `Tools\DebugGacUIWithBrowser.md` for details.

### Debugging GacUI with Remote Protocol

Remote Protocol is a feature that enables a remote rendering process connecting to headless a GacUI app.
It is the foundation of GacJS, and of future non-C++ renderers.
Check out `Tools\DebugGacUIWithRemoteProtocol.md` for details.

## Linux/macOS Specific

### Updating Release Folder

To update the `Release` folder, run `VlppParser2/Tools/Codepack/Bin/Codepack` on each `Release` folder's `CodegenConfig.xml`.
If you can't find this file, the source code is in `VlppParser2/Tools/Codepack`.

### Maintaining Build Scripts

Build scripts are in `Tools/Ubuntu`, and `<EACH-REPO>/.github/Ubuntu`.
When fixing build tools, fix `Tools/Ubuntu` and run `Tools/Ubuntu/vl/cmd/vgo uci` to spread the change to all other C++ repos.
These build tools are expected to run in Ubuntu and macOS, if anything is different leading to backward compatibility code:
- Firstly detech bash version, use higher version solution if possible.
- Secondly detech macOS, use macOS solution if cross-platform way cannot achieve.
- Assume we are running on Ubuntu, no further detection needs to do.
