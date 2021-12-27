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

function Update-Binaries-And-Bundle {
    Write-Title "    Cleaning ..."
    Remove-Item .\*.exe -Force | Out-Null
    Remove-Item .\*.dll -Force | Out-Null
    Remove-Item .\.Output -Force -Recurse -ErrorAction SilentlyContinue | Out-Null
    New-Item .\.Output -ItemType directory -ErrorAction SilentlyContinue | Out-Null
    
    Write-Title "    Building CodePack ..."
    Build-Tool-CodePack
    
    Write-Title "    Updating Vlpp ..."
    Update-Vlpp
    Update-VlppOS
    Update-VlppRegex
    Update-VlppReflection
    Update-VlppParser
    Update-VlppParser2
    
    Write-Title "    Updating Workflow ..."
    Update-Workflow
    
    Write-Title "    Updating GacUI ..."
    Update-GacUI
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
            Write-Title Build-Vlpp
            Build-Vlpp; [Console]::ResetColor()

            $time_vlpp_os = [DateTime]::Now
            Write-Title Build-VlppOS
            Build-VlppOS; [Console]::ResetColor()

            $time_vlpp_regex = [DateTime]::Now
            Write-Title Build-VlppRegex
            Build-VlppRegex; [Console]::ResetColor()

            $time_vlpp_reflection = [DateTime]::Now
            Write-Title Build-VlppReflection
            Build-VlppReflection; [Console]::ResetColor()

            $time_vlpp_parser = [DateTime]::Now
            Write-Title Build-VlppParser
            Build-VlppParser; [Console]::ResetColor()

            $time_vlpp_parser2 = [DateTime]::Now
            Write-Title Build-VlppParser2
            Build-VlppParser2; [Console]::ResetColor()

            $time_workflow = [DateTime]::Now
            Write-Title Build-Workflow
            Build-Workflow; [Console]::ResetColor()

            $time_gacui = [DateTime]::Now
            Write-Title Build-GacUI
            Build-GacUI; [Console]::ResetColor()

            $time_update = [DateTime]::Now
            Write-Title Update-Binaries-And-Bundle
            Update-Binaries-And-Bundle; [Console]::ResetColor()

            $time_release = [DateTime]::Now
            Write-Title Build-Release
            Build-Release $False; [Console]::ResetColor()

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
        }
        "Vlpp" {
            Write-Title Build-Vlpp
            Build-Vlpp
        }
        "VlppOS" {
            Write-Title Build-VlppOS
            Build-VlppOS
        }
        "VlppRegex" {
            Write-Title Build-VlppRegex
            Build-VlppRegex
        }
        "VlppReflection" {
            Write-Title Build-VlppReflection
            Build-VlppReflection
        }
        "VlppParser" {
            Write-Title Build-VlppParser
            Build-VlppParser
        }
        "VlppParser2" {
            Write-Title Build-VlppParser2
            Build-VlppParser2
        }
        "Workflow" {
            Write-Title Build-Workflow
            Build-Workflow
        }
        "GacUI" {
            Write-Title Build-GacUI
            Build-GacUI
        }
        "Update" {
            Write-Title Update-Binaries-And-Bundle
            Update-Binaries-And-Bundle
            Write-Title "    Check Repo ..."
            & $PSScriptRoot\CheckRepo.ps1 CheckAll
        }
        "Release" {
            Write-Title Build-Release
            Build-Release $True;
            Write-Title "    Check Repo ..."
            & $PSScriptRoot\CheckRepo.ps1 CheckAll
        }
        default {
            throw "Unknown project `"$Project`". Project can be either unspecified or one of the following value: Vlpp, VlppOS, VlppRegex, VlppReflection, VlppParser, VlppParser2, Workflow, GacUI, Update, Release."
        }
    }
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Pop-Location | Out-Null
Set-ItemProperty $dontshowui_key -Name DontShowUI -Value $dontshowui_value
[Console]::ResetColor()