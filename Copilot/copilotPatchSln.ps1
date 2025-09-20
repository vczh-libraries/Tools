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

function PatchSln_AddSection([String]$solutionContent, [string]$projectSectionBegin, [string]$projectSection, [string]$projectSectionEnd, [string]$beforeSection) {
    Write-Host "Checking $projectSectionBegin..."

    # Find content before and after project section
    $projectSectionIndex = $solutionContent.IndexOf($projectSectionBegin)
    if ($projectSectionIndex -ge 0) {
        Write-Host "  Already exists, skipped."
        return $solutionContent
    }

    # section doesn't exist - insert before Global section
    $beforeSectionIndex = $solutionContent.IndexOf($beforeSection)
    
    if ($beforeSectionIndex -gt 0) {
        Write-Host "  Not exists, inserted before $beforeSection."
        $beforeCopilot = $solutionContent.Substring(0, $beforeSectionIndex)
        $afterCopilot = $solutionContent.Substring($beforeSectionIndex)
    }
    else {
        # No Global section - append at end
        Write-Host "  Not exists, appended at the end."
        $beforeCopilot = $solutionContent
        $afterCopilot = ""
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

    PatchSln_AddSection $solutionContent $projectSectionBegin $projectSection "EndProject" "Global"
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

    $solutionContent = PatchSln_AddProject $solutionContent $copilotBegin
    $solutionContent = PatchSln_AddProject $solutionContent $kbBegin
    $solutionContent = PatchSln_AddProject $solutionContent $tlBegin
    $solutionContent = PatchSln_AddSection $solutionContent $nestedProjectsBegin $nestedProject "EndGlobalSection" "EndGlobal"
    
    $solutionContent | Out-File -FilePath $solutionPath -Encoding UTF8 -NoNewline
    Write-Host "Updated in solution file."
}
elseif ($slnFiles.Count -gt 1) {
    throw "Multiple .sln files found in current directory. Please navigate to a directory containing exactly one solution file."
}
