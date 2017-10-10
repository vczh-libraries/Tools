. $PSScriptRoot\Common.ps1

function Update-GacUI {
    # Update Parsers
    Update-Parser ..\..\GacUI\Source\Compiler\InstanceQuery\GuiInstanceQuery_Parser.parser.txt

    # Release GacUI
    Import-Project GacUI ("Vlpp","Workflow")
    Release-Project GacUI
    Build-Sln ..\..\GacUI\Tools\GacGen\GacGen\GacGen.vcxproj Release x86 OutDir "GacGen(x32)\"
    Test-Single-Binary-Rename "GacGen(x32)\GacGen.exe" GacGen32.exe
    Build-Sln ..\..\GacUI\Tools\GacGen\GacGen\GacGen.vcxproj Release x64 OutDir "GacGen(x64)\"
    Test-Single-Binary-Rename "GacGen(x64)\GacGen.exe" GacGen64.exe

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