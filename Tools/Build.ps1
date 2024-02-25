param (
    [String]$Project = ""
)

. $PSScriptRoot\Common.ps1
. $PSScriptRoot\ProjectVlpp.ps1
. $PSScriptRoot\ProjectVlppOS.ps1
. $PSScriptRoot\ProjectVlppRegex.ps1
. $PSScriptRoot\ProjectVlppReflection.ps1
. $PSScriptRoot\ProjectVlppParser.ps1
. $PSScriptRoot\ProjectVlppParser2.ps1
. $PSScriptRoot\ProjectWorkflow.ps1
. $PSScriptRoot\ProjectGacUI.ps1
. $PSScriptRoot\BuildRelease.ps1

function Write-Title($text) {
    Write-Host $text -ForegroundColor Blue -BackgroundColor White
}

function Update-Binaries-Prepare-CodePack {
    Write-Title "    Preparing CodePack ..."
    if (-not [System.IO.File]::Exists("$PSScriptRoot\CodePack.backup.exe")) {
        if (-not [System.IO.File]::Exists("$PSScriptRoot\CodePack.exe")) {
            if (-not [System.IO.File]::Exists("$PSScriptRoot\.Output\CodePack.exe")) {
                Build-Tool-CodePack
            } else {
                Test-Single-Binary CodePack.exe
            }
        }
        Copy $PSScriptRoot\CodePack.exe $PSScriptRoot\CodePack.backup.exe
    }
}

function Update-Binaries-And-Bundle {
    Write-Title "    Cleaning ..."
    Remove-Item .\CodePack.exe -Force | Out-Null
    Remove-Item .\CppMerge.exe -Force | Out-Null
    Remove-Item .\ParserGen.exe -Force | Out-Null
    Remove-Item .\GlrParserGen.exe -Force | Out-Null
    Remove-Item .\GacGen.exe -Force | Out-Null
    Remove-Item .\Reflection32.bin -Force | Out-Null
    Remove-Item .\Reflection64.bin -Force | Out-Null
    Remove-Item .\ReflectionCore32.bin -Force | Out-Null
    Remove-Item .\ReflectionCore64.bin -Force | Out-Null
    Remove-Item .\.Output -Force -Recurse -ErrorAction SilentlyContinue | Out-Null
    New-Item .\.Output -ItemType directory -ErrorAction SilentlyContinue | Out-Null
    
    Update-Binaries-Prepare-CodePack
    
    Write-Title "    Updating Vlpp ..."
    Update-Vlpp
    Update-VlppOS
    Update-VlppRegex
    Update-VlppReflection
    Update-VlppParser
    Update-VlppParser2
    
    Update-Binaries-Prepare-CodePack
    
    Write-Title "    Updating Workflow ..."
    Update-Workflow
    
    Write-Title "    Updating GacUI ..."
    Update-GacUI
}

function Update-Repo-Commit-Records {
    $projects = @("Vlpp","VlppOS","VlppRegex","VlppReflection","VlppParser","VlppParser2","Workflow","GacUI")
    $content = "# Vczh Library++`n`n";
    $content += "Please [read the document](http://vczh-libraries.github.io/doc/current/home/download.html) before using source files under this folder.`n`n"
    $content += "## Commits associated with this release`n`n";

    Write-Title "    Updating Commit Records ..."
    foreach ($project in $projects) {
        Set-Location $PSScriptRoot\..\..\$project
        $commit = $(git rev-parse HEAD)
        $record = "- **$project**: [$commit](https://github.com/vczh-libraries/$project/tree/$commit)"
        $content += "$record`n"
    }

    Set-Content -Path "$PSScriptRoot\..\..\Release\Import\README.md" -Value $content
}

function Task-Vlpp {
    Write-Title Build-Vlpp
    Build-Vlpp
}

function Task-VlppOS {
    Write-Title Build-VlppOS
    Build-VlppOS
}

function Task-VlppRegex {
    Write-Title Build-VlppRegex
    Build-VlppRegex
}

function Task-VlppReflection {
    Write-Title Build-VlppReflection
    Build-VlppReflection
}

function Task-VlppParser {
    Write-Title Build-VlppParser
    Build-VlppParser
}

function Task-VlppParser2 {
    Write-Title Build-VlppParser2
    Build-VlppParser2
}

function Task-Workflow {
    Write-Title Build-Workflow
    Build-Workflow
}

function Task-GacUI {
    Write-Title Build-GacUI
    Build-GacUI
}

function Task-Update-Repos {
    Write-Title Update-Binaries-And-Bundle
    Update-Binaries-And-Bundle
}

function Task-Update-ReleaseRepo {
    Write-Title Build-Release
    Build-Release-Update
}

function Task-Verify-Workflow {
    Write-Title Build-Release-Verify-Workflow
    Build-Release-Verify-Workflow
}

function Task-Verify-Xml {
    Write-Title Build-Release-Verify-GacUI-Xml
    Build-Release-Verify-GacUI-Xml
}

function Task-Verify-Cpp {
    Write-Title Build-Release-Verify-GacUI-Cpp
    Build-Release-Verify-GacUI-Cpp $False
}

function Task-Verify-Cpp-OpenFolders {
    Write-Title Build-Release-Verify-GacUI-Cpp
    Build-Release-Verify-GacUI-Cpp $True
}

function Task-Check-Unsubmitted-Repos {
    Write-Title "    Check Repo ..."
    & $PSScriptRoot\CheckRepo.ps1 CheckAll
}

# Prevent from displaying "Debug or Close Application" dialog on crash
$dontshowui_key = "HKCU:\Software\Microsoft\Windows\Windows Error Reporting"
$dontshowui_value = (Get-ItemProperty $dontshowui_key).DontShowUI
Set-ItemProperty $dontshowui_key -Name DontShowUI -Value 1
Push-Location $PSScriptRoot | Out-Null

