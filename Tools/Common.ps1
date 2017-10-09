function Build-Sln($SolutionFile, $Configuration, $Platform, $OutputVar="OutDir", $OutputFolder="") {
    Write-Host "Building $SolutionFile ..."
    $vsdevcmd = "$($env:VS140COMNTOOLS)VsDevCmd.bat"
    $msbuild_arguments = "MSBUILD `"$SolutionFile`" /m:8 /t:Rebuild /p:Configuration=`"$Configuration`";Platform=`"$Platform`";$OutputVar=`"$PSScriptRoot\.Output\$OutputFolder"
    $cmd_arguments = "`"`"$vsdevcmd`" & $msbuild_arguments"
    $wait_process = Start-Process $env:ComSpec -ArgumentList "/c $cmd_arguments" -PassThru
    $wait_process.WaitForExit()
}

function Test-Single-Binary($FileName) {
    if (!(Test-Path -Path .\.Output\$FileName)) {
        throw "Failed"
    }
    Copy .\.Output\$FileName $FileName
}

function Test-Single-Binary-Rename($Source, $Target) {
    if (!(Test-Path -Path .\.Output\$Source)) {
        throw "Failed"
    }
    Copy .\.Output\$Source $Target
}

function Import-Project($ProjectName, [String[]]$Dependencies) {
    Write-Host "Importing $ProjectName ..."
    Push-Location ..\..\$ProjectName\Import | Out-Null
    foreach ($dep in $Dependencies) {
        Write-Host "    From $dep"
        Copy-Item ..\..\$dep\Release\*.h .
        Copy-Item ..\..\$dep\Release\*.cpp .
    }
    Pop-Location | Out-Null
}

function Release-Project($ProjectName) {
    Write-Host "Releasing $ProjectName ..."
    Push-Location ..\..\$ProjectName\Release | Out-Null
    $wait_process = Start-Process "$PSScriptRoot\CodePack.exe" -ArgumentList "CodegenConfig.xml" -PassThru
    $wait_process.WaitForExit()
    Pop-Location | Out-Null
}

function Update-Parser($FileName) {
    Write-Host "Updating Parser: $FileName ..."
    $wait_process = Start-Process "$PSScriptRoot\ParserGen.exe" -ArgumentList "$FileName" -PassThru
    $wait_process.WaitForExit()
}