

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
    
    # Delete all .md files in the destination prompts folder (not recursively)
    Remove-Item "$destination_prompts_folder\*.md" -Force -ErrorAction SilentlyContinue
    
    # Copy all .md files from source prompts folder
    $source_prompts = "$source_prompts_folder\*.md"
    if (Test-Path $source_prompts) {
        Copy-Item $source_prompts -Destination $destination_prompts_folder -Force
        Write-Host "Reverse copy completed from: $source_prompts_folder"
        
        # Process all copied files to remove content from specific marker
        $copied_files = Get-ChildItem -Path $destination_prompts_folder -Filter "*.md"
        foreach ($file in $copied_files) {
            $file_content = Get-Content $file.FullName -Raw
            
            # Search for the marker string
            $marker = "`r`n`r`n# for Copilot with Agent mode in Visual Studio"
            $marker_position = $file_content.IndexOf($marker)
            
            if ($marker_position -ge 0) {
                # Remove everything from the marker position onwards
                $cleaned_content = $file_content.Substring(0, $marker_position)
                Set-Content -Path $file.FullName -Value $cleaned_content
                Write-Host "Cleaned file: $($file.Name)"
            }
        }
    } else {
        Write-Host "No .md files found to copy back from: $source_prompts_folder"
    }
}

ReverseCopyPrompts
