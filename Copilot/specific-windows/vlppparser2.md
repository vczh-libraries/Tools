## Unit Test Projects to Execute

- `ParserTest_AstGen`
- `ParserTest_AstParserGen`
- `ParserTest_LexerAndParser`
- `ParserTest_ParserGen`
- `ParserTest_ParserGen_Compiler`
- `ParserTest_ParserGen_Generated`
- `BuiltInTest_Compiler`
- `BuiltInTest_Json`
- `BuiltInTest_Xml`
- `BuiltInTest_Workflow`
- `BuiltInTest_Cpp`

### Calling copilotBuild.ps1 and copilotExecute.ps1

This solution is in `Test\UnitTest`, after `ls` to this folder, scripts will be accessible with:
- `& ..\..\.github\TaskLogs\copilotBuild.ps1`
  - Check out `Compile the Solution` for usage of this script.
- `& ..\..\.github\TaskLogs\copilotExecute.ps1`. 
  - Check out `Verifying your code edit` for usage of this script.
