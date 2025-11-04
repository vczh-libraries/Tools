## Compile the Solution

- Just let Visual Studio Code to compile the solution, the `Build Unit Tests` should have been configured in `tasks.json`.
  - This task only copmile without running.
- If Visual Studio Code is not well configured, you must warn me in chat with BIG BOLD TEXT and stop immediately.
- DO NOT use msbuild by yourself.
- DO NOT modify `tasks.json`.
- DO NOT rely on Visual Studio Code tool to read errors. You must check the task panel which containing the raw compiler output.
  - When running MSBUILD, at the very end there will be "X Warning(s) Y Errors(s)". If they are not 0, the task panel should have more detailed information.
