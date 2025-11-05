# External Tools Environment and Context

- You are on Windows running in Cursor.
- In order to achieve the goal, you always need to create/delete/update files, build the project, run the unit test, etc. This is what you MUST DO to ensure a successful result:
  - You are always recommended to ask Cursor for any task, but when there is no choice but to use a Powershell Terminal:
    - DO NOT run multiple commands at the same time, except they are connected with pipe (`|`).
    - DO NOT call `msbuild` or other executable files by yourself.
    - DO NOT create any new file unless explicitly directed.
    - MUST run any powershell script in this format: `& absolute-path.ps1 parameters...`.
    - MUST run tasks via Cursor for compiling and running test cases, they are defined in `.vscode/tasks.json`, DO NOT    change this file.
