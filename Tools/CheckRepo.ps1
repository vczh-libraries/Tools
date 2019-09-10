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

Push-Location $PSScriptRoot | Out-Null
RepoCheckDirty Vlpp
RepoCheckDirty VlppOS
RepoCheckDirty VlppRegex
RepoCheckDirty VlppReflection
RepoCheckDirty VlppParser
RepoCheckDirty Workflow
RepoCheckDirty GacUI
RepoCheckDirty Release
RepoCheckDirty vczh-libraries.github.io
Pop-Location | Out-Null
[Console]::ResetColor()