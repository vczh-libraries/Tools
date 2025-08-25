param(
    [Parameter(Mandatory=$true)]
    [string]$Executable
)

# Ensure the executable name has .exe extension
if (-not $Executable.EndsWith(".exe")) {
    $executableName = $Executable + ".exe"
} else {
    $executableName = $Executable
}

# Define the possible paths for the executable relative to the script location
$possiblePaths = @(
    "$PSScriptRoot\Debug\$executableName",
    "$PSScriptRoot\Release\$executableName",
    "$PSScriptRoot\x64\Debug\$executableName",
    "$PSScriptRoot\x64\Release\$executableName"
)

# Find existing files and get their modification times
$existingFiles = @()
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $fileInfo = Get-Item $path
        $existingFiles += [PSCustomObject]@{
            Path = $path
            LastWriteTime = $fileInfo.LastWriteTime
        }
    }
}

# Find the file with the latest modification time
if ($existingFiles.Count -gt 0) {
    $latestFile = $existingFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    Write-Host "Selected $executableName`: $($latestFile.Path) (Modified: $($latestFile.LastWriteTime))"

    # Execute the selected executable and capture the exit code
    & $latestFile.Path /D
    exit $LASTEXITCODE
} else {
    throw "No $executableName files found in any of the expected locations."
}