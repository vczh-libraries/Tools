# Unit Test Projects to Work with

## Compile the Solution

- Run the `Build Unit Tests` task.
- DO NOT use msbuild by yourself.

### The Correct Way to Read Compiler Result

- The only source of trust is the raw output of the compiler.
  - It is saved to `REPO-ROOT/.github/TaskLogs/Build.log`. `REPO-ROOT` is the root folder of the repo.
  - Wait for the task to finish before reading the log file. DO NOT HURRY.
    - A temporary file `Build.log.unfinished` is created during building. It will be automatically deleted as soon as the building finishes . If you see this file, it means the building is not finished yet.
  - When build succeeds, the last several lines will show the following 3 lines, otherwise there are either warnings or errors. You can check the last 10 lines to make sure if build succceeded:
    - "Build succeeded."
    - "0 Warning(s)"
    - "0 Error(s)"
- DO NOT TRUST related tools Visual Studio Code offers you, like `get_errors` or `get_task_output`, etc.

## Executing Unit Test

- Run the `Run Unit Tests` task.
- DO NOT call executables or scripts yourself.

### The Correct Way to Read Test Result

- The only source of trust is the raw output of the unit test process.
  - It is saved to `REPO-ROOT/.github/TaskLogs/Execute.log`. `REPO-ROOT` is the root folder of the repo.
  - Wait for the task to finish before reading the log file. DO NOT HURRY.
    - A temporary file `Execute.log.unfinished` is created during testing. It will be automatically deleted as soon as the testing finishes. If you see this file, it means the testing is not finished yet.
  - When all test case passes, the last several lines will show the following 2 lines, otherwise it crashed at the last showing test case. You can check the last 5 lines to make sure if all test cases passed:
    - "Passed test files: X/X"
    - "Passed test cases: Y/Y"
- DO NOT TRUST related tools Visual Studio Code offers you, like `get_errors` or `get_task_output`, etc.

## Debugging Unit Test

Debugging would be useful when you lack of necessary information.
In this section I offer you a set of powershell scripts that work with CDB (Microsoft's Console Debugger).
CDB accepts exactly same commands as WinDBG.

### Start a Debugger

`REPO-ROOT` is the root folder of the repo.
Find out `Unit Test Project Structure` to understand the solution folder and the unit test project name you are working with.
Additional information could be found in THE FIRST LINE in `REPO-ROOT/.github/TaskLogs/Execute.log`.
Execute the following powershell commands:

```
cd SOLUTION-ROOT
start powershell {& REPO-ROOT\.github\TaskLogs\copilotDebug_Start.ps1 -Executable PROJECT-NAME}
```

The `start powershell {}` is necessary otherwise the script will block the execution forever causing you to wait infinitely.
The script will finish immediately, leaving a debugger running in the background. You can send commands to the debugger.
The process being debugged is paused at the beginning, you are given a chance to set break-points.
After you are prepared, send the `g` command to start running.

### Stop a Debugger

You must call this script do stop the debugger.
Do not stop the debugger using any command.
This script is also required to run before compiling only when Visual Studio Code tasks are not available to you.

```
& REPO-ROOT\.github\TaskLogs\copilotDebug_Stop.ps1
```

If there is any error message, it means the debugger is not alive, it is good.

### Sending Commands to Debugger

```
& REPO-ROOT\.github\TaskLogs\copilotDebug_Stop.ps1 -Command "Commands"
```

Multiple commands can be executed sequencially separated by ";".
The debugger is configured to be using source mode, which means you can see source files and line numbers in the call stack, and step in/out/over are working line by line.
CDB accepts exactly same commands as WinDBG, and here are some recommended commands:
- **g**: continue until hitting a break-point or crashing.
- **k**n: print current call stack.
- **kn LINES**: print first `LINES` of the current call stack.
- **.frame NUMBER**: inspect the call stack frame labeled with `NUMBER`. `kn` will show the number, file and line along with the call stack.
- **dv**: list all available variables in the current call stack frame.
- **dx EXPRESSION**: evaluate the `EXPRESSION` and print the result. `EXPRESSION` can be any valid C programming language expression. When you specify a type (especially when doing casting), full namespaces are required, do not start with `::`.
- **bp `FILE:LINE`**: set a break-point at the specified line in `FILE`, starting from 0. A pair of "`" characters are required around the target, this is not a markdown syntax.
- **bl**, **.bpcmds**, **be NUMBERS**, **bd NUMBERS**, **bc NUMBERS**, **bsc NUMBER CONDITION**: list, list with attached commands, enable, disable, delete, attach a command to break-point(s).
- **p**: step over, aka execute the complete current line.
- **t**: step in, aka execute the currrent line, if any function is called, goes into the function.
**pt**: step out, aka run until the end of the current function.

An `.natvis` file is automatically offered with the debugger,
it formats some primitive types defined in the `Vlpp` project,
including `WString` and other string types, `Nullable`, `Variant`, container types, etc.
The formmating applies to the **dx** command,
when you want to see raw data instead of formatting printing,
use **dx (EXPRESSION),!**.

You can also use `dv -rX` to expand "X" levels of fields, the default option is `-r0` which only expand one level of fields.

### Commands to Avoid

- Only use **dv** without any parameters.
- DO NOT use **dt**.
- DO NOT use **q**, **qd**, **qq**, **qqd** etc to stop the debugger, always use `copilotDebug_Stop.ps1`.
