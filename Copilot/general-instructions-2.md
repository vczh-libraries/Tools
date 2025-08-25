## for Copilot Authoring a Pull Request

- If you are running in Visual Studio in Ask/Agent mode, ignore this section.

You are on Linux.
There are unit test projects that available in Linux, they are authored as makefile.
To use compile and run a unit test project, you need to `cd` to each folder that stores the makefile, and:

- `make clean` all makefiles.
- `make` all makefiles.
- `Bin/UnitTest` to run all unit test projects.
