param (
    [String]$Project = ""
)

. $PSScriptRoot\Common.ps1

# Prevent from displaying "Debug or Close Application" dialog on crash
$dontshowui_key = "HKCU:\Software\Microsoft\Windows\Windows Error Reporting"
$dontshowui_value = (Get-ItemProperty $dontshowui_key).DontShowUI
Set-ItemProperty $dontshowui_key -Name DontShowUI -Value 1
Push-Location $PSScriptRoot | Out-Null

$DocIndexOutputFolder = "$PSScriptRoot\..\..\Document\Tools\CppDoc\x64\Release"
$DocIndexExe = "$DocIndexOutputFolder\DocIndex.exe"
$DocIndexWD = "$PSScriptRoot\..\..\Document\Tools\CppDoc\DocIndex"
$HtmlSource = "$PSScriptRoot\..\..\Document\Tools\Demos\Gaclib"
$HtmlTarget = "$PSScriptRoot\..\..\vczh-libraries.github.io\CodeIndexDemo\Gaclib"

function DocGen-Update {
    Push-Location $PSScriptRoot\..\..\Document | Out-Null
    
    # Import
    Write-Host "Copying Source Code ..."
    Copy-Item ..\Vlpp\Release\*.h .\Import
    Copy-Item ..\Vlpp\Release\*.cpp .\Import
    Copy-Item ..\VlppOS\Release\*.h .\Import
    Copy-Item ..\VlppOS\Release\*.cpp .\Import
    Copy-Item ..\VlppRegex\Release\*.h .\Import
    Copy-Item ..\VlppRegex\Release\*.cpp .\Import
    Copy-Item ..\VlppReflection\Release\*.h .\Import
    Copy-Item ..\VlppReflection\Release\*.cpp .\Import
    Copy-Item ..\VlppParser\Release\*.h .\Import
    Copy-Item ..\VlppParser\Release\*.cpp .\Import
    Copy-Item ..\Workflow\Release\*.h .\Import
    Copy-Item ..\Workflow\Release\*.cpp .\Import
    Copy-Item ..\GacUI\Release\Gac*.h .\Import
    Copy-Item ..\GacUI\Release\Gac*.cpp .\Import
    Copy-Item ..\GacUI\Release\DarkSkin* .\Import

    Pop-Location | Out-Null
}

function DocGen-Build-Index {
    Build-Sln "$PSScriptRoot\..\..\Document\Tools\CppDoc\UnitTest_Cases\UnitTest_Cases.vcxproj" Debug Win32 OutDir "$PSScriptRoot\..\..\Document\Tools\CppDoc\Debug" $false
    Build-Sln "$PSScriptRoot\..\..\Document\Tools\CppDoc\DocIndex\DocIndex.vcxproj" Release x64 OutDir "$DocIndexOutputFolder"
    if (!(Test-Path "$DocIndexExe")) {
        throw "Failed to build DocIndex.vcxproj"
    }
}

function DocGen-Index {
    Start-Process-And-Wait (, ("$DocIndexExe", "")) $false "$DocIndexWD" $true
}

