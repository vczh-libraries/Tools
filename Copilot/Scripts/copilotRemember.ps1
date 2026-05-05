# Remember Copilot investigation notes

$filePath = "$PSScriptRoot\..\TaskLogs\Copilot_Investigate.md"

if (Test-Path $filePath) {
    $timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
    $backupFolder = "$PSScriptRoot\..\Learning\$timestamp"
    $fileName = Split-Path $filePath -Leaf
    $destinationPath = Join-Path $backupFolder $fileName

    Write-Host "Creating backup folder: $backupFolder"
    New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null

    Write-Host "Backing up $fileName to Learning folder..."
    Copy-Item -Path $filePath -Destination $destinationPath -Force

    Write-Host "Deleting $fileName..."
    Remove-Item -Path $filePath -Force
}

Write-Host "Copilot remember completed."
