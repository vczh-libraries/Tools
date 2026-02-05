# Initialize Copilot workspace files

. "$PSScriptRoot\copilotUtil.ps1"
$projectName = ExtractProjectName
Write-Host "Detected project name: $projectName"

& "$PSScriptRoot\copilotCopyPrompt.ps1" -Project $projectName
& "$PSScriptRoot\copilotCopyResource.ps1" -Project $projectName

Write-Host "Copilot initialization completed."