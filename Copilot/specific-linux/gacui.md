You have to verify your code by running each unit test projects in order:

- `Test/Linux/Metadata_Generate/makefile`
- `Test/Linux/Metadata_Test/makefile`
- `Test/Linux/UnitTest/makefile`
- Only `make clean` and `make` but do not `Bin/UnitTest` the follow makefiles:
  - `Test/Linux/CppTest/makefile`
  - `Test/Linux/CppTest_Metaonly/makefile`
  - `Test/Linux/CppTest_Reflection/makefile`
  - `Test/Linux/GacUI_Compiler/makefile`
