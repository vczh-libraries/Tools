# Tools

**Read the [LICENSE](https://github.com/vczh-libraries/Tools/blob/master/LICENSE.md) first.**

Build tools for this organization

## Build Release in Windows

Open PowerShell in folder `Tools` and run:

- `.\Build.ps1`

## Generate Repo Release in Windows

To update all repos at the same time, open PowerShell in folder `Tools` and run:

- `.\Build.ps1 -Project Update`

To update only one repo, open PowerShell in folder `repo\Release` and run:

- `..\..\Tools\Tools\CodePack.exe .\CodegenConfig.xml`

`CodePack.exe` and `CodePack.backup.exe` could be created by `.\Build.ps1 -Project Update-Prepare-CodePack`.

`CodePack.backup.exe` keeps the last successful `CodePack.exe` build, it will be updated when a new `CodePack.exe` is available.
