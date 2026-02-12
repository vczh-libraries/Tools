# PowerShell script to start Copilot/Agent chat application

# Get the absolute path of the Copilot/Agent folder
$AgentFolder = $PSScriptRoot

# Function to find the repository root by searching upward from current directory
function Find-RepositoryRoot {
    $currentPath = (Get-Location).Path
    
    while ($true) {
        $copilotInstructionsFile = Join-Path $currentPath ".github\copilot-instructions.md"
        if (Test-Path -Path $copilotInstructionsFile -PathType Leaf) {
            Write-Host "Found repository root: $currentPath"
            return $currentPath
        }
        
        # Get parent directory
        $parentPath = Split-Path $currentPath -Parent
        
        # If parent is null or same as current (reached root), stop
        if ([string]::IsNullOrEmpty($parentPath) -or $parentPath -eq $currentPath) {
            break
        }
        
        $currentPath = $parentPath
    }
    
    Write-Warning "Could not find repository root (.github\copilot-instructions.md file). Using current directory."
    return (Get-Location).Path
}

# Find the working directory (repository root)
$WorkingDirectory = Find-RepositoryRoot

# Change to the Agent folder to run yarn commands
Push-Location $AgentFolder

try {
    Write-Host "Installing dependencies..."
    yarn install
    if ($LASTEXITCODE -ne 0) {
        throw "yarn install failed with exit code $LASTEXITCODE"
    }
    
    Write-Host "Building application..."
    yarn build
    if ($LASTEXITCODE -ne 0) {
        throw "yarn build failed with exit code $LASTEXITCODE"
    }
    
    Write-Host "Starting chat application with working directory: $WorkingDirectory"
    yarn chat -- "$WorkingDirectory"
}
finally {
    # Always return to the original directory
    Pop-Location
}
