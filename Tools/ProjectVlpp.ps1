function Test-Vlpp-Platform-Init($projectName, $platform) {
    Build-Sln $PSScriptRoot\..\..\$projectName\Test\UnitTest\UnitTest.sln Release $platform
}

function Test-Vlpp-Platform($projectName, $subProjectName, $platform, $outDir) {
    Build-Sln $PSScriptRoot\..\..\$projectName\Test\UnitTest\UnitTest.sln Release $platform -Rebuild $false
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

function Test-Vlpp-Init($projectName) {
    Test-Vlpp-Platform-Init $projectName Win32
    Test-Vlpp-Platform-Init $projectName x64
}

function Test-Vlpp($projectName) {
    Test-Vlpp-Init $projectName
    Test-Vlpp-SubProject $projectName "UnitTest"
}

function Build-Vlpp {
    # Run test cases
    Test-Vlpp "Vlpp"
}

function Import-Vlpp {
    # Import
}

function Release-Vlpp {
    # Release
    Release-Project Vlpp
}
