function Test-GacUI-Platform-Init($platform) {
    Build-Sln $PSScriptRoot\..\..\GacUI\Test\GacUISrc\GacUISrc.sln Release $platform
}

function Test-GacUI-Platform($subProjectName, $platform, $outDir) {
    Build-Sln $PSScriptRoot\..\..\GacUI\Test\GacUISrc\GacUISrc.sln Release $platform -Rebuild $false
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

function Test-GacUI-Init {
    Test-GacUI-Platform-Init Win32
    Test-GacUI-Platform-Init x64
}

function Build-GacUI {
    # Update metadata
    Test-GacUI-Init
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
    Build-Sln $PSScriptRoot\..\..\GacUI\Tools\GacGen\GacGen.sln Release Win32
    Copy-Tool-Binary $PSScriptRoot\..\..\GacUI\Tools\GacGen\Bin\GacGen.exe $PSScriptRoot\.Output\GacGen.exe
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

    # Update TuiSkin from the same authored resources used by GacUI_Compiler.
    Write-Host "Update GacUI::TuiSkin ..."
    $tuiSkinRoot = [System.IO.Path]::GetFullPath("$PSScriptRoot\..\..\GacUI\Source\Skins\TuiSkin")
    $tuiSkinSource = Join-Path $tuiSkinRoot "Source"
    [System.IO.Directory]::CreateDirectory($tuiSkinSource) | Out-Null
    Get-ChildItem -LiteralPath $tuiSkinRoot -Filter *.xml -File | ForEach-Object {
        Remove-Item -LiteralPath $_.FullName
    }
    Copy-Item "$PSScriptRoot\..\..\GacUI\Test\Resources\App\TuiSkin\*.xml" $tuiSkinRoot
    Push-Location $tuiSkinRoot
    try {
        & $PSScriptRoot\GacGen.ps1 -FileName Resource.xml
    }
    finally {
        Pop-Location
    }
    foreach ($extension in @("h", "cpp")) {
        $config = [System.IO.File]::ReadAllText("$PSScriptRoot\..\..\GacUI\Test\GacUISrc\Generated_TuiSkin\TuiSkinConfig.$extension")
        $config = $config.Replace('../../../Source/GacUI.h', '../../../GacUI.h')
        $config = $config.Replace('Source_x64/TuiSkin.h', 'TuiSkin.h').Replace('Source_x86/TuiSkin.h', 'TuiSkin.h')
        [System.IO.File]::WriteAllText((Join-Path $tuiSkinSource "TuiSkinConfig.$extension"), $config)
    }

    # Release again
    Release-Project GacUI
}
