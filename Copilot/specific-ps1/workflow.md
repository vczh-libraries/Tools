# Unit Test Projects to Work with

REPO-ROOT is the **absolute path** of the current repo.

## Calling copilotBuild.ps1

**MUST FOLLOW**:
Each script edits C++ files that are used in the next unit test project.
So you must recompile between running each script.

```
cd REPO-ROOT\Test\UnitTest
& REPO-ROOT\.github\TaskLogs\copilotBuild.ps1
```

## Calling copilotExecute.ps1

```
cd REPO-ROOT\Test\UnitTest
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable LibraryTest
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable CompilerTest_GenerateMetadata
```

```
cd REPO-ROOT\Test\UnitTest
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable CompilerTest_LoadAndCompile
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable RuntimeTest
```

```
cd REPO-ROOT\Test\UnitTest
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable CppTest
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable CppTest_Metaonly
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable CppTest_Reflection
```
