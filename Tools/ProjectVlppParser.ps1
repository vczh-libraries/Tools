function Build-VlppParser {
    # Run test cases
    Test-Vlpp "VlppParser"
}

function Update-VlppParser {
    # Import
    Import-Project VlppParser ("Vlpp","VlppOS","VlppRegex","VlppReflection")

    # Release
    Release-Project VlppParser

    # Build ParserGen.exe
    Build-Sln $PSScriptRoot\..\..\VlppParser\Tools\ParserGen\ParserGen\ParserGen.vcxproj Release x86
    Test-Single-Binary ParserGen.exe

    # Update Parsers
    Update-Parser $PSScriptRoot\..\..\VlppParser\Source\Parsing\Xml\ParsingXml.parser.txt
    Update-Parser $PSScriptRoot\..\..\VlppParser\Source\Parsing\Json\ParsingJson.parser.txt

    # Release again
    Release-Project VlppParser
}

function Build-Tool-CodePack {
    # Build CodePack.exe
    Build-Sln $PSScriptRoot\..\..\VlppParser\Tools\CodePack\CodePack\CodePack.vcxproj Release x86
    Test-Single-Binary CodePack.exe
}