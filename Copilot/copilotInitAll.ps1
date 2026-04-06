# Initialize Copilot workspace files for all repos

$repos = @(
    "Vlpp",
    "VlppRegex",
    "VlppReflection",
    "VlppParser2",
    "VlppOS",
    "Workflow",
    "GacUI",
    "Release"
)

$initScript = Join-Path $PSScriptRoot "copilotInit.ps1"

foreach ($repo in $repos) {
    $repoPath = Join-Path $PSScriptRoot "..\..\$repo"
    if (-not (Test-Path -Path $repoPath)) {
        Write-Host "Skipping: $repo (not found)"
        continue
    }
    Write-Host "========== Initializing $repo =========="
    Push-Location $repoPath
    try {
        & $initScript
    }
    finally {
        Pop-Location
    }
}
