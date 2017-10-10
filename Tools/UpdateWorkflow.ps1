. $PSScriptRoot\Common.ps1

function Update-Workflow {
    # Update Parsers
    Update-Parser ..\..\Workflow\Source\Expression\WfExpression.parser.txt

    # Release Workflow
    Import-Project Workflow ("Vlpp")
    Release-Project Workflow
    Build-Sln ..\..\Workflow\Tools\CppMerge\CppMerge\CppMerge.vcxproj Release x86
    Test-Single-Binary CppMerge.exe
}