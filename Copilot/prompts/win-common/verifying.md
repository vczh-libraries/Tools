## Executing Unit Test

- Just let Visual Studio Code to run the unit test, the `Run Unit Tests` should have been configured in `tasks.json`.
  - If you updated any source files, you should build the unit test before running it, check out `Compile the Solution` for details.
  - Run the `Run Unit Tests` task.
  - When all test cases pass, there will be a summarizing about how many test cases are executed. Otherwise it crashed at the last showing test case.
- If Visual Studio Code is not well configured, you must warn me in chat with BIG BOLD TEXT and stop immediately.
- DO NOT call executables or scripts yourself.
- DO NOT modify `tasks.json`.
- DO NOT run `Build and Run Unit Tests`.

### The Correct Way to Read Test Result

- The only source of trust is the raw output of the unit test process.
  - It is saved to `REPO-ROOT/.github/TaskLogs/Execute.log`. `REPO-ROOT` is the root folder of the repo.
- DO NOT TRUST related tools Visual Studio Code offers you, like `get_errors` or `get_task_output`, etc.
