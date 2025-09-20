# Initialize Copilot workspace files

# Extract project name from current working directory
$currentPath = Get-Location
$pathParts = $currentPath.Path.Split('\')
$vczhLibrariesIndex = -1

# Find the VczhLibraries part in the path
for ($i = 0; $i -lt $pathParts.Length; $i++) {
    if ($pathParts[$i] -eq "VczhLibraries") {
        $vczhLibrariesIndex = $i
        break
    }
}

if ($vczhLibrariesIndex -ne -1 -and ($vczhLibrariesIndex + 1) -lt $pathParts.Length) {
    $projectName = $pathParts[$vczhLibrariesIndex + 1]
    Write-Host "Detected project name: $projectName"
    
    & "$PSScriptRoot\copilotCopyPrompt.ps1" -Project $projectName
    & "$PSScriptRoot\copilotCopyResource.ps1" -Project $projectName
    & "$PSScriptRoot\copilotPatchSln.ps1"
}
else {
    Write-Host "Warning: Could not detect project name from current path."
}

Write-Host "Copilot initialization completed."