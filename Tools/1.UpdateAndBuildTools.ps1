. $PSScriptRoot\Common.ps1

function Update-And-Build-Tools {
    Remove-Item .\*.exe -Force | Out-Null
    Remove-Item .\*.dll -Force | Out-Null
    Remove-Item .\.Output -Force -Recurse | Out-Null
    New-Item .\.Output -ItemType directory | Out-Null

    # Build CodePack.exe
    Build-Sln ..\..\Vlpp\Tools\CodePack\CodePack\CodePack.vcxproj Release x86
    Test-Single-Binary CodePack.exe

    # Release Vlpp
    Release-Project Vlpp

    # Build ParserGen.exe
    Build-Sln ..\..\Vlpp\Tools\ParserGen\ParserGen\ParserGen.vcxproj Release x86
    Test-Single-Binary ParserGen.exe

    # Update Parsers
    Update-Parser ..\..\Vlpp\Test\Source\Parser.Calculator\Parser.Calculator.parser.txt
    Update-Parser ..\..\Vlpp\Source\Parsing\Xml\ParsingXml.parser.txt
    Update-Parser ..\..\Vlpp\Source\Parsing\Json\ParsingJson.parser.txt
    Update-Parser ..\..\Workflow\Source\Expression\WfExpression.parser.txt
    Update-Parser ..\..\GacUI\Source\Compiler\InstanceQuery\GuiInstanceQuery_Parser.parser.txt

    # Release Vlpp
    Release-Project Vlpp

    # Release Workflow
    Import-Project Workflow ("Vlpp")
    Release-Project Workflow
    Build-Sln ..\..\Workflow\Tools\CppMerge\CppMerge\CppMerge.vcxproj Release x86
    Test-Single-Binary CppMerge.exe

    # Release GacUI
    Import-Project GacUI ("Vlpp","Workflow")
    Release-Project GacUI
    Build-Sln ..\..\GacUI\Tools\GacGen\GacGen\GacGen.vcxproj Release x86 OutDir "GacGen(x32)\"
    Test-Single-Binary-Rename "GacGen(x32)\GacGen.exe" GacGen32.exe
    Build-Sln ..\..\GacUI\Tools\GacGen\GacGen\GacGen.vcxproj Release x64 OutDir "GacGen(x64)\"
    Test-Single-Binary-Rename "GacGen(x64)\GacGen.exe" GacGen64.exe
}

function Update-GacUI-Skins {
    # Update DarkSkin
    Write-Host "Update GacUI::DarkSkin ..."
    Push-Location ..\..\GacUI\Source\Skins\DarkSkin | Out-Null
    try {
        Remove-Item *.xml
        Copy-Item ..\..\..\Test\GacUISrc\Host\Resources\DarkSkin\*.xml .
        & $PSScriptRoot\GacGen.ps1 -FileName Resource.xml
    }
    finally {
        Pop-Location
    }

    # Release GacUI
    Release-Project GacUI
}

Push-Location $PSScriptRoot | Out-Null

Write-Host "Cleaning ..."

try {
    Update-And-Build-Tools
    Update-GacUI-Skins
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Pop-Location | Out-Null
[Console]::ResetColor()