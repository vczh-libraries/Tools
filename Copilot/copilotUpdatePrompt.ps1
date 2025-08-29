param(
    [string]$Project = ""
)

$files_vlpp = @(
    "general-instructions-role.md",
    "introduction\vlpp.md",
    "general-instructions-1.md",
    "unittest\vlpp.md",
    "general-instructions-2.md",
    "makefile\vlpp.md",
    "general-instructions-3.md",
    "kb.md",
    "unittest.md"
)

$files_vlppos = @(
    "general-instructions-role.md",
    "introduction\vlppos.md",
    "general-instructions-1.md",
    "unittest\vlppos.md",
    "general-instructions-2.md",
    "makefile\vlppos.md",
    "general-instructions-3.md",
    "kb.md",
    "unittest.md"
)

$files_vlppregex = @(
    "general-instructions-role.md",
    "introduction\vlppregex.md",
    "general-instructions-1.md",
    "unittest\vlppregex.md",
    "general-instructions-2.md",
    "makefile\vlppregex.md",
    "general-instructions-3.md",
    "kb.md",
    "unittest.md"
)

$files_vlppreflection = @(
    "general-instructions-role.md",
    "introduction\vlppreflection.md",
    "general-instructions-1.md",
    "unittest\vlppreflection.md",
    "general-instructions-2.md",
    "makefile\vlppreflection.md",
    "general-instructions-3.md",
    "kb.md",
    "unittest.md"
)

$files_vlppparser2 = @(
    "general-instructions-role.md",
    "introduction\vlppparser2.md",
    "general-instructions-1.md",
    "unittest\vlppparser2.md",
    "general-instructions-2.md",
    "makefile\vlppparser2.md",
    "general-instructions-3.md",
    "kb.md",
    "unittest.md"
)

$files_workflow = @(
    "general-instructions-role.md",
    "introduction\workflow.md",
    "general-instructions-1.md",
    "unittest\workflow.md",
    "general-instructions-2.md",
    "makefile\workflow.md",
    "general-instructions-3.md",
    "kb.md",
    "unittest.md"
)

$files_gacui = @(
    "general-instructions-role.md",
    "introduction\gacui.md",
    "general-instructions-1.md",
    "unittest\gacui.md",
    "general-instructions-2.md",
    "makefile\gacui.md",
    "general-instructions-3.md",
    "kb.md",
    "unittest.md",
    "gacui\unittest.md",
    "gacui\xml.md",
    "gacui\workflow.md"
)

function GeneratePrompt([string]$name, [string[]]$files) {
    $output_path = "$PSScriptRoot\..\..\$name\.github\copilot-instructions.md"
    
    # First, check that all files exist
    $missingFiles = @()
    foreach ($file in $files) {
        $fragment_path = "$PSScriptRoot\$file"
        if (-not (Test-Path $fragment_path)) {
            $missingFiles += $fragment_path
        }
    }
    
    # Throw if any files are missing
    if ($missingFiles.Count -gt 0) {
        $missingFilesList = $missingFiles -join "`r`n  "
        throw "The following required files are missing:`r`n  $missingFilesList"
    }
    
    # All files exist, proceed with reading them
    $output_content = "";
    foreach ($file in $files) {
        $fragment_path = "$PSScriptRoot\$file"
        $fragment_content = Get-Content $fragment_path -Raw
        if ($output_content -eq "") {
            $output_content = $fragment_content
        } else {
            $output_content += "`r`n" + $fragment_content
        }
    }
    Set-Content -Path $output_path -Value $output_content
    
    Write-Host Updated: $output_path
    
    # Handle prompts folder
    $prompts_folder = "$PSScriptRoot\..\..\$name\.github\prompts"
    
    # Delete the prompts folder if it exists (including all files)
    if (Test-Path $prompts_folder) {
        Remove-Item $prompts_folder -Recurse -Force
    }
    
    # Create the prompts folder
    New-Item -ItemType Directory -Path $prompts_folder -Force | Out-Null
    
    # Copy all .md files from the source prompts folder
    $source_prompts = "$PSScriptRoot\prompts\*.md"
    if (Test-Path "$PSScriptRoot\prompts") {
        Copy-Item $source_prompts -Destination $prompts_folder -Force
        Write-Host "Copied prompts to: $prompts_folder"
    }
}

function ReverseCopyPrompts() {
    $destination_prompts_folder = "$PSScriptRoot\prompts"
    
    # Search for .github folder starting from current directory and going up
    $currentPath = Get-Location
    $githubFolder = $null
    
    while ($currentPath) {
        $testGithubPath = Join-Path $currentPath ".github"
        if (Test-Path $testGithubPath) {
            $githubFolder = $testGithubPath
            break
        }
        
        # Move up one directory
        $parentPath = Split-Path $currentPath -Parent
        if ($parentPath -eq $currentPath) {
            # We've reached the root, stop searching
            break
        }
        $currentPath = $parentPath
    }
    
    # Throw if .github folder not found
    if (-not $githubFolder) {
        throw "Could not find .github folder in current directory or any parent directories"
    }
    
    $source_prompts_folder = Join-Path $githubFolder "prompts"
    
    # Check if source prompts folder exists
    if (-not (Test-Path $source_prompts_folder)) {
        throw "Source prompts folder not found: $source_prompts_folder"
    }
    
    # Delete all files in the destination prompts folder if it exists
    if (Test-Path $destination_prompts_folder) {
        Remove-Item "$destination_prompts_folder\*" -Force
    }
    
    # Ensure destination prompts folder exists
    New-Item -ItemType Directory -Path $destination_prompts_folder -Force | Out-Null
    
    # Copy all .md files from source prompts folder
    $source_prompts = "$source_prompts_folder\*.md"
    if (Test-Path $source_prompts) {
        Copy-Item $source_prompts -Destination $destination_prompts_folder -Force
        Write-Host "Reverse copy completed from: $source_prompts_folder"
    } else {
        Write-Host "No .md files found to copy back from: $source_prompts_folder"
    }
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
    GeneratePrompt $Project $projects[$Project]
} elseif ($Project -eq "CopyBack") {
    ReverseCopyPrompts
} else {
    Write-Host "Project '$Project' not found. Available projects:"
    foreach ($projectName in $projects.Keys | Sort-Object) {
        Write-Host "  $projectName"
    }
    Write-Host "  CopyBack"
    exit 1
}
