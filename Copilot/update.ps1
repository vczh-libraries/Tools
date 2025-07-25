$files_vlpp = @(
    "general-instructions-1.md",
    "makefile\vlpp.md",
    "general-instructions-2.md",
    "unittest.md"
)

$files_vlppos = @(
    "general-instructions-1.md",
    "makefile\vlppos.md",
    "general-instructions-2.md",
    "unittest.md"
)

$files_vlppregex = @(
    "general-instructions-1.md",
    "makefile\vlppregex.md",
    "general-instructions-2.md",
    "unittest.md"
)

$files_vlppreflection = @(
    "general-instructions-1.md",
    "makefile\vlppreflection.md",
    "general-instructions-2.md",
    "unittest.md"
)

$files_vlppparser2 = @(
    "general-instructions-1.md",
    "makefile\vlppparser2.md",
    "general-instructions-2.md",
    "unittest.md"
)

$files_workflow = @(
    "general-instructions-1.md",
    "makefile\workflow.md",
    "general-instructions-2.md",
    "unittest.md"
)

$files_gacui = @(
    "general-instructions-1.md",
    "makefile\gacui.md",
    "general-instructions-2.md",
    "gacui\unittest.md",
    "gacui\xml.md",
    "gacui\workflow.md"
)

function GeneratePrompt([string]$name, [string[]]$files) {
    $output_path = "$PSScriptRoot\..\..\$name\.github\copilot-instructions.md"
    $output_content = "";
    foreach ($file in $files) {
        $fragment_path = "$PSScriptRoot\$file"
        $fragment_content = Get-Content $fragment_path -Raw
        if ($output_content -eq "") {
            $output_content = $fragment_content
        } else {
            $output_content += "`r`n" + $fragment_content
        }
    }
    Set-Content -Path $output_path -Value $output_content
    
    Write-Host Updated: $output_path
}

GeneratePrompt "Vlpp"           $files_vlpp
GeneratePrompt "VlppOS"         $files_vlppos
GeneratePrompt "VlppRegex"      $files_vlppregex
GeneratePrompt "VlppReflection" $files_vlppreflection
GeneratePrompt "VlppParser2"    $files_vlppparser2
GeneratePrompt "Workflow"       $files_workflow
GeneratePrompt "GacUI"          $files_gacui