try {
    switch ($Project) {
        "" {
            $time_vlpp = [DateTime]::Now
            Task-Vlpp; [Console]::ResetColor()

            $time_vlpp_os = [DateTime]::Now
            Task-VlppOS; [Console]::ResetColor()

            $time_vlpp_regex = [DateTime]::Now
            Task-VlppRegex; [Console]::ResetColor()

            $time_vlpp_reflection = [DateTime]::Now
            Task-VlppReflection; [Console]::ResetColor()

            $time_vlpp_parser = [DateTime]::Now
            Task-VlppParser; [Console]::ResetColor()

            $time_vlpp_parser2 = [DateTime]::Now
            Task-VlppParser2; [Console]::ResetColor()

            $time_workflow = [DateTime]::Now
            Task-Workflow; [Console]::ResetColor()

            $time_gacui = [DateTime]::Now
            Task-GacUI; [Console]::ResetColor()

            $time_update = [DateTime]::Now
            Task-Update-Repos; [Console]::ResetColor()

            $time_release = [DateTime]::Now
            Task-Update-ReleaseRepo; [Console]::ResetColor()
            Task-Verify-Workflow; [Console]::ResetColor()
            Task-Verify-Xml; [Console]::ResetColor()
            Task-Verify-Cpp; [Console]::ResetColor()

            $time_finished = [DateTime]::Now
            Write-Title Finished!
            Write-Host "Vlpp         : $time_vlpp, Elapsed: $((New-TimeSpan $time_vlpp $time_vlpp_os).ToString())"
            Write-Host "  OS         : $time_vlpp_os, Elapsed: $((New-TimeSpan $time_vlpp_os $time_vlpp_regex).ToString())"
            Write-Host "  Regex      : $time_vlpp_regex, Elapsed: $((New-TimeSpan $time_vlpp_regex $time_vlpp_reflection).ToString())"
            Write-Host "  Reflection : $time_vlpp_reflection, Elapsed: $((New-TimeSpan $time_vlpp_reflection $time_vlpp_parser).ToString())"
            Write-Host "  Parser     : $time_vlpp_parser, Elapsed: $((New-TimeSpan $time_vlpp_parser $time_vlpp_parser2).ToString())"
            Write-Host "  Parser2    : $time_vlpp_parser, Elapsed: $((New-TimeSpan $time_vlpp_parser2 $time_workflow).ToString())"
            Write-Host "Workflow     : $time_workflow, Elapsed: $((New-TimeSpan $time_workflow $time_gacui).ToString())"
            Write-Host "GacUI        : $time_gacui, Elapsed: $((New-TimeSpan $time_gacui $time_update).ToString())"
            Write-Host "Update       : $time_update, Elapsed: $((New-TimeSpan $time_update $time_release).ToString())"
            Write-Host "Release      : $time_release, Elapsed: $((New-TimeSpan $time_release $time_finished).ToString())"
            Write-Host "Total        : $((New-TimeSpan $time_vlpp $time_finished).ToString())"
            
            Task-Check-Unsubmitted-Repos
        }
        "Vlpp" {
            Task-Vlpp
        }
        "VlppOS" {
            Task-VlppOS
        }
        "VlppRegex" {
            Task-VlppRegex
        }
        "VlppReflection" {
            Task-VlppReflection
        }
        "VlppParser" {
            Task-VlppParser
        }
        "VlppParser2" {
            Task-VlppParser2
        }
        "Workflow" {
            Task-Workflow
        }
        "GacUI" {
            Task-GacUI
        }
        "UnitTest" {
            Task-Vlpp
            Task-VlppOS
            Task-VlppRegex
            Task-VlppReflection
            Task-VlppParser
            Task-VlppParser2
            Task-Workflow
            Task-GacUI
            Task-Check-Unsubmitted-Repos
        }
        "Update-Prepare-CodePack" {
            Update-Binaries-Prepare-CodePack
        }
        "Update" {
            Task-Update-Repos
            Task-Check-Unsubmitted-Repos
        }
        "UpdateCommits" {
            Write-Title Update-Repo-Commit-Records
            Update-Repo-Commit-Records
            Task-Check-Unsubmitted-Repos
        }
        "Release" {
            Task-Update-ReleaseRepo
            Task-Verify-Workflow
            Task-Verify-Xml
            Task-Verify-Cpp-OpenFolders
            Task-Check-Unsubmitted-Repos
        }
        "UpdateRelease" {
            Task-Update-ReleaseRepo
            Task-Check-Unsubmitted-Repos
        }
        "VerifyReleaseWorkflow" {
            Task-Verify-Workflow
            Task-Check-Unsubmitted-Repos
        }
        "VerifyReleaseXml" {
            Task-Verify-Xml
            Task-Check-Unsubmitted-Repos
        }
        "VerifyReleaseCpp" {
            Task-Verify-Cpp-OpenFolders
            Task-Check-Unsubmitted-Repos
        }
        "VerifyRelease" {
            Task-Verify-Workflow
            Task-Verify-Xml
            Task-Verify-Cpp-OpenFolders
            Task-Check-Unsubmitted-Repos
        }
        default {
            throw "Unknown project `"$Project`". Project can be either unspecified or one of the following value: UnitTest(Vlpp, VlppOS, VlppRegex, VlppReflection, VlppParser, VlppParser2, Workflow, GacUI), Update, UpdateCommits, Release(UpdateRelease + VerifyRelease(VerifyReleaseWorkflow + VerifyReleaseXml + VerifyReleaseCpp))."
        }
    }
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Pop-Location | Out-Null
Set-ItemProperty $dontshowui_key -Name DontShowUI -Value $dontshowui_value
[Console]::ResetColor()