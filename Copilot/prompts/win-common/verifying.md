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
