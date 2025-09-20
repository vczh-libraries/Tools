# Initialize Copilot workspace files

function ExtractProjectName {
    # Extract project name from current working directory
    $currentPath = Get-Location
    $pathParts = $currentPath.Path.Split('\')

    # Find the VczhLibraries part in the path
    for ($i = 0; $i -lt $pathParts.Length; $i++) {
        if ($pathParts[$i] -eq "VczhLibraries") {
            return $pathParts[$i + 1]
        }
    }

    throw "Warning: Could not detect project name from current path."
}