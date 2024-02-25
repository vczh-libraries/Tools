function Test-Vlpp-Platform($projectName, $subProjectName, $platform, $outDir) {
    Build-Sln $PSScriptRoot\..\..\$projectName\Test\UnitTest\$subProjectName\$subProjectName.vcxproj Release $platform OutDir "`"$outDir\`""
    if (!(Test-Path "$outDir\$subProjectName.exe")) {
        throw "Failed"
    }

    Write-Host "Executing Unit Test ($platform) ..."
    Start-Process-And-Wait (,("$outDir\$subProjectName.exe", ""))
}

function Test-Vlpp-SubProject($projectName, $subProjectName) {
    Test-Vlpp-Platform "$projectName" $subProjectName Win32 "$PSScriptRoot\..\..\$projectName\Test\UnitTest\Release"
    Test-Vlpp-Platform "$projectName" $subProjectName x64 "$PSScriptRoot\..\..\$projectName\Test\UnitTest\x64\Release"
}

function Test-Vlpp($projectName) {
    Test-Vlpp-SubProject $projectName "UnitTest"
}

function Build-Vlpp {
    # Run test cases
    Test-Vlpp "Vlpp"
}

function Update-Vlpp {
    # Release
    Release-Project Vlpp
}