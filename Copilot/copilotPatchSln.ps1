# Initialize Copilot workspace files

$vcxitems_folder = "..\..\.github"
$copilotBegin = 'Project("{2150E333-8FDC-42A3-9474-1A3956D46DE8}") = "@Copilot", "@Copilot", "{02EA681E-C7D8-13C7-8484-4AC65E1B71E8}"'
$kbBegin = 'Project("{8BC9CEB8-8B4A-11D0-8D11-00A0C91BC942}") = "KnowledgeBase", "' + $vcxitems_folder + '\KnowledgeBase\KnowledgeBase.vcxitems", "{D178E490-7C2B-43FA-A8B3-A3BED748EB38}"'
$tlBegin = 'Project("{8BC9CEB8-8B4A-11D0-8D11-00A0C91BC942}") = "TaskLogs", "' + $vcxitems_folder + '\TaskLogs\TaskLogs.vcxitems", "{8626528F-9C97-4480-A018-CDCCCB9CACAE}"'

$nestedProjectsBegin = "`tGlobalSection(NestedProjects) = preSolution"
$nestedProject = @"
`t`t{D178E490-7C2B-43FA-A8B3-A3BED748EB38} = {02EA681E-C7D8-13C7-8484-4AC65E1B71E8}
`t`t{8626528F-9C97-4480-A018-CDCCCB9CACAE} = {02EA681E-C7D8-13C7-8484-4AC65E1B71E8}
`tEndGlobalSection
"@

function PatchSln_AddSection([String]$solutionContent, [string]$projectSectionBegin, [string]$projectSection, [string]$projectSectionEnd) {
    Write-Host "Checking $projectSectionBegin..."

    # Find content before and after project section
    $projectSectionIndex = $solutionContent.IndexOf($projectSectionBegin)
    if ($projectSectionIndex -ge 0) {
        return $solutionContent
    }

    # Project section exists - find where it ends
    Write-Host "@Project section already exists. Replacing it..."
    $searchStartIndex = $projectSectionIndex + $projectSectionBegin.Length
    
    # Use regex to find $projectSectionEnd at the beginning of a line (with possible whitespace)
    $endProjectPattern = "(?m)^(\s*)$projectSectionEnd(?!\w)"
    $searchContent = $solutionContent.Substring($searchStartIndex)
    $endProjectMatch = [regex]::Match($searchContent, $endProjectPattern)
    
    if ($endProjectMatch.Success) {
        # Adjust the index to account for the substring offset
        $endProjectIndex = $searchStartIndex + $endProjectMatch.Index
        $endOfSectionIndex = $solutionContent.IndexOf("`n", $endProjectIndex) + 1
        if ($endOfSectionIndex -eq 0) {
            $endOfSectionIndex = $endProjectIndex + $projectSectionEnd.Length
        }
        
        $beforeCopilot = $solutionContent.Substring(0, $projectSectionIndex)
        $afterCopilot = $solutionContent.Substring($endOfSectionIndex)
    }
    else {
        Write-Host "Warning: Could not find $projectSectionEnd after the specified section. Skipping replacement."
        return $solutionContent
    }
    
    # Combine the three parts and write to file
    $newContent = $beforeCopilot.TrimEnd() + "`r`n" + $projectSection + "`r`n" + $afterCopilot.TrimStart()
    return $newContent
}

function PatchSln_AddProject([String]$solutionContent, [string]$projectSectionBegin) {
    # Build the solution items section

    $projectSection = @"
$projectSectionBegin
EndProject
"@

    PatchSln_AddSection $solutionContent $projectSectionBegin $projectSection "EndProject"
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
    $solutionContent = Get-Content $solutionPath -Raw

    $solutionContent = PatchSln_AddProject $solutionPath $copilotBegin
    $solutionContent = PatchSln_AddProject $solutionPath $kbBegin
    $solutionContent = PatchSln_AddProject $solutionPath $tlBegin
    # $solutionContent = PatchSln_AddSection $solutionPath $nestedProjectsBegin $nestedProject "`tEndGlobalSection"
    
    $newContent | Out-File -FilePath $solutionPath -Encoding UTF8 -NoNewline
    Write-Host "Updated in solution file."
}
elseif ($slnFiles.Count -gt 1) {
    throw "Multiple .sln files found in current directory. Please navigate to a directory containing exactly one solution file."
}
