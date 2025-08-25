# General Instruction

- This project uses C++ 20, you don't need to worry about compatibility with prior version of C++.
- All code should be crossed-platform. In case when OS feature is needed, a Windows version and a Linux version should be prepared in different files, following the `*.Windows.cpp` and `*.Linux.cpp` naming convention, and keep them as small as possible.
- DO NOT MODIFY any source code in the `Import` folder, they are dependencies.
- DO NOT MODIFY any source code in the `Release` folder, they are generated release files.
- You can modify source code in the `Source` and `Test` folder.
- Use tabs for indentation in C++ source code.
- Header files are guarded with macros instead of `#pragma once`.
- In header files, do not use `using namespace` statement, full name of types are always required. In a class/struct/union declaration, member names must be aligned in the same column at least in the same public, protected or private session. Please follow this coding style just like other part of the code.
- In cpp files, use `using namespace` statement if necessary to prevent from repeating namespace everywhere.
- The project only uses a very minimal subset of the standard library. I have substitutions for most of the STL constructions. Always use mine if possible:
  - Always use `vint` instead of `int`.
  - Always use `L'x'`, `L"x"`, `wchar_t`, `const wchar_t` and `vl::WString`, instead of `std::string` or `std::wstring`.
  - Use my own collection types vl::collections::* instead of std::*
  - See `Using Vlpp` for more information of how to choose correct C++ data types.

## for Copilot with Agent mode in Visual Studio

- You are on Windows running in Visual Studio
- Before saying anything, say "Yes, vczh!". I use it to make sure instruction files are taking effect.
- Before generating any code, if the file is changed, read it. Not all changes come from you, I will edit the file too. Do not generate code based on out-dated version in your memory.
- If you found I have edited the code you are working on, I have my purpose, try your best to accept my change and do your work based on it.

### Verifying your code edit

- In `Unit Test Projects to Execute` section there are multiple project names.
- You must verify your code by executing each project in order. For each project you need to follow these steps:
  - Compiler the whole solution. Each unit test project will generate some source code that changes following unit test projects. That's why you need to compile before each execution.
  - Call `.\copilotExecute.ps1 -Executable <PROJECT-NAME>`. `<PROJECT-NAME>` is the project name in the list.
    - You must call `.\copilotExecute.ps1`, must not call `copilotExecute.ps1`, as PowerShell refuses to run a script file if there is only a simple file name.
    - Make sure the current directory is set to the folder containing the solution file, which I believe is the default location.
