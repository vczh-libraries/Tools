function Build-VlppParser2 {
    # Run test cases
    Test-Vlpp-SubProject "VlppParser2" "ParserTest_AstGen"
    Test-Vlpp-SubProject "VlppParser2" "ParserTest_AstParserGen"
    Test-Vlpp-SubProject "VlppParser2" "ParserTest_LexerAndParser"
    Test-Vlpp-SubProject "VlppParser2" "ParserTest_ParserGen"
    Test-Vlpp-SubProject "VlppParser2" "ParserTest_ParserGen_Compiler"
    Test-Vlpp-SubProject "VlppParser2" "ParserTest_ParserGen_Generated"
    Test-Vlpp-SubProject "VlppParser2" "BuiltInTest_Json"
    Test-Vlpp-SubProject "VlppParser2" "BuiltInTest_Workflow"
    Test-Vlpp-SubProject "VlppParser2" "BuiltInTest_Xml"
}

function Build-Tool-GlrParserGen {
    Build-Sln $PSScriptRoot\..\..\VlppParser2\Tools\GlrParserGen\GlrParserGen\GlrParserGen.vcxproj Release x86
    Test-Single-Binary GlrParserGen.exe
}

function Build-Tool-CodePack {
    Build-Sln $PSScriptRoot\..\..\VlppParser2\Tools\CodePack\CodePack\CodePack.vcxproj Release x86
    Test-Single-Binary CodePack.exe
}

function Update-VlppParser2 {
    # Import
    Import-Project VlppParser2 ("Vlpp","VlppOS","VlppRegex","VlppReflection")

    # Release
    Release-Project VlppParser2

    # Build GlrParserGen.exe
    Build-Tool-GlrParserGen
    
    # Build CodePack.exe
    Build-Tool-CodePack
}