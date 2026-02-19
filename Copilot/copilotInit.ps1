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
    $sourcePath = Join-Path $sourceFolder $folderName
    $targetPath = Join-Path $targetFolder $folderName

    if (-not (Test-Path -Path $sourcePath)) {
        throw "Source folder does not exist: $sourcePath"
    }

    New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null

    if (Test-Path -Path $targetPath) {
        if ($skipIfExists) {
            Write-Host "Skipping: $folderName (already exists)"
            return
        }
        Remove-Item -Path $targetPath -Recurse -Force
    }

    Write-Host "Copying: $folderName"
    Copy-Item -Path $sourcePath -Destination $targetFolder -Recurse -Force
}

function FixAgentFiles($agentFolder) {
    Push-Location $agentFolder
    try {
        git clean -xdf
        Get-ChildItem -Path . -Filter *.md -Recurse | ForEach-Object {
            $content = Get-Content -Path $_.FullName -Raw
            if ($content -match '\bCopilot/Agent\b') {
                $newContent = $content -replace '\bCopilot/Agent\b', '.github/Agent'
                Set-Content -Path $_.FullName -Value $newContent -NoNewline
                Write-Host "Updated: $($_.FullName)"
            }
        }
    }
    finally {
        Pop-Location
    }
}

$projectName = ExtractProjectName
$targetFolder = "$PSScriptRoot\..\..\$projectName\.github"
Write-Host "Detected project name: $projectName"

if ($UpdateKB) {
    SyncFolder "KnowledgeBase" "$targetFolder" "$PSScriptRoot" $False
}
else {
    New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null

    SyncFolder "Agent"         "$PSScriptRoot" "$targetFolder" $False
    FixAgentFiles (Join-Path $targetFolder "Agent")

    SyncFolder "Guidelines"    "$PSScriptRoot" "$targetFolder" $False
    SyncFolder "KnowledgeBase" "$PSScriptRoot" "$targetFolder" $False
    SyncFolder "prompts"       "$PSScriptRoot" "$targetFolder" $False
    SyncFolder "Scripts"       "$PSScriptRoot" "$targetFolder" $False
    SyncFolder "TaskLogs"      "$PSScriptRoot" "$targetFolder" $True
    SyncFolder "Learning"      "$PSScriptRoot" "$targetFolder" $True

    # Copy from $PSScriptRoot to $targetFolder
    Write-Host "Copying: bot.ps1"
    Copy-Item -Path (Join-Path $PSScriptRoot "bot.ps1") -Destination (Join-Path $targetFolder "bot.ps1") -Force
    Write-Host "Copying: copilot-instructions.md"
    Copy-Item -Path (Join-Path $PSScriptRoot "copilot-instructions.md") -Destination (Join-Path $targetFolder "copilot-instructions.md") -Force

    $projectMdTarget = Join-Path $targetFolder "Project.md"
    if (-not (Test-Path -Path $projectMdTarget)) {
        Write-Host "Copying: Project.md"
        Copy-Item -Path (Join-Path $PSScriptRoot "Project.md") -Destination $projectMdTarget -Force
    }
    else {
        Write-Host "Skipping: Project.md (already exists)"
    }

    # Copy from $PSScriptRoot to $targetFolder\..
    $projectRoot = Split-Path -Path $targetFolder -Parent
    $agentsSource = Join-Path $PSScriptRoot "AGENTS.md"
    Write-Host "Copying: AGENTS.md"
    Copy-Item -Path $agentsSource -Destination (Join-Path $projectRoot "AGENTS.md") -Force
    Write-Host "Copying: CLAUDE.md"
    Copy-Item -Path $agentsSource -Destination (Join-Path $projectRoot "CLAUDE.md") -Force
}
