function Test-Vlpp-Platform($projectName, $platform, $outDir) {
    Build-Sln $PSScriptRoot\..\..\$projectName\Test\UnitTest\UnitTest\UnitTest.vcxproj Release $platform OutDir "`"$outDir\`""
    if (!(Test-Path "$outDir\UnitTest.exe")) {
        throw "Failed"
    }

    Write-Host "Executing Unit Test ($platform) ..."
    Start-Process-And-Wait (,("$outDir\UnitTest.exe", ""))
}

function Test-Vlpp($projectName) {
    Test-Vlpp-Platform "$projectName" x86 "$PSScriptRoot\..\..\$projectName\Test\UnitTest\Release"
    Test-Vlpp-Platform "$projectName" x64 "$PSScriptRoot\..\..\$projectName\Test\UnitTest\x64\Release"
}

function Update-Vlpp {
    # Run test cases
    Test-Vlpp "Vlpp"

    # Release
    Release-Project Vlpp
}