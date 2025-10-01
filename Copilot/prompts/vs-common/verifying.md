## Executing Unit Test

- In `Unit Test Projects to Work with` section there are multiple project names.
- These projects are all `*.vcxproj` files. Locate them. In the parent folder there must be a `*.sln` file. That is the solution the compile.
- You must move the current working directory to the folder containing the `*.sln` file.
  - The `ls` command helps.
  - This must be done because `copilotExecute.ps1` searches `*.sln` from the working directory, otherwise it will fail.
- You must verify your code by executing each project in order. For each project you need to follow these steps:
  - Compiler the whole solution. Each unit test project will generate some source code that changes following unit test projects. That's why you need to compile before each execution.
  - Execute `copilotExecute.ps1 -Executable <PROJECT-NAME>`. `<PROJECT-NAME>` is the project name in the list.
    - When all test cases pass, there will be a summarizing about how many test cases are executed. Otherwise it crashed at the last showing test case.
- You must keep fixing the code until all errors are eliminated.
