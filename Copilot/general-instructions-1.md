# General Instruction

- DO NOT MODIFY any source code in the `Import` folder, they are dependencies.
- DO NOT MODIFY any source code in the `Release` folder, they are generated release files.
- You can modify source code in the `Source` and `Test` folder.
- Use tabs for indentation in C++ source code.
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

## for Copilot Authoring a Pull Request

- You are on Linux

### Verifying via Unit Test

There are unit test projects that available in Linux, they are authored as makefile.
To use compile and run a unit test project, you need to `cd` to each folder that stores the makefile, and:

- `make clean` all makefiles.
- `make` all makefiles.
- `Bin/UnitTest` to run all unit test projects.
