param(
    [string]$Project = ""
)

$files_vlpp = @(
    "introduction\vlpp.md",
    "general-instructions.md",
    "kb.md",
    "unittest.md"
)

$files_vlppos = @(
    "introduction\vlppos.md",
    "general-instructions.md",
    "kb.md",
    "unittest.md"
)

$files_vlppregex = @(
    "introduction\vlppregex.md",
    "general-instructions.md",
    "kb.md",
    "unittest.md"
)

$files_vlppreflection = @(
    "introduction\vlppreflection.md",
    "general-instructions.md",
    "kb.md",
    "unittest.md"
)

$files_vlppparser2 = @(
    "introduction\vlppparser2.md",
    "general-instructions.md",
    "kb.md",
    "unittest.md"
)

$files_workflow = @(
    "introduction\workflow.md",
    "general-instructions.md",
    "kb.md",
    "unittest.md"
)

$files_gacui = @(
    "introduction\gacui.md",
    "general-instructions.md",
    "kb.md",
    "unittest.md",
    "gacui\unittest.md",
    "gacui\xml.md"
)

$files_release = @(
    "introduction\release.md",
    "general-instructions.md",
    "kb.md",
    "unittest.md",
    "gacui\unittest.md",
    "gacui\xml.md"
)

function PrepareGithubFolder([string]$name) {
    $github_folder = "$PSScriptRoot\..\..\$name\.github"
    
    # Create the .github folder if it doesn't exist
    if (-not (Test-Path $github_folder)) {
        New-Item -ItemType Directory -Path $github_folder -Force | Out-Null
    }
}

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

function CleanPrompt([string]$name) {
    # Handle prompts folder
    $prompts_folder = "$PSScriptRoot\..\..\$name\.github\prompts"
    
    # Delete the prompts folder if it exists (including all files)
    if (Test-Path $prompts_folder) {
        Remove-Item $prompts_folder -Recurse -Force
    }
    
    # Create the prompts folder
    New-Item -ItemType Directory -Path $prompts_folder -Force | Out-Null
}

function GenerateProcessPrompt([string]$name, [string]$ide) {
    # Handle prompts folder
    $source_folder = "$PSScriptRoot\prompts"
    $prompts_folder = "$PSScriptRoot\..\..\$name\.github\prompts"

    # Copy all .md files from the source prompts folder
    $prompt_files = Get-ChildItem -Path $source_folder -Filter "*.md"
    if (Test-Path "$PSScriptRoot\prompts") {
        foreach ($file in $prompt_files) {
            $file_content = Get-Content $file.FullName -Raw
            
            # Append common content to all files
            $file_content += "`r`n" + (Get-Content "$PSScriptRoot\prompts\$ide-common\ide.md" -Raw)
            $file_content += "`r`n" + (Get-Content "$PSScriptRoot\prompts\common\general-instructions.md" -Raw)
            
            # These files do not need to know about log files
            # ask.prompt.md
            # code.prompt.md
            # kb-api.prompt.md
            if (($file.Name -ne "ask.prompt.md") -and ($file.Name -ne "code.prompt.md") -and ($file.Name -ne "kb-api.prompt.md")) {
                $file_content += "`r`n" + (Get-Content "$PSScriptRoot\prompts\common\tasklogs.md" -Raw)
            }
            
            # These files need to know about testing
            # 4-execution.prompt.md
            # 5-verifying.prompt.md
            # code.prompt.md
            if (($file.Name -eq "4-execution.prompt.md") -or ($file.Name -eq "5-verifying.prompt.md") -or ($file.Name -eq "code.prompt.md")) {
                $file_content += "`r`n" + (Get-Content "$PSScriptRoot\specific-$ide\$name.md" -Raw)
                $file_content += "`r`n" + (Get-Content "$PSScriptRoot\prompts\$ide-common\compiling.md" -Raw)
                $file_content += "`r`n" + (Get-Content "$PSScriptRoot\prompts\$ide-common\verifying.md" -Raw)
            }
            
            # Write the updated content back to the file
            Set-Content -Path "$prompts_folder\$ide-$($file.Name)" -Value $file_content
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
    "Release"        = $files_release
}

# Check if the specified project exists and execute
if ($projects.ContainsKey($Project)) {
    PrepareGithubFolder $Project
    GenerateGeneralPrompt $Project $projects[$Project]
    CleanPrompt $Project
    # GenerateProcessPrompt $Project "vs"
    GenerateProcessPrompt $Project "win"
} else {
    Write-Host "Project '$Project' not found. Please specify a valid project name. Available projects:"
    foreach ($projectName in $projects.Keys | Sort-Object) {
        Write-Host "  $projectName"
    }
    exit 1
}
