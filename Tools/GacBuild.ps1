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

    $build_candidates_file = "$($FileName).log\BuildCandidates.txt"
    $anonymous_file = "$($FileName).log\ResourceAnonymousFiles.txt"
    $named_file = "$($FileName).log\ResourceNamedFiles.txt"

    EnumerateBuildCandidates $resource_dumps $build_candidates_file
    EnumerateAnonymousResources $resource_dumps $anonymous_file
    EnumerateNamedResources $resource_dumps $named_file

    if ($dump) {
        Write-Host "Dumps:"
        Write-Host "    $($build_candidates_file)"
        Write-Host "    $($anonymous_file)"
        Write-Host "    $($named_file)"
    }

    if (-not $dump) {
        Write-Host "Rebuilding all outdated binaries ..."
        $build_candidates = Get-Content $build_candidates_file

        (@() + (Get-Content $anonymous_file) + (Get-Content $named_file)) | ForEach-Object {
            try {
                if ($build_candidates -contains $_) {
                    Write-Host "[BUILD] $($_)"
                    & $PSScriptRoot\GacGen.ps1 -FileName $_
                } else {
                    Write-Host "[SKIPPED] $($_)"
                }
            } catch {
                Write-Host $_.Exception.Message -ForegroundColor Red
            }
        }
    }
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Set-ItemProperty $dontshowui_key -Name DontShowUI -Value $dontshowui_value
[Console]::ResetColor()