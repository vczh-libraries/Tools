param (
    [Switch] $Release
)

. $PSScriptRoot\Common.ps1
. $PSScriptRoot\UpdateVlpp.ps1
. $PSScriptRoot\UpdateWorkflow.ps1
. $PSScriptRoot\UpdateGacUI.ps1
. $PSScriptRoot\BuildRelease.ps1
. $PSScriptRoot\BuildDocument.ps1

function RepoNeedUpdate {
    git remote update | Out-Null
    $commit_aheads = $(git rev-list --left-right --count origin/master...master)
    if ($commit_aheads -eq "0       0") {
        return $false
    }
    return $true
}

function RepoCheckDirty([String]$name) {
    Write-Host "Checking repo: $name ..."

    Set-Location ..\$name | Out-Null
    $length = $(git status --porcelain).Length
    if ($length -ne 0) {
        throw "$name has uncommitted files."
    }

    git remote update | Out-Null
    $commit_aheads = $(git rev-list --left-right --count origin/master...master)
    $array = $commit_aheads -split "\s+"
    if ($array[1] -ne "0") {
        throw "$name has unpushed commits."
    }
}

function PushProject([String]$name) {
    Set-Location ..\$name | Out-Null
    git add .
    git commit -a -m "Update Release"
    git push origin master
}

function UpdateProject([ScriptBlock]$update, [String]$name) {
    Set-Location ..\$name | Out-Null
    if (RepoNeedUpdate) {
        Write-Host "Building repo: $name ..." -ForegroundColor Blue -BackgroundColor White
        git pull origin master
        Invoke-Command $update
        PushProject $name
    }
    else {
        Write-Host "$name is up to date" -ForegroundColor Blue -BackgroundColor White
    }
}

Push-Location $PSScriptRoot | Out-Null

try {
    Set-Location ..

    RepoCheckDirty Vlpp
    RepoCheckDirty Workflow
    RepoCheckDirty GacUI
    if ($Release) {
        RepoCheckDirty Release
        RepoCheckDirty vczh-libraries.github.io
    }

    UpdateProject {Update-Vlpp} Vlpp
    UpdateProject {Update-Workflow} Workflow
    UpdateProject {Update-GacUI} GacUI

    if ($Release) {
        Build-Release
        PushProject Release

        Build-Document
        PushProject vczh-libraries.github.io
    }
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Pop-Location | Out-Null
[Console]::ResetColor()