function DocGen-Verify {
    $ExampleOutput = "$PSScriptRoot\..\..\Document\Tools\Examples\Debug"
    Build-Sln "$PSScriptRoot\..\..\Document\Tools\Examples\Lib\Lib.vcxproj" Debug Win32 OutDir $ExampleOutput $true $false

    $projects = @(@("VLPP", "Vlpp"), @("VLPPOS", "VlppOS"), @("VLPPREGEX", "VlppRegex"), @("VLPPREFLECTION", "VlppReflection"), @("VLPPPARSER", "VlppParser"), @("VLPPPARSER2", "VlppParser2"), @("WORKFLOW", "Workflow"), @("GACUI", "GacUI"));
    foreach ($projectPair in $projects) {
        $projectId = $projectPair[0];
        $projectName = $projectPair[1];
        
        $exampleFolder = "$PSScriptRoot\..\..\Document\Tools\Demos\Gaclib\References\$projectId"
        $exampleFiles = Get-ChildItem -Path "$exampleFolder\*.ein.*.xml"
        foreach ($exampleFile in $exampleFiles) {
            $exampleFileName = $exampleFile.Name
            $resultFileName = $exampleFileName -replace ".ein.", ".eout." -replace ".xml", ".txt"
            Write-Host " $projectId\$exampleFileName" -ForegroundColor Blue -BackgroundColor White

            [Xml]$exampleXml = [System.IO.File]::ReadAllText("$exampleFolder\$exampleFileName")
            $exampleAllowOutput = (Select-Xml -Xml $exampleXml -XPath "//example/@output").Node.Value
            if ($exampleAllowOutput -ne "false") {
                $exampleCode = (Select-Xml -Xml $exampleXml -XPath "//example").Node.InnerText
                Set-Content -Path "$PSScriptRoot\..\..\Document\Tools\Examples\$projectName\Example.h" -Value $exampleCode

                if ((Test-Path "$ExampleOutput\$projectName.exe")) {
                    Remove-Item -Path "$ExampleOutput\$projectName.exe" | Out-Null
                }
                
                Build-Sln "$PSScriptRoot\..\..\Document\Tools\Examples\$projectName\$projectName.vcxproj" Debug Win32 OutDir $ExampleOutput $false $false
                if ((Test-Path "$ExampleOutput\$projectName.exe")) {
                    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
                    $startInfo.FileName = "$ExampleOutput\$projectName.exe"
                    $startInfo.RedirectStandardError = $true
                    $startInfo.RedirectStandardOutput = $true
                    $startInfo.UseShellExecute = $false

                    $processObject = New-Object System.Diagnostics.Process
                    $processObject.StartInfo = $startInfo
                    $processObject.Start() | Out-Null
                    $processObject.WaitForExit()
                    
                    [System.IO.File]::WriteAllText("$exampleFolder\$resultFileName", $processObject.StandardOutput.ReadToEnd())
                } else {
                    Write-Host "    FAILED TO COMPILE" -ForegroundColor Red
                }
            }
        }
    }
}

function DocGen-Copy {
    Write-Host "Cleaning $HtmlTarget ..."
    Remove-Item -Recurse -Force $HtmlTarget | Out-Null
    Write-Host "Recreating $HtmlTarget ..."
    New-Item -ItemType Directory -Path $HtmlTarget | Out-Null
    New-Item -ItemType Directory -Path "$HtmlTarget\SourceFiles" | Out-Null
    New-Item -ItemType Directory -Path "$HtmlTarget\SymbolIndexFragments" | Out-Null
    Write-Host "Copying $HtmlSource to $HtmlTarget ..."

    Copy-Item -Path "$HtmlSource\FileIndex.html" -Destination $HtmlTarget | Out-Null
    Copy-Item -Path "$HtmlSource\SymbolIndex.html" -Destination $HtmlTarget | Out-Null
    Copy-Item -Path "$HtmlSource\SourceFiles\*" -Destination "$HtmlTarget\SourceFiles" -Recurse | Out-Null
    Copy-Item -Path "$HtmlSource\SymbolIndexFragments\*" -Destination "$HtmlTarget\SymbolIndexFragments" -Recurse | Out-Null
}

try {
    switch ($Project) {
        "" {
            DocGen-Build-Index
            DocGen-Index
            DocGen-Verify
        }
        "update" {
            DocGen-Update
        }
        "build-index" {
            DocGen-Build-Index
        }
        "index" {
            DocGen-Index
        }
        "verify" {
            DocGen-Verify
        }
        "copy" {
            DocGen-Copy
        }
        default {
            throw "Unknown project `"$Project`". Project can be either unspecified (running build-index, index, verify) or one of the following value: update, build-index, index, verify, copy."
        }
    }
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Pop-Location | Out-Null
Set-ItemProperty $dontshowui_key -Name DontShowUI -Value $dontshowui_value
[Console]::ResetColor()