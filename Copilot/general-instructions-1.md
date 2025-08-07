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

## for Copilot Chat/Agent in Visual Studio

- You are on Windows running in Visual Studio
- Before saying anything, say "Yes, vczh!". I use it to make sure instruction files are taking effect.
- Before generating any code, if the file is changed, read it. Not all changes come from you, I will edit the file too. Do not generate code based on out-dated version in your memory.
- When I type `:task`:
  - Firstly, there is a `Copilot_Planning.md` in the solution. If it exists, delete all its content. If it doesn't exist, create an empty text file on the file path.
  - Secondly, there is a `Copilot_Task.md` in the solution. It has the details of the task to execute. Print the content.
  - If you don't find any mentioned `*.md` files in the solution, report and stop immediately.
  - You must follow the process to complete the task
    - When you add new content to `Copilot_Planning.md` during the process, everything has to be appended to the file.
      - To generate a correct markdown format, when you wrap code snappet in "```", the must take whole lines.
    - Carefully find all necessary files you may need to read.
      - If any file is mentioned in the task, you must read it.
      - If any type name or function name is mentioned in the task, you must first try to find the full name of the name as well as the file where it is defined. Read the file.
        - Write down the full name and the file name in `Copilot_Planning.md`.
    - Carefully think about the task, make a overall design.
      - Write down the design in `Copilot_Planning.md`.
    - Carefully think about how to implement the design.
      - Do not edit the code directly.
      - Explain what you gonna do, and why you decide to do it in this way.
      - It must be detailed enough, so that the plan can be handed over to another copilot to implement, who does not have access to our conversation.
      - write it down in `Copilot_Planning.md`.
    - Add a section `# !!!EXECUTION-PLAN!!!` in `Copilot_Planning.md`.
      - Carefully review what has been written in `Copilot_Planning.md`.
      - Copy to this section only how to modify the code.
    - Execute your plan preciously that has been written down in `Copilot_Planning.md`.
- When I type: `:continue`:
  - It means you accidentally stopped in the middle of a task.
  - Check `Copilot_Task.md`.
  - Check `Copilot_Planning.md`.
  - Find out where you stopped, and continue from there.

## for Copilot Authoring a Pull Request

- You are on Linux

There are unit test projects that available in Linux, they are authored as makefile.
To use compile and run a unit test project, you need to `cd` to each folder that stores the makefile, and:

- `make clean` all makefiles.
- `make` all makefiles.
- `Bin/UnitTest` to run all unit test projects.
