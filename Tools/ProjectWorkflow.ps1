function Build-Workflow {
    # Run test cases
    Test-Vlpp-Init "Workflow"
    Test-Vlpp-SubProject "Workflow" "LibraryTest"
    Test-Vlpp-SubProject "Workflow" "CompilerTest_GenerateMetadata"
    Test-Vlpp-SubProject "Workflow" "CompilerTest_LoadAndCompile"
    Test-Vlpp-SubProject "Workflow" "CppTest"
    Test-Vlpp-SubProject "Workflow" "CppTest_Metaonly"
    Test-Vlpp-SubProject "Workflow" "CppTest_Reflection"
    Test-Vlpp-SubProject "Workflow" "RuntimeTest"
    Build-TypeScript-Package "Workflow"
}

function Import-Workflow {
    # Import
    Import-Project Workflow ("Vlpp","VlppOS","VlppRegex","VlppReflection","VlppParser2")

    # Update Parsers
    Update-Parser2 $PSScriptRoot\..\..\Workflow\Source\Parser\Syntax\Parser.xml
}

function Build-Tool-CppMerge {
    Build-Sln $PSScriptRoot\..\..\Workflow\Tools\CppMerge\CppMerge.sln Release x86
    Copy-Tool-Binary $PSScriptRoot\..\..\Workflow\Tools\CppMerge\Release\CppMerge.exe $PSScriptRoot\.Output\CppMerge.exe
    Test-Single-Binary CppMerge.exe
}

function Release-Workflow {
    # Release
    Release-Project Workflow
    Build-Tool-CppMerge
}
