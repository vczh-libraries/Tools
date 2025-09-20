# Initialize Copilot workspace files

function PatchSolutionFile($solutionPath) {
    # Build the solution items section

    $copilotSectionBegin = 'Project("{2150E333-8FDC-42A3-9474-1A3956D46DE8}") = "@Copilot", "@Copilot", "{02EA681E-C7D8-13C7-8484-4AC65E1B71E8}"'

    $copilotSection = @"
$copilotSectionBegin
	ProjectSection(SolutionItems) = preProject
	EndProjectSection
EndProject
"@

    Write-Host "Updating $solutionPath..."
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
        }
        else {
            Write-Host "Warning: Could not find EndProject after @Copilot section. Skipping replacement."
            return
        }
    }
    else {
        # Copilot section doesn't exist - insert before Global section
        Write-Host "@Copilot section not found. Adding it..."
        $globalSectionIndex = $solutionContent.IndexOf("Global")
        
        if ($globalSectionIndex -gt 0) {
            $beforeCopilot = $solutionContent.Substring(0, $globalSectionIndex)
            $afterCopilot = $solutionContent.Substring($globalSectionIndex)
        }
        else {
            # No Global section - append at end
            $beforeCopilot = $solutionContent
            $afterCopilot = ""
        }
    }
    
    # Combine the three parts and write to file
    $newContent = $beforeCopilot.TrimEnd() + "`r`n" + $copilotSection + "`r`n" + $afterCopilot.TrimStart()
    $newContent | Out-File -FilePath $solutionPath -Encoding UTF8 -NoNewline
    Write-Host "@Copilot section updated in solution file."
}

# Check if current directory has exactly one .sln file
$slnFiles = Get-ChildItem -Path "." -Filter "*.sln" -File
if ($slnFiles.Count -eq 0) {
    Write-Host "No .sln file found in current directory."
}
elseif ($slnFiles.Count -eq 1) {
    # Update UnitTest.sln to include the @Copilot section
    $solutionPath = ".\$($slnFiles[0].Name)"
    Write-Host "Found solution file: $solutionPath"
    PatchSolutionFile $solutionPath
}
elseif ($slnFiles.Count -gt 1) {
    throw "Multiple .sln files found in current directory. Please navigate to a directory containing exactly one solution file."
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
    
    & "$PSScriptRoot\copilotCopyPrompt.ps1" -Project $projectName
    & "$PSScriptRoot\copilotCopyResource.ps1" -Project $projectName
}
else {
    Write-Host "Warning: Could not detect project name from current path."
}

Write-Host "Copilot initialization completed."