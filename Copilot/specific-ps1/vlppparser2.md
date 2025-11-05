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
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable ParserTest_AstGen
```

```
cd REPO-ROOT\Test\UnitTest
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable ParserTest_AstParserGen
```

```
cd REPO-ROOT\Test\UnitTest
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable ParserTest_LexerAndParser
```

```
cd REPO-ROOT\Test\UnitTest
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable ParserTest_ParserGen
```

```
cd REPO-ROOT\Test\UnitTest
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable ParserTest_ParserGen_Compiler
```

```
cd REPO-ROOT\Test\UnitTest
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable ParserTest_ParserGen_Generated
```

```
cd REPO-ROOT\Test\UnitTest
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable BuiltInTest_Compiler
```

```
cd REPO-ROOT\Test\UnitTest
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable BuiltInTest_Compiler
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable BuiltInTest_Json
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable BuiltInTest_Xml
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable BuiltInTest_Workflow
& REPO-ROOT\.github\TaskLogs\copilotExecute.ps1 -Executable BuiltInTest_Cpp
```
