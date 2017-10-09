function Build-Sln($SolutionFile, $Configuration, $Platform, $OutputVar) {
    Write-Host "Building $SolutionFile ..."
    $vsdevcmd = "$($env:VS140COMNTOOLS)VsDevCmd.bat"
    $msbuild_arguments = "MSBUILD `"$SolutionFile`" /t:Rebuild /p:Configuration=`"$Configuration`";Platform=`"$Platform`";$OutputVar=`"$PSScriptRoot\.Output\"
    $cmd_arguments = "`"`"$vsdevcmd`" & $msbuild_arguments"
    $msbuild = Start-Process $env:ComSpec -ArgumentList "/c $cmd_arguments" -PassThru
    $msbuild.WaitForExit()
}

function Release-Project($ProjectName) {
    Push-Location ..\..\$ProjectName\Release | Out-Null

    Pop-Location | Out-Null
}

function Update-And-Build-Tools {
    # Build CodePack.exe
    Build-Sln ..\..\Vlpp\Tools\CodePack\CodePack.sln Release x86 OutDir
    if (!(Test-Path -Path .\.Output\CodePack.exe)) {
        Write-Host "Failed" -ForegroundColor Red
        return
    }
    Copy .\.Output\CodePack.exe CodePack.exe

    # Release Vlpp
    Release-Project Vlpp
}

Write-Host $env:Path
$old_env_path = $env:Path
$env:Path = "$($env:Path)$($PSScriptRoot);"
Push-Location $PSScriptRoot | Out-Null
Write-Host "Cleaning ..."
Remove-Item .\*.exe -Force | Out-Null
Remove-Item .\*.dll -Force | Out-Null
Remove-Item .\.Output -Force -Recurse | Out-Null
New-Item .\.Output -ItemType directory | Out-Null

Update-And-Build-Tools

Pop-Location | Out-Null
$env:Path = $old_env_path