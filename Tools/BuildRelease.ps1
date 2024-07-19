. $PSScriptRoot\Common.ps1

function Build-Release-Update() {
    Push-Location $PSScriptRoot\..\..\Release | Out-Null

    try {
        # Import
        Write-Host "Copying Source Code ..."
        New-Item .\Import\Skins -ItemType directory -ErrorAction SilentlyContinue | Out-Null
        New-Item .\Import\Skins\DarkSkin -ItemType directory -ErrorAction SilentlyContinue | Out-Null
        New-Item .\Import\Metadata -ItemType directory -ErrorAction SilentlyContinue | Out-Null
        New-Item .\Import\Metadata\RemoteProtocol -ItemType directory -ErrorAction SilentlyContinue | Out-Null
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
        Copy-Item ..\GacUI\Source\PlatformProviders\Remote\Protocol\Protocol*.txt .\Import\Metadata\RemoteProtocol
        Copy-Item ..\GacUI\Source\PlatformProviders\Remote\Protocol\Metadata\*.json .\Import\Metadata\RemoteProtocol.json

        # Copy Tools Sources
        Copy-Item ..\VlppParser2\Tools\CodePack\CodePack\*.h .\Tools\Executables\CodePack
        Copy-Item ..\VlppParser2\Tools\CodePack\CodePack\*.cpp .\Tools\Executables\CodePack
        Copy-Item ..\VlppParser2\Tools\GlrParserGen\GlrParserGen\*.h .\Tools\Executables\GlrParserGen
        Copy-Item ..\VlppParser2\Tools\GlrParserGen\GlrParserGen\*.cpp .\Tools\Executables\GlrParserGen
        Copy-Item ..\Workflow\Tools\CppMerge\CppMerge\*.h .\Tools\Executables\CppMerge
        Copy-Item ..\Workflow\Tools\CppMerge\CppMerge\*.cpp .\Tools\Executables\CppMerge
        Copy-Item ..\Workflow\Source\Cpp\WfMergeCpp.h .\Tools\Executables\CppMerge
        Copy-Item ..\Workflow\Source\Cpp\WfMergeCpp.cpp .\Tools\Executables\CppMerge
        Copy-Item ..\GacUI\Tools\GacGen\GacGen\*.h .\Tools\Executables\GacGen
        Copy-Item ..\GacUI\Tools\GacGen\GacGen\*.cpp .\Tools\Executables\GacGen

        # Build Tools
        Build-Sln .\Tools\Executables\CodePack\CodePack.vcxproj         Release x86 -OutputFolder $PSScriptRoot\..\..\Release\Tools\Executables\Release
        Build-Sln .\Tools\Executables\GlrParserGen\GlrParserGen.vcxproj Release x86 -OutputFolder $PSScriptRoot\..\..\Release\Tools\Executables\Release
        Build-Sln .\Tools\Executables\CppMerge\CppMerge.vcxproj         Release x86 -OutputFolder $PSScriptRoot\..\..\Release\Tools\Executables\Release
        Build-Sln .\Tools\Executables\GacGen\GacGen.vcxproj             Release x86 -OutputFolder $PSScriptRoot\..\..\Release\Tools\Executables\Release

        # Deploy
        Write-Host "Deploying Binaries ..."
        Remove-Item .\Tools\*.exe
        Remove-Item .\Tools\*.bin
        Remove-Item .\Tools\Gac*.ps1
        Remove-Item .\Tools\StartProcess.ps1
        Remove-Item .\Tools\Executables\vl\makefile-cpp
        .\Tools\CopyExecutables.ps1
        Copy-Item $PSScriptRoot\Reflection32.bin .\Tools
        Copy-Item $PSScriptRoot\Reflection64.bin .\Tools
        Copy-Item $PSScriptRoot\Gac*.ps1 .\Tools
        Copy-Item $PSScriptRoot\StartProcess.ps1 .\Tools
        Copy-Item $PSScriptRoot\..\Ubuntu\vl\makefile-cpp .\Tools\Executables\vl

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

function Build-Release-Verify-Workflow {
    Push-Location $PSScriptRoot\..\..\Release | Out-Null

    try {
        # Debug Build
        Write-Host "Create Debug Builds ..."
        Build-Sln .\Tutorial\Console_Workflow\Console_Workflow.sln Debug x86 -OutputFolder $PSScriptRoot\..\..\Release\\Tutorial\Console_Workflow\Debug\

        # Codegen
        .\Tutorial\Console_Workflow\Debug\W05_Compile.exe
        
        # Debug Build After Codegen
        Write-Host "Create Debug Builds After Codegen..."
        Build-Sln .\Tutorial\Console_Workflow\Console_Workflow.sln Debug x86 -OutputFolder $PSScriptRoot\..\..\Release\\Tutorial\Console_Workflow\Debug\
    }
    catch {
        throw
    }
    finally {
        Pop-Location | Out-Null
    }
}

function Build-Release-Verify-GacUI-Xml {
    Push-Location $PSScriptRoot\..\..\Release | Out-Null

    try {
        # Document Tutorial
        Write-Host "Compiling Resources (GacUI Document Tutorials)..."
        & $PSScriptRoot\..\..\Release\Tools\GacClear.ps1 -FileName $PSScriptRoot\..\..\Release\SampleForDoc\GacUI\XmlRes\GacUI.xml
        & $PSScriptRoot\..\..\Release\Tools\GacBuild.ps1 -FileName $PSScriptRoot\..\..\Release\SampleForDoc\GacUI\XmlRes\GacUI.xml

        # Tutorial
        Write-Host "Compiling Resources (GacUI Tutorials)..."
        & $PSScriptRoot\..\..\Release\Tools\GacClear.ps1 -FileName $PSScriptRoot\..\..\Release\Tutorial\GacUI.xml
        & $PSScriptRoot\..\..\Release\Tools\GacBuild.ps1 -FileName $PSScriptRoot\..\..\Release\Tutorial\GacUI.xml
    }
    catch {
        throw
    }
    finally {
        Pop-Location | Out-Null
    }
}

function Build-Release-Verify-GacUI-Cpp([Bool] $PopupFolders) {
    Push-Location $PSScriptRoot\..\..\Release | Out-Null

    try {
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
            start .\Tutorial\GacUI_Windows\Release
        }
    }
    catch {
        throw
    }
    finally {
        Pop-Location | Out-Null
    }
}