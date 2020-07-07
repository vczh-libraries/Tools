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
    Build-Sln "$PSScriptRoot\..\..\Document\Tools\Examples\Lib\Lib.vcxproj" Debug Win32 OutDir $ExampleOutput

    $projects = (, ("VLPP", "Vlpp"));
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
            $exampleCode = (Select-Xml -Xml $exampleXml -XPath "//example").Node.InnerText
            Set-Content -Path "$PSScriptRoot\..\..\Document\Tools\Examples\$projectName\Example.h" -Value $exampleCode

            Remove-Item -Path "$ExampleOutput\$projectName.exe" | Out-Null
            Build-Sln "$PSScriptRoot\..\..\Document\Tools\Examples\$projectName\$projectName.vcxproj" Debug Win32 OutDir $ExampleOutput $false $false
            if (!(Test-Path "$ExampleOutput\$projectName.exe")) {
                Write-Host "    FAILED TO COMPILE" -ForegroundColor Red
            }
        }
    }
}

function DocGen-BuildWebsite {
    throw "Not implemented."
}

function DocGen-Copy {
    throw "Not implemented."
}

try {
    switch ($Project) {
        "build-index" {
            DocGen-Build-Index
        }
        "index" {
            DocGen-Index
        }
        "verify" {
            DocGen-Verify
        }
        "build-website" {
            DocGen-BuildWebsite
        }
        "copy" {
            DocGen-Copy
        }
        default {
            throw "Unknown project `"$Project`". Project can be either unspecified or one of the following value: build-index, index, verify, build-website, copy."
        }
    }
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Pop-Location | Out-Null
Set-ItemProperty $dontshowui_key -Name DontShowUI -Value $dontshowui_value
[Console]::ResetColor()