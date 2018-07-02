function ForceArray($nodes) {
    if ($nodes -eq $null) {
        return ,@()
    } elseif (($nodes -is [System.Array]) -or ($nodes -is [System.Collections.ArrayList])) {
        return $nodes
    } else {
        return ,@($nodes)
    }
}

function EnumerateResourceFiles([String] $FileName) {
    Write-Host "Searching for all resource files ..."

    [Xml]$gacui_xml = Get-Content $FileName
    $excludes = (ForceArray (Select-Xml -Xml $gacui_xml -XPath "//GacUI/Exclude/@Pattern")).Node.Value
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
    $input_files = (ForceArray (Select-Xml -Xml $Dump -XPath "//ResourceMetadata/Inputs/Input/@Path")).Node.Value
    $output_files = (ForceArray (Select-Xml -Xml $Dump -XPath "//ResourceMetadata/Outputs/Output/@Path")).Node.Value

    if (($output_files | Where-Object { -not [System.IO.File]::Exists($_) }) -ne $null) {
        return $true
    }

    $input_file_times = ForceArray ($input_files | ForEach-Object {
        [System.IO.FileInfo]::new($_).LastWriteTimeUtc
    })
    $output_file_times = ForceArray ($output_files | ForEach-Object {
        [System.IO.FileInfo]::new($_).LastWriteTimeUtc
    })

    $outdated = $output_file_times | Where-Object {
        $output = $_
        $modifieds = $input_file_times | Where-Object {
            return $_ -gt $output
        }
        return $modifieds -ne $null
    }

    return $outdated -ne $null
}

function ExtractDeps([HashTable] $ResourceDumps, [HashTable] $name_to_file_map, [HashTable] $name_to_dep_map)
{
    $ResourceDumps.Keys | ForEach-Object {
        $xml = $ResourceDumps[$_]
        $name = (Select-Xml -Xml $xml -XPath "//ResourceMetadata/ResourceMetadata/@Name").Node.Value
        if ($name -ne "") {
            $attrs = ForceArray (Select-Xml -Xml $xml -XPath "//ResourceMetadata/ResourceMetadata/Dependencies/Resource/@Name")
            $deps = ForceArray $attrs.Node.Value
            $name_to_file_map[$name] = $_
            $name_to_dep_map[$name] = [System.Collections.ArrayList]::new($deps)
        }
    }
}

function EnumerateBuildCandidates([HashTable] $ResourceDumps, [String] $OutputFileName) {
    Write-Host "Finding resource files that need rebuild ..."
    $build_candidates = $ResourceDumps.Keys | Where-Object { NeedBuild $ResourceDumps[$_] } | Sort-Object
    [System.IO.File]::WriteAllLines($OutputFileName, (ForceArray $build_candidates))
}

function EnumerateAnonymousResources([HashTable] $ResourceDumps, [String] $OutputFileName) {
    Write-Host "Finding anonymouse resource files ..."
    $file_names = $ResourceDumps.Keys | Where-Object {
        return (ForceArray (Select-Xml -Xml $ResourceDumps[$_] -XPath "//ResourceMetadata/ResourceMetadata/@Name"))[0].Node.Value -eq ""
    } | Sort-Object
    [System.IO.File]::WriteAllLines($OutputFileName, (ForceArray $file_names))
}

function ValidateDeps([HashTable] $name_to_dep_map)
{
    $hasError = $false
    $name_to_dep_map.Keys | ForEach-Object {
        $key = $_
        $name_to_dep_map[$key] | ForEach-Object {
            if (-not $name_to_dep_map.ContainsKey($key)) {
                $hasError = $true
                Write-Host "Resource $($key) depends on $($_) but $($_) does not exist."
            }
        }
    }
    if ($hasError) { throw "Please check your metadata." }
}

function SortDeps([HashTable] $name_to_dep_map)
{
    $compile_order = [System.Collections.ArrayList]::new()
    while ($name_to_dep_map.Count -gt 0) {
        $selection = ForceArray ($name_to_dep_map.Keys | Where-Object { $name_to_dep_map[$_].Count -eq 0 })
        if ($selection.Count -eq 0) {
            Write-Host "Found circle dependency in the following resources:"
            $name_to_dep_map.Keys | ForEach-Object { Write-Host "    $($_)" }
            $hasError = $true;
            break
        } else {
            $compile_order.AddRange((ForceArray ($selection | Select-Object)))
            $selection | ForEach-Object {
                $ready = $_
                $name_to_dep_map.Remove($ready)
                $name_to_dep_map.Values | ForEach-Object { $_.Remove($ready) }
            }
        }
    }
    if ($hasError) { throw "Please check your metadata." }
    return $compile_order
}

function EnumerateNamedResources([HashTable] $ResourceDumps, [String] $OutputNames, [String] $OutputMapping) {
    Write-Host "Finding named resource files ..."

    $name_to_file_map = @{}
    $name_to_dep_map = @{}
    ExtractDeps $ResourceDumps $name_to_file_map $name_to_dep_map
    ValidateDeps $name_to_dep_map
    $compile_order = ForceArray (SortDeps $name_to_dep_map)

    $file_names = ForceArray ($compile_order | ForEach-Object {
        return $name_to_file_map[$_]
    })
    $file_mapping = ForceArray ($name_to_file_map.Keys | ForEach-Object {
        return "$($_)=>$($name_to_file_map[$_])"
    } | Sort-Object)
    [System.IO.File]::WriteAllLines($OutputNames, $file_names)
    [System.IO.File]::WriteAllLines($OutputMapping, $file_mapping)
}