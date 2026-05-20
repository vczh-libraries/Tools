. $PSScriptRoot\StartProcess.ps1

function Build-Sln($SolutionFile, $Configuration, $Platform, $OutputVar="OutDir", [String]$OutputFolder="", [Boolean]$ThrowOnCrash = $true, [Boolean]$Rebuild = $true) {
    Write-Host "Building $SolutionFile ..."

    $vsdevcmd = $env:VLPP_VSDEVCMD_PATH
    if ($vsdevcmd -eq $null) {
        local MESSAGE_1 = "You have to add an environment variable named VLPP_VSDEVCMD_PATH and set its value to the path of VsDevCmd.bat, e.g.:"
        local MESSAGE_2 = "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\Tools\VsDevCmd.bat"
        throw "$MESSAGE_1\r\n$MESSAGE_2"
    }
    $OutputFolder = $OutputFolder.Trim()
    if ($OutputFolder.StartsWith('"') -and $OutputFolder.EndsWith('"')) {
        $OutputFolder = $OutputFolder.Substring(1, $OutputFolder.Length - 2)
    }
    if ($OutputFolder.IndexOf(":\") -eq -1) {
        $outputFolderValue = "$PSScriptRoot\.Output\$OutputFolder"
    } else {
    $outputFolderValue = "$OutputFolder"
    }
    $outputFolderValue = $outputFolderValue.Replace("\", "/").TrimEnd("/") + "/"
    $output_dir = "$OutputVar=$outputFolderValue"

    $rebuildControl = ""
    if ($Rebuild) {
        $rebuildControl = "/t:Rebuild"
    }
    $msbuild_arguments = "MSBUILD `"$SolutionFile`" /m:8 $rebuildControl `"/p:Configuration=$Configuration;Platform=$Platform;$($output_dir)`""
    $cmd_arguments = "/c `"call `"$vsdevcmd`" && $msbuild_arguments`""
    Start-Process-And-Wait (,($env:ComSpec, $cmd_arguments)) $false "" $ThrowOnCrash
}

function Test-Single-Binary($FileName) {
    if (!(Test-Path -Path $PSScriptRoot\.Output\$FileName)) {
        throw "Failed"
    }
    Copy $PSScriptRoot\.Output\$FileName $PSScriptRoot\$FileName
}

function Import-Project($ProjectName, [String[]]$Dependencies) {
    Write-Host "Importing $ProjectName ..."
    Push-Location $PSScriptRoot\..\..\$ProjectName\Import | Out-Null
    foreach ($dep in $Dependencies) {
        Write-Host "    From $dep"
        Copy-Item ..\..\$dep\Release\*.h .
        Copy-Item ..\..\$dep\Release\*.cpp .
    }
    Pop-Location | Out-Null
}

function Release-Project($ProjectName) {
    Write-Host "Releasing $ProjectName ..."
    Start-Process-And-Wait (,("$PSScriptRoot\CodePack.backup.exe", "$PSScriptRoot\..\..\$ProjectName\Release\CodegenConfig.xml"))
}

function Update-Parser($FileName) {
    Write-Host "Updating Parser: $FileName ..."
    Start-Process-And-Wait (,("$PSScriptRoot\ParserGen.exe", "$FileName"))
}

function Update-Parser2($FileName) {
    Write-Host "Updating Parser: $FileName ..."
    Start-Process-And-Wait (,("$PSScriptRoot\GlrParserGen.exe", "$FileName"))
}

function Build-TypeScript-Package($ProjectName) {
    $typeScriptPath = Resolve-Path "$PSScriptRoot\..\..\$ProjectName\Test\TypeScript"
    Write-Host "Building TypeScript package: $typeScriptPath ..."

    Push-Location $typeScriptPath | Out-Null
    try {
        & "$typeScriptPath\prepare.ps1"
        Start-Process-And-Wait (,($env:ComSpec, "/c npm install")) $true $typeScriptPath
        Start-Process-And-Wait (,($env:ComSpec, "/c npm run build")) $true $typeScriptPath
    }
    finally {
        Pop-Location | Out-Null
    }
}
