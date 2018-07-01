param (
    [String]$FileName
)

function SelectXml([Xml] $xml, [String] $path) {
    $nodes = Select-Xml -Xml $xml -XPath $path
    if ($nodes -eq $null) {
        return ,@()
    } elseif ($nodes -is [array]) {
        return $nodes
    } else {
        return @($nodes)
    }
}

[Xml]$gacui_xml = Get-Content $FileName
Write-Host "Searching for all GacUI Xml Resource files: $FileName ..."
$excludes = (SelectXml $gacui_xml "//GacUI/Exclude/@Pattern").Node.Value
$search_directory = Split-Path -Parent (Resolve-Path $FileName)
if (-not ($search_directory.EndsWith([System.IO.Path]::DirectorySeparatorChar))) {
    $search_directory = $search_directory + [System.IO.Path]::DirectorySeparatorChar
}
$resource_files = (Get-ChildItem $search_directory -Filter "*.xml" -Recurse | Foreach-Object {
    $normalized_path = $_.FullName -replace '\\','/'
    if (($excludes | Where-Object { $normalized_path.Contains($_) }).Length -eq 0) {
        if ((Select-Xml -Path $_.FullName -XPath "//Resource/Folder[@name='GacGenConfig']") -ne $null) {
            $_.FullName.Substring($search_directory.Length)
        }
    }
})
[System.IO.File]::WriteAllLines("$($FileName).log\ResourceFiles.txt", $resource_files)