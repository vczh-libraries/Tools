function Build-VlppParser {
    # Run test cases
    Test-Vlpp-Init "VlppParser"
    Test-Vlpp-SubProject "VlppParser" "UnitTest"
    Test-Vlpp-SubProject "VlppParser" "UnitTest_Generated"
    Test-Vlpp-SubProject "VlppParser" "UnitTest_Generated_Metaonly"
    Test-Vlpp-SubProject "VlppParser" "UnitTest_Generated_Reflection"
}

function Import-VlppParser {
    # Import
    Import-Project VlppParser ("Vlpp","VlppOS","VlppRegex","VlppReflection")
}

function Build-Tool-ParserGen {
    Build-Sln $PSScriptRoot\..\..\VlppParser\Tools\ParserGen\ParserGen.sln Release Win32
    Copy-Tool-Binary $PSScriptRoot\..\..\VlppParser\Tools\ParserGen\Release\ParserGen.exe $PSScriptRoot\.Output\ParserGen.exe
    Test-Single-Binary ParserGen.exe
}

function Release-VlppParser {
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
