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

function RepoCheckAllDirty([String]$name) {
    try {
        RepoCheckDirty $name
    }
    catch {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

function RepoSyncVersioned([String]$name) {
    Write-Host "Pulling repo: $name ..."

    Set-Location $PSScriptRoot\..\..\$name | Out-Null
    git checkout release-1.0
    git pull origin release-1.0
    git checkout master
    git pull origin master
}

function RepoSyncUnversioned([String]$name) {
    Write-Host "Pulling repo: $name ..."

    Set-Location $PSScriptRoot\..\..\$name | Out-Null
    git pull origin master
}

function RepoCheckout([String]$name, [String]$branch) {
    Write-Host "Checkout out $branch branch: $name ..."

    Set-Location $PSScriptRoot\..\..\$name | Out-Null
    git checkout $branch 2>&1 | Out-Null
    $current_branch = $(git branch --show-current)
    if ($current_branch -ne $branch) {
        throw "Branch $branch does not exist in $name."
    }
}

Push-Location $PSScriptRoot | Out-Null
try {
    $projects_versioned = @("Vlpp","VlppOS","VlppRegex","VlppReflection","VlppParser","VlppParser2","Workflow","GacUI","Release","Tools")
    $projects_unversionsed = @("Document","WebsiteSource","vczh-libraries.github.io")
    $projects = $projects_versioned + $projects_unversionsed
    switch ($Action) {
        "Check" {
            foreach ($project in $projects) {
                RepoCheckDirty $project
            }
        }
        "CheckAll" {
            foreach ($project in $projects) {
                RepoCheckAllDirty $project
            }
        }
        "Sync" {
            foreach ($project in $projects_versioned) {
                RepoSyncVersioned $project
            }
            foreach ($project in $projects_unversionsed) {
                RepoSyncUnversioned $project
            }
        }
        "Master" {
            foreach ($project in $projects_versioned) {
                RepoCheckout $project master
            }
        }
        "1.0" {
            foreach ($project in $projects_versioned) {
                RepoCheckout $project release-1.0
            }
        }
        default {
            throw "Unknown action `"$Action`". Action should be one of the following value: Check, CheckAll, Sync, Master, 1.0."
        }
    }
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Pop-Location | Out-Null
[Console]::ResetColor()