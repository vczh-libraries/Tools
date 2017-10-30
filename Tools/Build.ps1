param (
    [String]$Project = ""
)

. $PSScriptRoot\Common.ps1
. $PSScriptRoot\UpdateVlpp.ps1
. $PSScriptRoot\UpdateWorkflow.ps1
. $PSScriptRoot\UpdateGacUI.ps1
. $PSScriptRoot\BuildRelease.ps1
. $PSScriptRoot\BuildDocument.ps1

function Clean-Binaries {
    Write-Host "Cleaning ..."
    Remove-Item .\*.exe -Force | Out-Null
    Remove-Item .\*.dll -Force | Out-Null
    Remove-Item .\.Output -Force -Recurse -ErrorAction SilentlyContinue | Out-Null
    New-Item .\.Output -ItemType directory -ErrorAction SilentlyContinue | Out-Null
}

# Prevent from displaying "Debug or Close Application" dialog on crash
$dontshowui_key = "HKCU:\Software\Microsoft\Windows\Windows Error Reporting"
$dontshowui_value = (Get-ItemProperty $dontshowui_key).DontShowUI
Set-ItemProperty $dontshowui_key -Name DontShowUI -Value 1
Push-Location $PSScriptRoot | Out-Null

try {
    switch ($Project) {
        "" {
            Write-Host Clean-Binaries -ForegroundColor Blue -BackgroundColor White
            Clean-Binaries; [Console]::ResetColor()

            Write-Host Update-Vlpp -ForegroundColor Blue -BackgroundColor White
            Update-Vlpp; [Console]::ResetColor()

            Write-Host Update-Workflow -ForegroundColor Blue -BackgroundColor White
            Update-Workflow; [Console]::ResetColor()

            Write-Host Update-GacUI -ForegroundColor Blue -BackgroundColor White
            Update-GacUI; [Console]::ResetColor()

            Write-Host Build-Release -ForegroundColor Blue -BackgroundColor White
            Build-Release false; [Console]::ResetColor()

            Write-Host Build-Document -ForegroundColor Blue -BackgroundColor White
            Build-Document; [Console]::ResetColor()
        }
        "Vlpp" {
            Write-Host Update-Vlpp -ForegroundColor Blue -BackgroundColor White
            Update-Vlpp
        }
        "Workflow" {
            Write-Host Update-Workflow -ForegroundColor Blue -BackgroundColor White
            Update-Workflow
        }
        "GacUI" {
            Write-Host Update-GacUI -ForegroundColor Blue -BackgroundColor White
            Update-GacUI
        }
        "Release" {
            Write-Host Build-Release -ForegroundColor Blue -BackgroundColor White
            Build-Release true;
        }
        "Document" {
            Write-Host Build-Document -ForegroundColor Blue -BackgroundColor White
            Build-Document;
        }
        default {
            throw "Unknown project `"$Project`". Project can be either unspecified or one of the following value: Vlpp, Workflow, GacUI, Release, Document."
        }
    }
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Pop-Location | Out-Null
Set-ItemProperty $dontshowui_key -Name DontShowUI -Value $dontshowui_value
[Console]::ResetColor()