# Compile the Solution

- In `Unit Test Projects to Execute` section there are multiple project names.
- These projects are all `*.vcxproj` files. Locate them. In the parent folder there must be a `*.sln` file. That is the solution the compile.
- You must move the current working directory to the folder containing the `*.sln` file.
  - The `ls` command helps.
  - This must be done because `copilotBuild.ps1` searches `*.sln` from the working directory, otherwise it will fail.
- Execute `copilotBuild.ps1`.
- DO NOT use msbuild by yourself.
- You must keep fixing the code until all errors are eliminated.
