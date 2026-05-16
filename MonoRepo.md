# MonoRepo Guide

This document describes the relationship between repos and how to work with them.
The repos covered are: Vlpp, VlppOS, VlppRegex, VlppReflection, VlppParser2, Workflow, and GacUI.

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

## Windows Specific

### Updating Release Folder

To update the `Release` folder, run `Tools\Tools\Codepack.backup.exe` on each `Release` folder's `CodegenConfig.xml`.
If you can't find this file, the source code is in `VlppParser2\Tools\Codepack`.

### Debugging GacUI in Browser

Some GacUI issues can be addressed by running the GacUI core with UI in a browser using the website in the GacJS repo.
Check out `Tools\DebugGacUIWithBrowser.md` for details.

## Linux Specific

### Updating Release Folder

To update the `Release` folder, run `VlppParser2/Tools/Codepack/Bin/Codepack` on each `Release` folder's `CodegenConfig.xml`.
If you can't find this file, the source code is in `VlppParser2/Tools/Codepack`.
