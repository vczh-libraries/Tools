## Understanding the Building Tools

**WARNING**: Information offered in this section is for background knowledge only.
You should always run `Build Unit Tests` and `Run Unit Tests` instead of running these scripts or calling msbuild or other executable by yourself.
Only when you cannot access tools offered by Visual Studio Code, scripts below are allowed to use.

`REPO-ROOT` is the root folder of the repo.
`SOLUTION-ROOT` is the folder containing the solution file.
`PROJECT-NAME` is the name of the project.

When verifying test projects on Windows, msbuild is used to build a solution (`*.sln` or `*.slnx`) file.
A solution contains many project (`*.vcxproj`) files, a project generates an executable (`*.exe`) file.

Before building, ensure the debugger has stopped, otherwise the running unit test process will cause a linking failure.
If there is any error message, it means the debugger is not alive, it is good.

```
& REPO-ROOT\.github\Scripts\copilotDebug_Stop.ps1
```

The `Build Unit Tests` task calls msbuild to build the only solution which contains all test cases.
Inside the task, it runs `copilotBuild.ps1`

```
cd SOLUTION-ROOT
& REPO-ROOT\.github\Scripts\copilotBuild.ps1
```

The `Run Unit Tests` task runs all generated *.exe file for each *.vcxproj that is created for test cases.
To run test cases in `SOLUTION-ROOT\PROJECT-NAME\PROJECT-NAME.vcxproj`

```
cd SOLUTION-ROOT
& REPO-ROOT\.github\Scripts\copilotExecute.ps1 -Executable PROJECT-NAME
```

Test cases are organized in multiple test files.
In `PROJECT-NAME\PROJECT-NAME.vcxproj.user` there is a filter, when it is effective, you will see filtered test files marked with `[SKIPPED]` in `Execute.log`.
The filter is defined in this XPath: `/Project/PropertyGroup@Condition="'$(Configuration)|$(Platform)'=='Debug|x64'"/LocalDebuggerCommandArguments`.
The filter is effective only when the file exists and the element exists with one or multiple `/F:FILE-NAME.cpp`, listing all test files to execute, unlited files are skipped.
But if the element exists but there is no `/F:FILE-NAME.cpp`, it executes all test files, non is skipped.

**IMPORTANT**:

ONLY WHEN test files you want to run is skipped, you can update the filter to activate it. This would typically happen when:
- A new test file is added.
- A test file is renamed.

You can clean up the filter to remove unrelated files, that is either not existing or it is totally unrelated to the current task you are working.
If the current task does not work on that test file, but it tests closely related topic, you should better keep it in the list.

DO NOT delete this *.vcxproj.user file.
DO NOT clean the filter (aka delete all `/FILE-NAME.cpp`) by yourself. I put a filter there because running everything is slow and unnecessary for the current task.
