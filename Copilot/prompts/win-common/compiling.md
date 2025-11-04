## Compile the Solution

- Just let Visual Studio Code to compile the solution, the `Build Unit Tests` should have been configured in `tasks.json`.
  - This task only copmile without running.
- If Visual Studio Code is not well configured, you must warn me in chat with BIG BOLD TEXT and stop immediately.
- DO NOT use msbuild by yourself.
- DO NOT modify `tasks.json`.

### The Correct Way to Read Compiler Errors

- DO NOT TRUST related tools Visual Studio Code offers you, like `get_errors` or return value from task system, etc.
  - The reason is that, C++ extension is not installed so these tools are not working at all.
- The only source of trust is the raw output of the compiler.
  - The compiler does not create any log file, so DO NOT try to read any file for compile errors.
  - The only way to read errors is reading the CLI panel for the specific task in Visual Studio Code.
  - Check the output from the CLI panel for this task. At the very end there will be "X Warning(s) Y Errors(s)". If they are not 0, the CLI panel for this task should have more detailed information.
  