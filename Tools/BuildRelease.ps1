. $PSScriptRoot\Common.ps1

function Build-Release-Update() {
    Push-Location $PSScriptRoot\..\..\Release | Out-Null

    try {
        # Import
        Write-Host "Copying Source Code ..."
        New-Item .\Import\Skins -ItemType directory -ErrorAction SilentlyContinue | Out-Null
        New-Item .\Import\Skins\DarkSkin -ItemType directory -ErrorAction SilentlyContinue | Out-Null
        Copy-Item ..\Vlpp\Release\*.h .\Import
        Copy-Item ..\Vlpp\Release\*.cpp .\Import
        Copy-Item ..\Vlpp\Release\*.natvis .\Import
        Copy-Item ..\VlppOS\Release\*.h .\Import
        Copy-Item ..\VlppOS\Release\*.cpp .\Import
        Copy-Item ..\VlppRegex\Release\*.h .\Import
        Copy-Item ..\VlppRegex\Release\*.cpp .\Import
        Copy-Item ..\VlppReflection\Release\*.h .\Import
        Copy-Item ..\VlppReflection\Release\*.cpp .\Import
        Copy-Item ..\VlppParser\Release\*.h .\Import
        Copy-Item ..\VlppParser\Release\*.cpp .\Import
        Copy-Item ..\VlppParser2\Release\*.h .\Import
        Copy-Item ..\VlppParser2\Release\*.cpp .\Import
        Copy-Item ..\Workflow\Release\*.h .\Import
        Copy-Item ..\Workflow\Release\*.cpp .\Import
        Copy-Item ..\GacUI\Release\Gac*.h .\Import
        Copy-Item ..\GacUI\Release\Gac*.cpp .\Import
        Copy-Item ..\GacUI\Release\DarkSkin* .\Import\Skins\DarkSkin

        # Deploy
        Write-Host "Deploying Binaries ..."
        Copy-Item $PSScriptRoot\Reflection32.bin .\Tools
        Copy-Item $PSScriptRoot\Reflection64.bin .\Tools
        Copy-Item $PSScriptRoot\Gac*.ps1 .\Tools
        Copy-Item $PSScriptRoot\StartProcess.ps1 .\Tools

        # ControlTemplate\BlackSkin
        Write-Host "Deploying Tutorial\GacUI_ControlTemplate\BlackSkin ..."
        Push-Location $PSScriptRoot\..\..\Release\Tutorial\GacUI_ControlTemplate\BlackSkin\UI | Out-Null
        Remove-Item .\FullControlTest -Force -Recurse | Out-Null
        Copy-Item $PSScriptRoot\..\..\GacUI\Test\Resources\App\FullControlTest . -Recurse | Out-Null
        Pop-Location
    }
    catch {
        throw
    }
    finally {
        Pop-Location | Out-Null
    }
}

function Build-Release-Verify([Bool] $PopupFolders) {
    Push-Location $PSScriptRoot\..\..\Release | Out-Null

    try {
        # GacGen
        Write-Host "Compiling Resources ..."
        & $PSScriptRoot\GacClear.ps1 -FileName $PSScriptRoot\..\..\Release\Tutorial\GacUI.xml
        & $PSScriptRoot\GacBuild.ps1 -FileName $PSScriptRoot\..\..\Release\Tutorial\GacUI.xml

        # Debug Build
        Write-Host "Create Debug Builds ..."
        Get-ChildItem -Path .\Tutorial -Filter *.sln -Recurse | %{
            if (($_.FullName.IndexOf("\Lib\") -eq -1) -and ($_.FullName.IndexOf("\Console_Workflow\") -eq -1)) {
                Build-Sln $_.FullName "Debug" "Win32" "OutDir" "$($_.DirectoryName)\Debug\"
            }
        }

        # Check Debug Build
        Write-Host "Checking Debug Builds ..."
        $failed = $false
        Get-ChildItem -Path .\Tutorial -Filter *.vcxproj -Recurse | %{
            if (($_.FullName.IndexOf("\Lib\") -eq -1) -and ($_.FullName.IndexOf("\Console_Workflow\") -eq -1) -and ($_.FullName.IndexOf("\DocumentEditor\") -eq -1)) {
                $exe_file = "$($_.DirectoryName)\..\Debug\$($_.BaseName).exe"
                if (!(Test-Path $exe_file)) {
                    Write-Host "Binary not found: $exe_file" -ForegroundColor Red
                    $failed = $true
                }
            }
        }
        if ($failed) {
            throw "Failed"
        }

        # Release Build
        Write-Host "Create Release Builds ..."
        Get-ChildItem -Path .\Tutorial -Filter *.sln -Recurse | %{
            if (($_.FullName.IndexOf("\Lib\") -eq -1) -and ($_.FullName.IndexOf("\Console_Workflow\") -eq -1)) {
                Build-Sln $_.FullName "Release" "Win32" "OutDir" "$($_.DirectoryName)\Release\"
            }
        }

        if ($PopupFolders) {
            start .\Tutorial\GacUI_HelloWorlds\Release
            start .\Tutorial\GacUI_Layout\Release
            start .\Tutorial\GacUI_Controls\Release
            start .\Tutorial\GacUI_ControlTemplate\Release
            start .\Tutorial\GacUI_Xml\Release
        }
    }
    catch {
        throw
    }
    finally {
        Pop-Location | Out-Null
    }
}