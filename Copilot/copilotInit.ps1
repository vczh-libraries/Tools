# Initialize Copilot workspace files

# Check if current directory has exactly one .sln file
$slnFiles = Get-ChildItem -Path "." -Filter "*.sln" -File
if ($slnFiles.Count -eq 0) {
    throw "No .sln file found in current directory. Please navigate to a directory containing exactly one solution file."
} elseif ($slnFiles.Count -gt 1) {
    throw "Multiple .sln files found in current directory. Please navigate to a directory containing exactly one solution file."
}

Write-Host "Found solution file: $($slnFiles[0].Name)"

# Create or override the markdown files with the specified content
$filesToCreate = @{
    "Copilot_Planning.md" = "# !!!PLANNING!!!"
    "Copilot_Execution.md" = "# !!!EXECUTION!!!"
    "Copilot_Task.md" = "# !!!TASK!!!"
}

# Files to track in the @Copilot solution folder
$filesToTrack = @(
    "Copilot_Execution.md"
    "Copilot_Planning.md"
    "Copilot_Task.md"
    "copilotExecute.ps1"
)

# Create each markdown file with the specified content
foreach ($file in $filesToCreate.GetEnumerator()) {
    $filePath = ".\$($file.Key)"
    Write-Host "Creating/overriding $($file.Key)..."
    $file.Value | Out-File -FilePath $filePath -Encoding UTF8
}

# Copy copilotExecute.ps1 to current working directory
$sourceExecuteScript = "$PSScriptRoot\copilotExecute.ps1"
$targetExecuteScript = ".\copilotExecute.ps1"
if (Test-Path $sourceExecuteScript) {
    Write-Host "Copying copilotExecute.ps1 to current directory..."
    Copy-Item -Path $sourceExecuteScript -Destination $targetExecuteScript -Force
} else {
    Write-Host "Warning: copilotExecute.ps1 not found at $sourceExecuteScript"
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

$copilotSection = @"
Project("{2150E333-8FDC-42A3-9474-1A3956D46DE8}") = "@Copilot", "@Copilot", "{02EA681E-C7D8-13C7-8484-4AC65E1B71E8}"
	ProjectSection(SolutionItems) = preProject
$solutionItems
	EndProjectSection
EndProject
"@

if (Test-Path $solutionPath) {
    Write-Host "Updating $($slnFiles[0].Name)..."
    $solutionContent = Get-Content $solutionPath -Raw
    
    # Check if @Copilot section already exists
    if ($solutionContent -match 'Project\("[^"]+"\) = "@Copilot"') {
        Write-Host "@Copilot section already exists in solution file."
    } else {
        # Find the position to insert (before Global section)
        $globalSectionIndex = $solutionContent.IndexOf("Global")
        if ($globalSectionIndex -gt 0) {
            $beforeGlobal = $solutionContent.Substring(0, $globalSectionIndex).TrimEnd()
            $afterGlobal = $solutionContent.Substring($globalSectionIndex)
            $newContent = $beforeGlobal + "`r`n" + $copilotSection + "`r`n" + $afterGlobal
            $newContent | Out-File -FilePath $solutionPath -Encoding UTF8 -NoNewline
            Write-Host "@Copilot section added to solution file."
        } else {
            # If no Global section found, append at the end
            $newContent = $solutionContent.TrimEnd() + "`r`n" + $copilotSection + "`r`n"
            $newContent | Out-File -FilePath $solutionPath -Encoding UTF8 -NoNewline
            Write-Host "@Copilot section appended to solution file."
        }
    }
} else {
    Write-Host "Warning: $($slnFiles[0].Name) not found."
}

Write-Host "Copilot initialization completed."