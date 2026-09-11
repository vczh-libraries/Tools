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

function Update-GacUI-Skins {
    foreach ($skin in @("DarkSkin", "TuiSkin")) {
        Write-Host "Update GacUI::$skin ..."
        $skinRoot = [System.IO.Path]::GetFullPath("$PSScriptRoot\..\..\GacUI\Source\Skins\$skin")
        Get-ChildItem -LiteralPath $skinRoot -Filter *.xml -File | ForEach-Object {
            Remove-Item -LiteralPath $_.FullName
        }
        Copy-Item "$PSScriptRoot\..\..\GacUI\Test\Resources\App\$skin\*.xml" $skinRoot
        Push-Location $skinRoot
        try {
            & $PSScriptRoot\GacGen.ps1 -FileName Resource.xml
        }
        finally {
            Pop-Location
        }
    }
}

function Release-GacUI {
    Copy-Item $PSScriptRoot\..\..\GacUI\Test\Resources\Metadata\ReflectionCore32.bin $PSScriptRoot
    Copy-Item $PSScriptRoot\..\..\GacUI\Test\Resources\Metadata\ReflectionCore64.bin $PSScriptRoot
    Copy-Item $PSScriptRoot\..\..\GacUI\Test\Resources\Metadata\Reflection32.bin $PSScriptRoot
    Copy-Item $PSScriptRoot\..\..\GacUI\Test\Resources\Metadata\Reflection64.bin $PSScriptRoot

    # GacGen uses the packed core, compiler and reflection code, but no skins.
    Release-Project GacUI
    Build-Tool-GacGen

    # Generate skins with the current tool, then publish both skin configurations.
    Update-GacUI-Skins
    Release-Project GacUI
}
