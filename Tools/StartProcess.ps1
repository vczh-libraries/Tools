function Start-Process-And-Wait([String[][]] $Pairs, [Boolean]$Inline = $false, [String]$workingDirectory = "") {
    $processes = New-Object System.Diagnostics.Process[] $Pairs.Length
    for ($i = 0; $i -lt $Pairs.Length; $i++) {
        Write-Host "    Running: $($Pairs[$i][0]) $($Pairs[$i][1])" -ForegroundColor DarkGray

        $arguments = @{};
        if ($Pairs[$i][1] -ne "") {
            $arguments.Add("ArgumentList", $Pairs[$i][1])
        }
        $arguments.Add("PassThru", $true)
        $arguments.Add("NoNewWindow", $Inline)
        if ($workingDirectory -ne "") {
            $arguments.Add("WorkingDirectory", $workingDirectory)
        }

        $processes[$i] = Start-Process $Pairs[$i][0] @arguments
    }

    $failed = $false
    for ($i = 0; $i -lt $Pairs.Length; $i++) {
        $process = $processes[$i]
        $process_handle = $process.Handle
        $process.WaitForExit()
        if ($process.ExitCode -ne 0) {
            Write-Host "    Crashes($($process.ExitCode)): $($Pairs[$i][0]) $($Pairs[$i][1])" -ForegroundColor Red
            $failed = $true
        }
        $process.Close()
    }

    [Console]::ResetColor()

    if ($failed) {
        throw "One or more processes crash"
    }
}

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