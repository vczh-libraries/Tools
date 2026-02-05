# Initialize Copilot workspace files

param(
    [switch]$UpdateKB
)

function ExtractProjectName {
    # Extract project name from current working directory
    $currentPath = Get-Location
    $pathParts = $currentPath.Path.Split('\')

    # Find the VczhLibraries part in the path
    for ($i = 0; $i -lt $pathParts.Length; $i++) {
        if ($pathParts[$i] -eq "VczhLibraries") {
            return $pathParts[$i + 1]
        }
    }

    throw "Warning: Could not detect project name from current path."
}

function SyncFolder($folderName, $sourceFolder, $targetFolder, $skipIfExists) {
    Write-Host "Copying: $folderName"

    $sourcePath = Join-Path $sourceFolder $folderName
    $targetPath = Join-Path $targetFolder $folderName

    if (-not (Test-Path -Path $sourcePath)) {
        throw "Source folder does not exist: $sourcePath"
    }

    New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null

    if (Test-Path -Path $targetPath) {
        if ($skipIfExists) {
            Write-Host "Skipping (already exists)"
            return
        }
        Remove-Item -Path $targetPath -Recurse -Force
    }

    Copy-Item -Path $sourcePath -Destination $targetFolder -Recurse -Force
}

$projectName = ExtractProjectName
$targetFolder = "$PSScriptRoot\..\..\$projectName\.github"
Write-Host "Detected project name: $projectName"

if ($UpdateKB) {
    SyncFolder "KnowledgeBase" "$targetFolder" "$PSScriptRoot" $False
}
else {
    SyncFolder "Guidelines"    "$PSScriptRoot" "$targetFolder" $False
    SyncFolder "KnowledgeBase" "$PSScriptRoot" "$targetFolder" $False
    SyncFolder "prompts"       "$PSScriptRoot" "$targetFolder" $False
    SyncFolder "Scripts"       "$PSScriptRoot" "$targetFolder" $False
    SyncFolder "TaskLogs"      "$PSScriptRoot" "$targetFolder" $True

    New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null

    # Copy from $PSScriptRoot to $targetFolder
    Write-Host "Copying: copilot-instructions.md"
    Copy-Item -Path (Join-Path $PSScriptRoot "copilot-instructions.md") -Destination (Join-Path $targetFolder "copilot-instructions.md") -Force

    $projectMdTarget = Join-Path $targetFolder "Project.md"
    if (-not (Test-Path -Path $projectMdTarget)) {
        Write-Host "Copying: Project.md"
        Copy-Item -Path (Join-Path $PSScriptRoot "Project.md") -Destination $projectMdTarget -Force
    }
    else {
        Write-Host "Skipping Project.md (already exists)"
    }

    # Copy from $PSScriptRoot to $targetFolder\..
    $projectRoot = Split-Path -Path $targetFolder -Parent
    $agentsSource = Join-Path $PSScriptRoot "AGENTS.md"
    Write-Host "Copying: AGENTS.md"
    Copy-Item -Path $agentsSource -Destination (Join-Path $projectRoot "AGENTS.md") -Force
    Write-Host "Copying: CLAUDE.md"
    Copy-Item -Path $agentsSource -Destination (Join-Path $projectRoot "CLAUDE.md") -Force
}
