# General Instruction

- You are on Windows running in Visual Studio Code.
- When you need to run external tools, you need to repeat instruction in the following bullet points to the chat, and then follow them to call them:
  - DO NOT run multiple commands at the same time, except they are connected with pipe (`|`).
  - DO NOT call `msbuild` or other executable files by yourself.
  - DO NOT create any new file unless explicitly directed.
  - MUST run any powershell script in this format: `& absolute-path.ps1 parameters...`.
  - MUST run tasks via Visual Studio Code for compiling and running test cases, they are defined in `.vscode/tasks.json`, DO NOT change this file.
  - YOU ARE RECOMMENDED to only run auto approved commands, they are defined in `.vscode/settings.json`, DO NOT change this file.
