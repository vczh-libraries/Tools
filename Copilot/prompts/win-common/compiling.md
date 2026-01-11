## Compile the Solution

- Run the `Build Unit Tests` task.
- DO NOT use msbuild by yourself.

### The Correct Way to Read Compiler Result

- The only source of trust is the raw output of the compiler.
  - It is saved to `REPO-ROOT/.github/TaskLogs/Build.log`. `REPO-ROOT` is the root folder of the repo.
  - Wait for the task to finish before reading the log file. DO NOT HURRY.
  - When build succeeds, the last several lines will show the following 3 lines, otherwise there are either warnings or errors. You can check the last 10 lines to make sure if build succceeded:
    - "Build succeeded."
    - "0 Warning(s)"
    - "0 Error(s)"
- DO NOT TRUST related tools Visual Studio Code offers you, like `get_errors` or `get_task_output`, etc.
