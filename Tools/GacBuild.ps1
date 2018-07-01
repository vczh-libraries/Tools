param (
    [String]$FileName
)

# Prevent from displaying "Debug or Close Application" dialog on crash
$dontshowui_key = "HKCU:\Software\Microsoft\Windows\Windows Error Reporting"
$dontshowui_value = (Get-ItemProperty $dontshowui_key).DontShowUI
Set-ItemProperty $dontshowui_key -Name DontShowUI -Value 1

try {
    if (-not (Test-Path -Path $FileName)) {
        throw "Input does not exist: $FileName"
    }
    Remove-Item -Path "$($FileName).log" -Recurse | Out-Null
    New-Item -ItemType Directory "$($FileName).log" | Out-Null

    & $PSScriptRoot\GacBuildEnumerate.ps1 -FileName $FileName
    if (-not (Test-Path -Path "$($FileName).log\ResourceFiles.txt")) {
        throw "Failed to enumerate GacUI Xml Resource files"
    }
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Set-ItemProperty $dontshowui_key -Name DontShowUI -Value $dontshowui_value
[Console]::ResetColor()