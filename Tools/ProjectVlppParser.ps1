function Build-VlppParser {
    # Run test cases
    Test-Vlpp-SubProject "VlppParser" "UnitTest"
    Test-Vlpp-SubProject "VlppParser" "UnitTest_Generated"
    Test-Vlpp-SubProject "VlppParser" "UnitTest_Generated_Metaonly"
    Test-Vlpp-SubProject "VlppParser" "UnitTest_Generated_Reflection"
}

function Build-Tool-ParserGen {
    Build-Sln $PSScriptRoot\..\..\VlppParser\Tools\ParserGen\ParserGen\ParserGen.vcxproj Release x86
    Test-Single-Binary ParserGen.exe
}

function Update-VlppParser {
    # Import
    Import-Project VlppParser ("Vlpp","VlppOS","VlppRegex","VlppReflection")

    # Release
    Release-Project VlppParser

    # Build ParserGen.exe
    Build-Tool-ParserGen

    # Update Parsers
    Update-Parser $PSScriptRoot\..\..\VlppParser\Source\Parsing\Xml\ParsingXml.parser.txt
    Update-Parser $PSScriptRoot\..\..\VlppParser\Source\Parsing\Json\ParsingJson.parser.txt

    # Release again
    Release-Project VlppParser
}