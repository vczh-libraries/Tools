# Unit Test Projects to Work with

- `LibraryTest`
- `CompilerTest_GenerateMetadata`
- `CompilerTest_LoadAndCompile`
- `RuntimeTest`
- `CppTest`
- `CppTest_Metaonly`
- `CppTest_Reflection`

## Calling copilotBuild.ps1 and copilotExecute.ps1

This solution is in `Test\UnitTest`, after `ls` to this folder, scripts will be accessible with:
- `& ..\..\.github\TaskLogs\copilotBuild.ps1`
  - Check out `Compile the Solution` for usage of this script.
- `& ..\..\.github\TaskLogs\copilotExecute.ps1 -Executable <The-Test-Project-Name>`. 
  - Check out `Executing Unit Test` for usage of this script.
