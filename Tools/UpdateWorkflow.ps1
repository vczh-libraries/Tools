function Test-Workflow-Platform($platform, $vcxproj, $outDir, $executable) {
    Build-Sln $vcxproj Release $platform OutDir "`"$outDir\`""
    if (!(Test-Path "$outDir\$executable")) {
        throw "Failed"
    }

    Write-Host "Executing Unit Test ($platform) ..."
    Start-Process-And-Wait (,("$outDir\$executable", ""))
}

function Test-Workflow {
    Test-Workflow-Platform x86 ..\..\Workflow\Test\UnitTest\UnitTest\UnitTest.vcxproj                       "$PSScriptRoot\..\..\Workflow\Test\UnitTest\Release"     "UnitTest.exe"
    Test-Workflow-Platform x64 ..\..\Workflow\Test\UnitTest\UnitTest\UnitTest.vcxproj                       "$PSScriptRoot\..\..\Workflow\Test\UnitTest\x64\Release" "UnitTest.exe"
    Test-Workflow-Platform x86 ..\..\Workflow\Test\UnitTest\UnitTest_MergeCpp\UnitTest_MergeCpp.vcxproj     "$PSScriptRoot\..\..\Workflow\Test\UnitTest\Release"     "UnitTest_MergeCpp.exe"
    Test-Workflow-Platform x86 ..\..\Workflow\Test\UnitTest\UnitTest_CppCodegen\UnitTest_CppCodegen.vcxproj "$PSScriptRoot\..\..\Workflow\Test\UnitTest\Release"     "UnitTest_CppCodegen.exe"
    Test-Workflow-Platform x64 ..\..\Workflow\Test\UnitTest\UnitTest_CppCodegen\UnitTest_CppCodegen.vcxproj "$PSScriptRoot\..\..\Workflow\Test\UnitTest\x64\Release" "UnitTest_CppCodegen.exe"
}

function Update-Workflow {
    # Run test cases
    Test-Workflow

    # Update Parsers
    Update-Parser ..\..\Workflow\Source\Expression\WfExpression.parser.txt

    # Release Workflow
    Import-Project Workflow ("Vlpp")
    Release-Project Workflow
    Build-Sln ..\..\Workflow\Tools\CppMerge\CppMerge\CppMerge.vcxproj Release x86
    Test-Single-Binary CppMerge.exe
}