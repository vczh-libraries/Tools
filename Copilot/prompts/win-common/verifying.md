## Executing Unit Test

- Just let Visual Studio Code to run the unit test, the `Run Unit Tests` should have been configured in `tasks.json`.
  - This task run the unit test without compiling. You are fine if you already compile the unit test.
  - Run the task and wait for the task to finish, and check:
    - If you can't find the terminal for this task, it means there is no error.
    - If the task finishes but leaving a terminal:
      - When any test fails, you should be indicated as the return value for the process will be non-zero.
      - When all test cases pass, there will be a summarizing about how many test cases are executed. Otherwise it crashed.
- If Visual Studio Code is not well configured, you must warn me in chat with BIG BOLD TEXT and stop immediately.
- DO NOT call executables or scripts yourself.
