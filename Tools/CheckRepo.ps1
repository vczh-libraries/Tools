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

function RepoSync([String]$name) {
    Write-Host "Pulling repo: $name ..."

    Set-Location $PSScriptRoot\..\..\$name | Out-Null
    git pull origin master
}

Push-Location $PSScriptRoot | Out-Null
try {
    $projects = @("Vlpp","VlppOS","VlppRegex","VlppReflection","VlppParser","Workflow","GacUI","Release","Document","WebsiteSource","vczh-libraries.github.io","Tools")
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
            foreach ($project in $projects) {
                RepoSync $project
            }
        }
        default {
            throw "Unknown action `"$Action`". Action should be one of the following value: Check, CheckAll, Sync."
        }
    }
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Pop-Location | Out-Null
[Console]::ResetColor()