. $PSScriptRoot\UpdateVlpp.ps1
. $PSScriptRoot\UpdateWorkflow.ps1
. $PSScriptRoot\UpdateGacUI.ps1

function Clean-Binaries {
    Write-Host "Cleaning ..."
    Remove-Item .\*.exe -Force | Out-Null
    Remove-Item .\*.dll -Force | Out-Null
    Remove-Item .\.Output -Force -Recurse | Out-Null
    New-Item .\.Output -ItemType directory | Out-Null
}

# Prevent from displaying "Debug or Close Application" dialog on crash
$dontshowui_key = "HKCU:\Software\Microsoft\Windows\Windows Error Reporting"
$dontshowui_value = (Get-ItemProperty $dontshowui_key).DontShowUI
Set-ItemProperty $dontshowui_key -Name DontShowUI -Value 1
Push-Location $PSScriptRoot | Out-Null

try {
    Write-Host Clean-Binaries -ForegroundColor Blue -BackgroundColor White
    Clean-Binaries

    Write-Host Update-Vlpp -ForegroundColor Blue -BackgroundColor White
    Update-Vlpp

    Write-Host Update-Workflow -ForegroundColor Blue -BackgroundColor White
    Update-Workflow

    Write-Host Update-GacUI -ForegroundColor Blue -BackgroundColor White
    Update-GacUI
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Pop-Location | Out-Null
Set-ItemProperty $dontshowui_key -Name DontShowUI -Value $dontshowui_value
[Console]::ResetColor()