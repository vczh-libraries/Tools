### Unit Test Project Structure

In this project, the only unit test solution is `REPO-ROOT\Test\UnitTest\UnitTest.sln` therefore `SOLUTION-ROOT` is `REPO-ROOT\Test\UnitTest`.
Here is the list of all unit test projects under this solution and they are executed in the following order:
- ParserTest_AstGen
- ParserTest_AstParserGen
- ParserTest_LexerAndParser
- ParserTest_LexerAndParser_Generated
- ParserTest_ParserGen
- ParserTest_ParserGen_Compiler
- ParserTest_ParserGen_Generated
- BuiltInTest_Compiler
- BuiltInTest_Json
- BuiltInTest_Xml
- BuiltInTest_Workflow
- BuiltInTest_Cpp
