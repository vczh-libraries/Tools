. $PSScriptRoot\Common.ps1

function Update-Vlpp {
    # Build CodePack.exe
    Build-Sln ..\..\Vlpp\Tools\CodePack\CodePack\CodePack.vcxproj Release x86
    Test-Single-Binary CodePack.exe

    # Release Vlpp
    Release-Project Vlpp

    # Build ParserGen.exe
    Build-Sln ..\..\Vlpp\Tools\ParserGen\ParserGen\ParserGen.vcxproj Release x86
    Test-Single-Binary ParserGen.exe

    # Update Parsers
    Update-Parser ..\..\Vlpp\Source\Parsing\Xml\ParsingXml.parser.txt
    Update-Parser ..\..\Vlpp\Source\Parsing\Json\ParsingJson.parser.txt

    # Release Vlpp
    Release-Project Vlpp
}