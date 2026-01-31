function Test-GacUI-Platform($subProjectName, $platform, $outDir) {
    Build-Sln $PSScriptRoot\..\..\GacUI\Test\GacUISrc\$subProjectName\$subProjectName.vcxproj Release $platform OutDir "`"$outDir\`""
    if (!(Test-Path "$outDir\$subProjectName.exe")) {
        throw "Failed"
    }

    Write-Host "Executing Unit Test ($platform) ..."
    Start-Process-And-Wait (,("$outDir\$subProjectName.exe", ""))
}

function Test-GacUI-SubProject($subProjectName) {
    Test-GacUI-Platform $subProjectName Win32 "$PSScriptRoot\..\..\GacUI\Test\GacUISrc\Release"
    Test-GacUI-Platform $subProjectName x64 "$PSScriptRoot\..\..\GacUI\Test\GacUISrc\x64\Release"
}

function Build-GacUI {
    # Update metadata
    Test-GacUI-SubProject "Metadata_Generate"
    Test-GacUI-SubProject "Metadata_Test"

    # Run test cases
    Test-GacUI-SubProject "UnitTest"
}

function Import-GacUI {
    # Import
    Import-Project GacUI ("Vlpp","VlppOS","VlppRegex","VlppReflection","VlppParser2","Workflow")

    # Update Parsers
    Update-Parser2 $PSScriptRoot\..\..\GacUI\Source\Compiler\InstanceQuery\Syntax\Parser.xml
    Update-Parser2 $PSScriptRoot\..\..\GacUI\Source\Compiler\RemoteProtocol\Syntax\Parser.xml
}

function Build-Tool-GacGen {
    Build-Sln $PSScriptRoot\..\..\GacUI\Tools\GacGen\GacGen\GacGen.vcxproj Release Win32
    Test-Single-Binary GacGen.exe
}

function Release-GacUI {
    # Release
    Release-Project GacUI
    Build-Tool-GacGen

    Copy-Item $PSScriptRoot\..\..\GacUI\Test\Resources\Metadata\ReflectionCore32.bin $PSScriptRoot
    Copy-Item $PSScriptRoot\..\..\GacUI\Test\Resources\Metadata\ReflectionCore64.bin $PSScriptRoot
    Copy-Item $PSScriptRoot\..\..\GacUI\Test\Resources\Metadata\Reflection32.bin $PSScriptRoot
    Copy-Item $PSScriptRoot\..\..\GacUI\Test\Resources\Metadata\Reflection64.bin $PSScriptRoot

    # Update DarkSkin
    Write-Host "Update GacUI::DarkSkin ..."
    Push-Location $PSScriptRoot\..\..\GacUI\Source\Skins\DarkSkin | Out-Null
    try {
        Remove-Item *.xml
        Copy-Item ..\..\..\Test\Resources\App\DarkSkin\*.xml .
        & $PSScriptRoot\GacGen.ps1 -FileName Resource.xml
    }
    finally {
        Pop-Location
    }

    # Release again
    Release-Project GacUI
}