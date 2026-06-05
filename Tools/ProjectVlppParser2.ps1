function Build-VlppParser2 {
    # Run test cases
    Test-Vlpp-Init "VlppParser2"
    Test-Vlpp-SubProject "VlppParser2" "ParserTest_AstGen"
    Test-Vlpp-SubProject "VlppParser2" "ParserTest_AstParserGen"
    Test-Vlpp-SubProject "VlppParser2" "ParserTest_LexerAndParser"
    Test-Vlpp-SubProject "VlppParser2" "ParserTest_ParserGen"
    Test-Vlpp-SubProject "VlppParser2" "ParserTest_ParserGen_Compiler"
    Test-Vlpp-SubProject "VlppParser2" "ParserTest_ParserGen_Generated"
    Test-Vlpp-SubProject "VlppParser2" "BuiltInTest_Json"
    Test-Vlpp-SubProject "VlppParser2" "BuiltInTest_Workflow"
    Test-Vlpp-SubProject "VlppParser2" "BuiltInTest_Xml"
    Build-TypeScript-Package "VlppParser2"
}

function Import-VlppParser2 {
    # Import
    Import-Project VlppParser2 ("Vlpp","VlppOS","VlppRegex","VlppReflection")
}

function Build-Tool-GlrParserGen {
    Build-Sln $PSScriptRoot\..\..\VlppParser2\Tools\GlrParserGen\GlrParserGen.sln Release x86
    Copy-Tool-Binary $PSScriptRoot\..\..\VlppParser2\Tools\GlrParserGen\Release\GlrParserGen.exe $PSScriptRoot\.Output\GlrParserGen.exe
    Test-Single-Binary GlrParserGen.exe
}

function Build-Tool-CodePack {
    Build-Sln $PSScriptRoot\..\..\VlppParser2\Tools\CodePack\CodePack.sln Release x86
    Copy-Tool-Binary $PSScriptRoot\..\..\VlppParser2\Tools\CodePack\Release\CodePack.exe $PSScriptRoot\.Output\CodePack.exe
    Test-Single-Binary CodePack.exe
}

function Release-VlppParser2 {
    # Release
    Release-Project VlppParser2

    # Build GlrParserGen.exe
    Build-Tool-GlrParserGen
    
    # Build CodePack.exe
    Build-Tool-CodePack
}
