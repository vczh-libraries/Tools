function UpdateResource([string]$name, [string]$vcxitems) {
    # Handle vcxitem folder
    $source_folder = "$PSScriptRoot\..\..\$name\.github\$vcxitems\*"
    $output_folder = "$PSScriptRoot\vcxitems-$vcxitems"
    
    # Delete the vcxitem folder if it exists (including all files)
    if (Test-Path $output_folder) {
        Remove-Item $output_folder -Recurse -Force
    }

    # Create the vcxitem folder
    New-Item -ItemType Directory -Path $output_folder -Force | Out-Null

    Copy-Item $source_folder -Destination $output_folder -Force
}

. "$PSScriptRoot\copilotUtil.ps1"
$projectName = ExtractProjectName
Write-Host "Detected project name: $projectName"

UpdateResource $projectName "KnowledgeBase"
