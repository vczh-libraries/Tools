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
[Console]::ResetColor()