## Understanding the Building Tools

**WARNING**: Information offered in this section is for background knowledge only. You should always run `Build Unit Tests` and `Run Unit Tests` instead of running these scripts or calling msbuild by yourself. 

`REPO-ROOT` is the root folder of the repo.
`SOLUTION-ROOT` is the folder containing the solution file.
`PROJECT-NAME` is the name of the project.

When verifying test projects on Windows, msbuild is used to build a solution (*.sln) file.
A solution contains many project (*.vcxproj) files, a project generates a *.exe file.

The `Build Unit Tests` task calls msbuild to build the only solution which contains all test cases.
Inside the task, it basically runs `copilotBuild.ps1`

```
cd SOLUTION-ROOT
& REPO-ROOT\.github\TaskLogs\copilotBuild.ps1
```

The `Run Unit Tests` task runs all generated *.exe file for each *.vcxproj that is created for test cases.
To run test cases in `SOLUTION-ROOT\PROJECT-NAME\PROJECT-NAME.vcxproj`

```
cd SOLUTION-ROOT
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable PROJECT-NAME
```

Test cases are organized in multiple test files.
In `PROJECT-NAME\PROJECT-NAME.vcxproj.user` there is a filter, when it is effective, you will see filtered test files marked with `[SKIPPED]` in `Execute.log`.
The filter is defined in this XPath: `/Project/PropertyGroup@Condition="'$(Configuration)|$(Platform)'=='Debug|x64'"/LocalDebuggerCommandArguments`.
The filter is effective only when the file exists and the element exists with one or multiple `/F:FILE-NAME.cpp`.
If the element exists but there is no `/F:FILE-NAME.cpp`, all test files will be executed.

**IMPORTANT**:

ONLY WHEN test files you want to run is skipped, you can update the filter to activate it. This would typically happen when:
- A new test file is added.
- A test file is renamed.

You can clean up the filter to remove unrelated files, that is either not existing or it is totally unrelated to the current task you are working.
If the current task does not work on that test file, but it tests closely related topic, you should better keep it in the list.

DO NOT delete this *.vcxproj.user file.
DO NOT clean the filter (aka delete all `/FILE-NAME.cpp`) by yourself. I put a filter there because running everything is slow and unnecessary for the current task.
