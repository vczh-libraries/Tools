param(
    [string]$Project = ""
)

function GenerateResource([string]$name, [string]$vcxitems) {
    # Handle vcxitem folder
    $source_folder = "$PSScriptRoot\vcxitems-$vcxitems\*"
    $output_folder = "$PSScriptRoot\..\..\$name\.github\$vcxitems"
    
    # Delete the vcxitem folder if it exists (including all files)
    if (Test-Path $output_folder) {
        Remove-Item $output_folder -Recurse -Force
    }

    # Create the vcxitem folder
    New-Item -ItemType Directory -Path $output_folder -Force | Out-Null

    Copy-Item $source_folder -Destination $output_folder -Force
}

function InitTaskLogs([string]$name) {
    $output_folder = "$PSScriptRoot\..\..\$name\.github\TaskLogs"
    
    # Add *.ps1 to .gitignore
    $gitignore_path = "$output_folder\.gitignore"
    Add-Content -Path $gitignore_path -Value "*.ps1"
    
    # Execute copilotPrepare.ps1
    & "$output_folder\copilotPrepare.ps1"
}

# Define all available projects
$projects = @{
    "Vlpp"           = $files_vlpp
    "VlppOS"         = $files_vlppos
    "VlppRegex"      = $files_vlppregex
    "VlppReflection" = $files_vlppreflection
    "VlppParser2"    = $files_vlppparser2
    "Workflow"       = $files_workflow
    "GacUI"          = $files_gacui
}

# Check if a project was specified
if ($Project -eq "") {
    Write-Host "Please specify a project name. Available projects:"
    foreach ($projectName in $projects.Keys | Sort-Object) {
        Write-Host "  $projectName"
    }
    Write-Host "  CopyBack"
    exit 1
}

# Check if the specified project exists and execute
if ($projects.ContainsKey($Project)) {
    GenerateResource $Project "KnowledgeBase"
    GenerateResource $Project "TaskLogs"
    InitTaskLogs $Project
} else {
    Write-Host "Project '$Project' not found. Available projects:"
    foreach ($projectName in $projects.Keys | Sort-Object) {
        Write-Host "  $projectName"
    }
    Write-Host "  CopyBack"
    exit 1
}
