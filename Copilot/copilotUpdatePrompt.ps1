param(
    [string]$Project = ""
)

$files_vlpp = @(
    "general-instructions-role.md",
    "introduction\vlpp.md",
    "general-instructions.md",
    "specific-linux\vlpp.md",
    "unittest.md"
)

$files_vlppos = @(
    "general-instructions-role.md",
    "introduction\vlppos.md",
    "general-instructions.md",
    "specific-linux\vlppos.md",
    "unittest.md"
)

$files_vlppregex = @(
    "general-instructions-role.md",
    "introduction\vlppregex.md",
    "general-instructions.md",
    "specific-linux\vlppregex.md",
    "unittest.md"
)

$files_vlppreflection = @(
    "general-instructions-role.md",
    "introduction\vlppreflection.md",
    "general-instructions.md",
    "specific-linux\vlppreflection.md",
    "unittest.md"
)

$files_vlppparser2 = @(
    "general-instructions-role.md",
    "introduction\vlppparser2.md",
    "general-instructions.md",
    "specific-linux\vlppparser2.md",
    "unittest.md"
)

$files_workflow = @(
    "general-instructions-role.md",
    "introduction\workflow.md",
    "general-instructions.md",
    "specific-linux\workflow.md",
    "unittest.md"
)

$files_gacui = @(
    "general-instructions-role.md",
    "introduction\gacui.md",
    "general-instructions.md",
    "specific-linux\gacui.md",
    "unittest.md",
    "gacui\unittest.md",
    "gacui\xml.md",
    "gacui\workflow.md"
)

function GenerateGeneralPrompt([string]$name, [string[]]$files) {
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
}

function GenerateProcessPrompt([string]$name) {
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
        
        # Get all copied .md files and append content to each
        $copied_files = Get-ChildItem -Path $prompts_folder -Filter "*.md"
        foreach ($file in $copied_files) {
            $file_content = Get-Content $file.FullName -Raw
            
            # Append common content to all files
            $common_general_path = "$PSScriptRoot\prompts\common\general-instructions.md"
            $kb_path = "$PSScriptRoot\prompts\common\kb.md"
            
            if (Test-Path $common_general_path) {
                $common_general_content = Get-Content $common_general_path -Raw
                $file_content += "`r`n" + $common_general_content
            }
            
            if (Test-Path $kb_path) {
                $kb_content = Get-Content $kb_path -Raw
                $file_content += "`r`n" + $kb_content
            }
            
            # Special handling for 4-verifying.prompt.md
            if (($file.Name -eq "4-verifying.prompt.md") -or ($file.Name -eq "code.prompt.md")) {
                $verifying_path = "$PSScriptRoot\prompts\common\verifying.md"
                $specific_windows_path = "$PSScriptRoot\specific-windows\$name.md"
                
                if (Test-Path $verifying_path) {
                    $verifying_content = Get-Content $verifying_path -Raw
                    $file_content += "`r`n" + $verifying_content
                }
                
                if (Test-Path $specific_windows_path) {
                    $specific_windows_content = Get-Content $specific_windows_path -Raw
                    $file_content += "`r`n" + $specific_windows_content
                }
            }
            
            # Write the updated content back to the file
            Set-Content -Path $file.FullName -Value $file_content
        }
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
    GenerateGeneralPrompt $Project $projects[$Project]
    GenerateProcessPrompt $Project
} else {
    Write-Host "Project '$Project' not found. Available projects:"
    foreach ($projectName in $projects.Keys | Sort-Object) {
        Write-Host "  $projectName"
    }
    Write-Host "  CopyBack"
    exit 1
}
