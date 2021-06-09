# Tools

**Read the [LICENSE](https://github.com/vczh-libraries/Tools/blob/master/LICENSE.md) first.**

Build tools for this organization

## Build Release in Windows

Open PowerShell in folder `Tools` and run:

- `.\Build.ps1`
- `.\DocGen.ps1`
- `.\DocGen.ps1 copy`

## Generate Repo Release in Windows

Open PowerShell in folder `repo\Release` and run:

- `..\..\Tools\Tools\CodePack.exe .\CodegenConfig.xml`

`CodePack.exe` is created during **Build Release**
