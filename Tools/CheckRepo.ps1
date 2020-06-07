param (
    [String]$Action = ""
)
function RepoCheckDirty([String]$name) {
    Write-Host "Checking repo: $name ..."

    Set-Location $PSScriptRoot\..\..\$name | Out-Null
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

function RepoSync([String]$name) {
    Write-Host "Pulling repo: $name ..."

    Set-Location $PSScriptRoot\..\..\$name | Out-Null
    git pull origin master
}

Push-Location $PSScriptRoot | Out-Null
try {
    switch ($Action) {
        "Check" {
            RepoCheckDirty Vlpp
            RepoCheckDirty VlppOS
            RepoCheckDirty VlppRegex
            RepoCheckDirty VlppReflection
            RepoCheckDirty VlppParser
            RepoCheckDirty Workflow
            RepoCheckDirty GacUI
            RepoCheckDirty Release
            RepoCheckDirty Document
            RepoCheckDirty vczh-libraries.github.io
            RepoCheckDirty Tools
        }
        "Sync" {
            RepoSync Vlpp
            RepoSync VlppOS
            RepoSync VlppRegex
            RepoSync VlppReflection
            RepoSync VlppParser
            RepoSync Workflow
            RepoSync GacUI
            RepoSync Release
            RepoSync Document
            RepoSync vczh-libraries.github.io
            RepoSync Tools
        }
        default {
            throw "Unknown action `"$Action`". Action should be one of the following value: Check, Sync."
        }
    }
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Pop-Location | Out-Null
[Console]::ResetColor()