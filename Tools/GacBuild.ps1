[CmdLetBinding()]
param (
    [String]$FileName,
    [Switch]$Dump
)

. $PSScriptRoot\StartProcess.ps1
. $PSScriptRoot\GacCommon.ps1

# Prevent from displaying "Debug or Close Application" dialog on crash
$dontshowui_key = "HKCU:\Software\Microsoft\Windows\Windows Error Reporting"
$dontshowui_value = (Get-ItemProperty $dontshowui_key).DontShowUI
Set-ItemProperty $dontshowui_key -Name DontShowUI -Value 1

try {
    if (-not (Test-Path -Path $FileName)) {
        throw "Input does not exist: $FileName"
    }
    $FileName = (Resolve-Path -Path $FileName).Path
    Remove-Item -Path "$($FileName).log" -Recurse | Out-Null
    New-Item -ItemType Directory "$($FileName).log" | Out-Null

    EnumerateResourceFiles $FileName
    if (-not (Test-Path -Path "$($FileName).log\ResourceFiles.txt")) {
        throw "Failed to enumerate GacUI Xml Resource files"
    }
    
    $resource_dump_files = @{}
    $resource_dumps = @{}
    DumpResourceFiles $FileName $resource_dump_files
    $resource_dump_files.Keys | ForEach-Object {
        $resource_dumps[$_] = [Xml](Get-Content $resource_dump_files[$_])
    }

    EnumerateBuildCandidates $FileName $resource_dumps
    $build_candidates_file = "$($FileName).log\BuildCandidates.txt"
    if ($dump) {
        Write-Host "Dumps: $($build_candidates_file)"
    }

    if (-not $dump) {
        Write-Host "Rebuilding all outdated binaries ..."
        Get-Content $build_candidates_file | ForEach-Object {
            & $PSScriptRoot\GacGen.ps1 -FileName $_
        }
    }
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Set-ItemProperty $dontshowui_key -Name DontShowUI -Value $dontshowui_value
[Console]::ResetColor()