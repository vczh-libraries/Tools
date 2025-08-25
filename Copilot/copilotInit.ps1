# Initialize Copilot workspace files

# Check if current directory has exactly one .sln file
$slnFiles = Get-ChildItem -Path "." -Filter "*.sln" -File
if ($slnFiles.Count -eq 0) {
    throw "No .sln file found in current directory. Please navigate to a directory containing exactly one solution file."
} elseif ($slnFiles.Count -gt 1) {
    throw "Multiple .sln files found in current directory. Please navigate to a directory containing exactly one solution file."
}

Write-Host "Found solution file: $($slnFiles[0].Name)"

# Copy PowerShell scripts to current working directory
$scriptsToCopy = @(
    "copilotExecute.ps1"
    "copilotPrepare.ps1"
)

# Files to track in the @Copilot solution folder
$filesToTrack = $scriptsToCopy + @(
    "Copilot_Execution.md"
    "Copilot_Planning.md"
    "Copilot_Task.md"
)

foreach ($script in $scriptsToCopy) {
    $sourceScript = "$PSScriptRoot\$script"
    $targetScript = ".\$script"
    if (Test-Path $sourceScript) {
        Write-Host "Copying $script to current directory..."
        Copy-Item -Path $sourceScript -Destination $targetScript -Force
    } else {
        Write-Host "Warning: $script not found at $sourceScript"
    }
}

# Create or update .gitignore to include the markdown files
$gitignorePath = ".\.gitignore"

Write-Host "Updating .gitignore..."

# Read existing .gitignore content if it exists
$existingContent = @()
if (Test-Path $gitignorePath) {
    $existingContent = Get-Content $gitignorePath -ErrorAction SilentlyContinue
    if ($existingContent -eq $null) {
        $existingContent = @()
    }
}

# Add new entries if they don't already exist
$needsUpdate = $false
foreach ($entry in $filesToTrack) {
    if ($existingContent -notcontains $entry) {
        $existingContent += $entry
        $needsUpdate = $true
    }
}

# Force update .gitignore
$existingContent | Out-File -FilePath $gitignorePath -Encoding UTF8

# Update UnitTest.sln to include the @Copilot section
$solutionPath = ".\$($slnFiles[0].Name)"

# Build the solution items section
$solutionItems = ($filesToTrack | ForEach-Object { "`t`t$_ = $_" }) -join "`r`n"

$copilotSectionBegin = 'Project("{2150E333-8FDC-42A3-9474-1A3956D46DE8}") = "@Copilot", "@Copilot", "{02EA681E-C7D8-13C7-8484-4AC65E1B71E8}"'

$copilotSection = @"
$copilotSectionBegin
	ProjectSection(SolutionItems) = preProject
$solutionItems
	EndProjectSection
EndProject
"@

if (Test-Path $solutionPath) {
    Write-Host "Updating $($slnFiles[0].Name)..."
    $solutionContent = Get-Content $solutionPath -Raw
    
    # Find content before and after copilot section
    $copilotSectionIndex = $solutionContent.IndexOf($copilotSectionBegin)
    
    if ($copilotSectionIndex -ge 0) {
        # Copilot section exists - find where it ends
        Write-Host "@Copilot section already exists. Replacing it..."
        $searchStartIndex = $copilotSectionIndex + $copilotSectionBegin.Length
        
        # Use regex to find EndProject at the beginning of a line (with possible whitespace)
        # This prevents matching EndProjectSection which is indented
        $endProjectPattern = '(?m)^(\s*)EndProject(?!\w)'
        $searchContent = $solutionContent.Substring($searchStartIndex)
        $endProjectMatch = [regex]::Match($searchContent, $endProjectPattern)
        
        if ($endProjectMatch.Success) {
            # Adjust the index to account for the substring offset
            $endProjectIndex = $searchStartIndex + $endProjectMatch.Index
            $endOfSectionIndex = $solutionContent.IndexOf("`n", $endProjectIndex) + 1
            if ($endOfSectionIndex -eq 0) {
                $endOfSectionIndex = $endProjectIndex + "EndProject".Length
            }
            
            $beforeCopilot = $solutionContent.Substring(0, $copilotSectionIndex)
            $afterCopilot = $solutionContent.Substring($endOfSectionIndex)
        } else {
            Write-Host "Warning: Could not find EndProject after @Copilot section. Skipping replacement."
            return
        }
    } else {
        # Copilot section doesn't exist - insert before Global section
        Write-Host "@Copilot section not found. Adding it..."
        $globalSectionIndex = $solutionContent.IndexOf("Global")
        
        if ($globalSectionIndex -gt 0) {
            $beforeCopilot = $solutionContent.Substring(0, $globalSectionIndex)
            $afterCopilot = $solutionContent.Substring($globalSectionIndex)
        } else {
            # No Global section - append at end
            $beforeCopilot = $solutionContent
            $afterCopilot = ""
        }
    }
    
    # Combine the three parts and write to file
    $newContent = $beforeCopilot.TrimEnd() + "`r`n" + $copilotSection + "`r`n" + $afterCopilot.TrimStart()
    $newContent | Out-File -FilePath $solutionPath -Encoding UTF8 -NoNewline
    Write-Host "@Copilot section updated in solution file."
} else {
    Write-Host "Warning: $($slnFiles[0].Name) not found."
}

# Execute copilotPrepare.ps1 if it exists
if (Test-Path ".\copilotPrepare.ps1") {
    Write-Host "Executing copilotPrepare.ps1..."
    & ".\copilotPrepare.ps1"
} else {
    Write-Host "Warning: copilotPrepare.ps1 not found in current directory."
}

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
    
    # Call copilotUpdatePrompt with the detected project name
    & "$PSScriptRoot\copilotUpdatePrompt.ps1" -Project $projectName
} else {
    Write-Host "Warning: Could not detect project name from current path."
}

Write-Host "Copilot initialization completed."