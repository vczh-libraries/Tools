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

function EnumerateResourceFiles([String] $FileName) {
    Write-Host "Searching for all resource files ..."

    [Xml]$gacui_xml = Get-Content $FileName
    $excludes = (SelectXml $gacui_xml "//GacUI/Exclude/@Pattern").Node.Value
    $search_directory = Split-Path -Parent (Resolve-Path $FileName)
    $resource_files = (Get-ChildItem $search_directory -Filter "*.xml" -Recurse | ForEach-Object {
        $normalized_path = $_.FullName -replace '\\','/'
        if (($excludes | Where-Object { $normalized_path.Contains($_) }).Length -eq 0) {
            if ((Select-Xml -Path $_.FullName -XPath "//Resource/Folder[@name='GacGenConfig']") -ne $null) {
                $_.FullName.Substring($search_directory.Length)
            }
        }
    })
    [System.IO.File]::WriteAllLines("$($FileName).log\ResourceFiles.txt", $resource_files)
}

function DumpResourceFiles([String] $FileName, [HashTable]$ResourceDumpFiles) {
    Write-Host "Dumping all resource files ..."

    $search_directory = Split-Path -Parent (Resolve-Path $FileName)
    Get-Content "$($FileName).log\ResourceFiles.txt" | ForEach-Object {
        $input_file = Join-Path -Path $search_directory -ChildPath $_
        $output_file = "$($FileName).log\$($_ -replace '\\','_')"
        $ResourceDumpFiles[$input_file] = $output_file
    }

    $ResourceDumpFiles.Keys | ForEach-Object {
        $input_file = $_
        $output_file = $ResourceDumpFiles[$_]
        Start-Process-And-Wait (,("$PSScriptRoot\GacGen32.exe", "/D `"$($input_file)`" `"$($output_file)`"")) $true
        if (-not (Test-Path -Path $output_file)) {
            throw "Failed to dump GacUI Xml Resource File: " + $input_file
        }
    }
}

function NeedBuild([Xml] $Dump) {
    $input_files = (SelectXml $Dump "//ResourceMetadata/Inputs/Input/@Path").Node.Value
    $output_files = (SelectXml $Dump "//ResourceMetadata/Outputs/Output/@Path").Node.Value

    if (($output_files | Where-Object { -not [System.IO.File]::Exists($_) }) -ne $null) {
        return $true
    }
}

function EnumerateBuildCandidates([HashTable] $ResourceDumps) {
    Write-Host "Finding resource files that need rebuild ..."
    $build_candidates = $ResourceDumps.Keys | Where-Object { NeedBuild $ResourceDumps[$_] }
    if ($build_candidates -eq $null) { $build_candidates = @() }
    [System.IO.File]::WriteAllLines("$($FileName).log\BuildCandidates.txt", ($build_candidates | Sort-Object))
}