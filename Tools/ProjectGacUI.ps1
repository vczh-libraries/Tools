function Test-GacUI-Platform($platform, $outDir) {
    Build-Sln $PSScriptRoot\..\..\GacUI\Test\GacUISrc\UnitTest\UnitTest.vcxproj Release $platform OutDir "`"$outDir\`""
    if (!(Test-Path "$outDir\UnitTest.exe")) {
        throw "Failed"
    }

    Write-Host "Executing Unit Test ($platform) ..."
    Start-Process-And-Wait (,("$outDir\UnitTest.exe", ""))
}

function Test-GacUI {
    Test-GacUI-Platform Win32 "$PSScriptRoot\..\..\GacUI\Test\GacUISrc\Release"
    # Test-GacUI-Platform x64 "$PSScriptRoot\..\..\GacUI\Test\GacUISrc\x64\Release"
}

function Build-GacUI {
    # Run test cases
    Test-GacUI
}

function Update-GacUI {
    # Import
    Import-Project GacUI ("Vlpp","VlppOS","VlppRegex","VlppReflection","VlppParser","Workflow")

    # Update Parsers
    Update-Parser $PSScriptRoot\..\..\GacUI\Source\Compiler\InstanceQuery\GuiInstanceQuery_Parser.parser.txt

    # Release
    Release-Project GacUI
    Build-Sln $PSScriptRoot\..\..\GacUI\Tools\GacGen\GacGen\GacGen.vcxproj Release Win32 OutDir "GacGen(x32)\"
    Test-Single-Binary-Rename "GacGen(x32)\GacGen.exe" GacGen32.exe
    Build-Sln $PSScriptRoot\..\..\GacUI\Tools\GacGen\GacGen\GacGen.vcxproj Release x64   OutDir "GacGen(x64)\"
    Test-Single-Binary-Rename "GacGen(x64)\GacGen.exe" GacGen64.exe

    # Update DarkSkin
    Write-Host "Update GacUI::DarkSkin ..."
    Push-Location $PSScriptRoot\..\..\GacUI\Source\Skins\DarkSkin | Out-Null
    try {
        Remove-Item *.xml
        Copy-Item ..\..\..\Test\GacUISrc\Host\Resources\DarkSkin\*.xml .
        & $PSScriptRoot\GacGen.ps1 -FileName Resource.xml
    }
    finally {
        Pop-Location
    }

    # Release
    Release-Project GacUI
}