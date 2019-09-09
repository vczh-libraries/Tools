function Test-Vlpp-Platform($project, $platform, $outDir) {
    Build-Sln $PSScriptRoot\..\..\$project\Test\UnitTest\UnitTest\UnitTest.vcxproj Release $platform OutDir "`"$outDir\`""
    if (!(Test-Path "$outDir\UnitTest.exe")) {
        throw "Failed"
    }

    Write-Host "Executing Unit Test ($platform) ..."
    Start-Process-And-Wait (,("$outDir\UnitTest.exe", ""))
}

function Test-Vlpp($project) {
    Test-Vlpp-Platform $project x86 "$PSScriptRoot\..\..\$project\Test\UnitTest\Release"
    Test-Vlpp-Platform $project x64 "$PSScriptRoot\..\..\$project\Test\UnitTest\x64\Release"
}

function Update-Vlpp {
    # Run test cases
    Test-Vlpp "Vlpp"

    # Release
    Release-Project Vlpp
}