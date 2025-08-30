

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

ReverseCopyPrompts
