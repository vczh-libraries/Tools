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
    "unittest.md",
    "guidance\vlpp.md"
)

$files_vlppos = @(
    "general-instructions-role.md",
    "introduction\vlppos.md",
    "general-instructions-1.md",
    "unittest\vlppos.md",
    "general-instructions-2.md",
    "makefile\vlppos.md",
    "general-instructions-3.md",
    "unittest.md",
    "guidance\vlpp.md",
    "guidance\vlppos.md"
)

$files_vlppregex = @(
    "general-instructions-role.md",
    "introduction\vlppregex.md",
    "general-instructions-1.md",
    "unittest\vlppregex.md",
    "general-instructions-2.md",
    "makefile\vlppregex.md",
    "general-instructions-3.md",
    "unittest.md",
    "guidance\vlpp.md",
    "guidance\vlppregex.md"
)

$files_vlppreflection = @(
    "general-instructions-role.md",
    "introduction\vlppreflection.md",
    "general-instructions-1.md",
    "unittest\vlppreflection.md",
    "general-instructions-2.md",
    "makefile\vlppreflection.md",
    "general-instructions-3.md",
    "unittest.md",
    "guidance\vlpp.md",
    "guidance\vlppos.md",
    "guidance\vlppregex.md",
    "guidance\vlppreflection.md"
)

$files_vlppparser2 = @(
    "general-instructions-role.md",
    "introduction\vlppparser2.md",
    "general-instructions-1.md",
    "unittest\vlppparser2.md",
    "general-instructions-2.md",
    "makefile\vlppparser2.md",
    "general-instructions-3.md",
    "unittest.md",
    "guidance\vlpp.md",
    "guidance\vlppos.md",
    "guidance\vlppregex.md",
    "guidance\vlppreflection.md",
    "guidance\vlppparser2.md"
)

$files_workflow = @(
    "general-instructions-role.md",
    "introduction\workflow.md",
    "general-instructions-1.md",
    "unittest\workflow.md",
    "general-instructions-2.md",
    "makefile\workflow.md",
    "general-instructions-3.md",
    "unittest.md",
    "guidance\vlpp.md",
    "guidance\vlppos.md",
    "guidance\vlppregex.md",
    "guidance\vlppreflection.md",
    "guidance\vlppparser2.md"
)

$files_gacui = @(
    "general-instructions-role.md",
    "introduction\gacui.md",
    "general-instructions-1.md",
    "unittest\gacui.md",
    "general-instructions-2.md",
    "makefile\gacui.md",
    "general-instructions-3.md",
    "guidance\vlpp.md",
    "guidance\vlppos.md",
    "guidance\vlppregex.md",
    "guidance\vlppreflection.md",
    "guidance\vlppparser2.md",
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
    exit 1
}

# Check if the specified project exists and execute
if ($projects.ContainsKey($Project)) {
    GeneratePrompt $Project $projects[$Project]
} else {
    Write-Host "Project '$Project' not found. Available projects:"
    foreach ($projectName in $projects.Keys | Sort-Object) {
        Write-Host "  $projectName"
    }
    exit 1
}
