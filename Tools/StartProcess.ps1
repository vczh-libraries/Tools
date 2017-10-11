function Start-Process-And-Wait([String[][]] $Pairs, [Boolean]$Inline = $false) {
    $processes = New-Object System.Diagnostics.Process[] $Pairs.Length
    for ($i = 0; $i -lt $Pairs.Length; $i++) {
        Write-Host "    Running: $($Pairs[$i][0]) $($Pairs[$i][1])" -ForegroundColor DarkGray
        if ($Inline) {
            $processes[$i] = Start-Process $Pairs[$i][0] -ArgumentList $Pairs[$i][1] -NoNewWindow -PassThru
        } else {
            $processes[$i] = Start-Process $Pairs[$i][0] -ArgumentList $Pairs[$i][1] -PassThru
        }
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