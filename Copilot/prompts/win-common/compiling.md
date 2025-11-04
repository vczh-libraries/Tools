## Compile the Solution

- Just let Visual Studio Code to compile the solution, the `Build Unit Tests` should have been configured in `tasks.json`.
  - This task only copmile without running.
- If Visual Studio Code is not well configured, you must warn me in chat with BIG BOLD TEXT and stop immediately.
- DO NOT use msbuild by yourself.
- DO NOT modify `tasks.json`.

### The Correct Way to Read Compiler Result

- The only source of trust is the raw output of the compiler.
  - It is saved to `REPO-ROOT/.github/TaskLogs/Build.log`. `REPO-ROOT` is the root folder of the repo.
- DO NOT TRUST related tools Visual Studio Code offers you, like `get_errors` or `get_task_output`, etc.
