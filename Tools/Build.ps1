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
            $time_clean = [DateTime]::Now
            Write-Host Clean-Binaries -ForegroundColor Blue -BackgroundColor White
            Clean-Binaries; [Console]::ResetColor()

            $time_vlpp = [DateTime]::Now
            Write-Host Update-Vlpp -ForegroundColor Blue -BackgroundColor White
            Update-Vlpp; [Console]::ResetColor()

            $time_workflow = [DateTime]::Now
            Write-Host Update-Workflow -ForegroundColor Blue -BackgroundColor White
            Update-Workflow; [Console]::ResetColor()

            $time_gacui = [DateTime]::Now
            Write-Host Update-GacUI -ForegroundColor Blue -BackgroundColor White
            Update-GacUI; [Console]::ResetColor()

            $time_release = [DateTime]::Now
            Write-Host Build-Release -ForegroundColor Blue -BackgroundColor White
            Build-Release $False; [Console]::ResetColor()

            $time_document = [DateTime]::Now
            Write-Host Build-Document -ForegroundColor Blue -BackgroundColor White
            Build-Document; [Console]::ResetColor()

            $time_finished = [DateTime]::Now
            Write-Host Finished! -ForegroundColor Blue -BackgroundColor White
            Write-Host "Clean    : $time_clean, Elapsed: $((New-TimeSpan $time_clean $time_vlpp).ToString())"
            Write-Host "Vlpp     : $time_vlpp, Elapsed: $((New-TimeSpan $time_vlpp $time_workflow).ToString())"
            Write-Host "Workflow : $time_workflow, Elapsed: $((New-TimeSpan $time_workflow $time_gacui).ToString())"
            Write-Host "GacUI    : $time_gacui, Elapsed: $((New-TimeSpan $time_gacui $time_release).ToString())"
            Write-Host "Release  : $time_release, Elapsed: $((New-TimeSpan $time_release $time_document).ToString())"
            Write-Host "Document : $time_document, Elapsed: $((New-TimeSpan $time_document $time_finished).ToString())"
            Write-Host "Total    : $((New-TimeSpan $time_clean $time_finished).ToString())"

        }
        "Clean" {
            Write-Host Clean-Binaries -ForegroundColor Blue -BackgroundColor White
            Clean-Binaries
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
            Build-Release $True;
        }
        "Document" {
            Write-Host Build-Document -ForegroundColor Blue -BackgroundColor White
            Build-Document;
        }
        default {
            throw "Unknown project `"$Project`". Project can be either unspecified or one of the following value: Clean, Vlpp, Workflow, GacUI, Release, Document."
        }
    }
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Pop-Location | Out-Null
Set-ItemProperty $dontshowui_key -Name DontShowUI -Value $dontshowui_value
[Console]::ResetColor()