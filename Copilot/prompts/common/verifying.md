# Verifying your code edit

- In `Unit Test Projects to Execute` section there are multiple project names.
- These projects are all `*.vcxproj` files. Locate them. In the parent folder there must be a `*.sln` file. That is the solution the compile.
- You must move the current working directory to the folder containing the `*.sln` file.
- You must verify your code by executing each project in order. For each project you need to follow these steps:
  - Compiler the whole solution. Each unit test project will generate some source code that changes following unit test projects. That's why you need to compile before each execution.
  - Execute `copilotBuild.ps1 -Executable <PROJECT-NAME>`. `<PROJECT-NAME>` is the project name in the list.
- You must keep fixing the code until all errors are eliminated.
