param (
    [String]$FileName
)

. $PSScriptRoot\StartProcess.ps1
. $PSScriptRoot\GacBuildEnumerate.ps1

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
    
    $resource_files = @{}
    $resource_dumps = @{}
    $search_directory = Split-Path -Parent (Resolve-Path $FileName)
    Get-Content "$($FileName).log\ResourceFiles.txt" | ForEach-Object {
        $input_file = Join-Path -Path $search_directory -ChildPath $_
        $output_file = "$($FileName).log\$($_ -replace '\\','_')"
        $resource_files[$input_file] = $output_file
    }

    $resource_files.Keys | ForEach-Object {
        $input_file = $_
        $output_file = $resource_files[$_]
        Start-Process-And-Wait (,("$PSScriptRoot\GacGen32.exe", "/D `"$($input_file)`" `"$($output_file)`"")) $true
        if (-not (Test-Path -Path $output_file)) {
            throw "Failed to dump GacUI Xml Resource File: " + $input_file
        }
        $resource_dumps[$input_file] = [Xml](Get-Content $output_file)
    }
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Set-ItemProperty $dontshowui_key -Name DontShowUI -Value $dontshowui_value
[Console]::ResetColor()