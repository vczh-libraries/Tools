function Test-Vlpp-Platform($platform, $outDir) {
    Build-Sln $PSScriptRoot\..\..\Vlpp\Test\UnitTest\UnitTest\UnitTest.vcxproj Release $platform OutDir "`"$outDir\`""
    if (!(Test-Path "$outDir\UnitTest.exe")) {
        throw "Failed"
    }

    Write-Host "Executing Unit Test ($platform) ..."
    Start-Process-And-Wait (,("$outDir\UnitTest.exe", ""))
}

function Test-Vlpp {
    Test-Vlpp-Platform x86 "$PSScriptRoot\..\..\Vlpp\Test\UnitTest\Release"
    Test-Vlpp-Platform x64 "$PSScriptRoot\..\..\Vlpp\Test\UnitTest\x64\Release"
}

function Update-Vlpp {
    # Run test cases
    Test-Vlpp

    # Build CodePack.exe
    Build-Sln $PSScriptRoot\..\..\Vlpp\Tools\CodePack\CodePack\CodePack.vcxproj Release x86
    Test-Single-Binary CodePack.exe

    # Release Vlpp
    Release-Project Vlpp

    # Build ParserGen.exe
    Build-Sln $PSScriptRoot\..\..\Vlpp\Tools\ParserGen\ParserGen\ParserGen.vcxproj Release x86
    Test-Single-Binary ParserGen.exe

    # Update Parsers
    Update-Parser $PSScriptRoot\..\..\Vlpp\Source\Parsing\Xml\ParsingXml.parser.txt
    Update-Parser $PSScriptRoot\..\..\Vlpp\Source\Parsing\Json\ParsingJson.parser.txt

    # Release Vlpp
    Release-Project Vlpp

    # Run test cases again
    Test-Vlpp
}