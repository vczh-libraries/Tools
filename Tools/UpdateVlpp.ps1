. $PSScriptRoot\Common.ps1

function Run-Unit-Test-Platform($platform, $outDir) {
    Build-Sln ..\..\Vlpp\Test\UnitTest\UnitTest\UnitTest.vcxproj Release $platform OutDir "`"$outDir\`""
    if (!(Test-Path "$outDir\UnitTest.exe")) {
        throw "Failed"
    }

    Write-Host "Executing Unit Test ($platform) ..."
    Start-Process-And-Wait (,("$outDir\UnitTest.exe", "")) $false $outDir
}

function Run-Unit-Test {
    Run-Unit-Test-Platform x86 "$PSScriptRoot\..\..\Vlpp\Test\UnitTest\Release"
    Run-Unit-Test-Platform x64 "$PSScriptRoot\..\..\Vlpp\Test\UnitTest\x64\Release"
}

function Update-Vlpp {
    # Run test cases
    Run-Unit-Test

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

    # Run test cases again
    Run-Unit-Test
}