function Build-Sln($SolutionFile, $Configuration, $Platform, $OutputVar="OutDir", $OutputFolder="") {
    Write-Host "Building $SolutionFile ..."
    $vsdevcmd = "$($env:VS140COMNTOOLS)VsDevCmd.bat"
    $msbuild_arguments = "MSBUILD `"$SolutionFile`" /t:Rebuild /p:Configuration=`"$Configuration`";Platform=`"$Platform`";$OutputVar=`"$PSScriptRoot\.Output\$OutputFolder"
    $cmd_arguments = "`"`"$vsdevcmd`" & $msbuild_arguments"
    $wait_process = Start-Process $env:ComSpec -ArgumentList "/c $cmd_arguments" -PassThru
    $wait_process.WaitForExit()
}

function Test-Single-Binary($FileName) {
    if (!(Test-Path -Path .\.Output\$FileName)) {
        throw "Failed"
    }
    Copy .\.Output\$FileName $FileName
}

function Test-Single-Binary-Rename($Source, $Target) {
    if (!(Test-Path -Path .\.Output\$Source)) {
        throw "Failed"
    }
    Copy .\.Output\$Source $Target
}

function Import-Project($ProjectName, [String[]]$Dependencies) {
    Write-Host "Importing $ProjectName ..."
    Push-Location ..\..\$ProjectName\Import | Out-Null
    foreach ($dep in $Dependencies) {
        Write-Host "    From $dep"
        Copy-Item ..\..\$dep\Release\*.h .
        Copy-Item ..\..\$dep\Release\*.cpp .
    }
    Pop-Location | Out-Null
}

function Release-Project($ProjectName) {
    Write-Host "Releasing $ProjectName ..."
    Push-Location ..\..\$ProjectName\Release | Out-Null
    $wait_process = Start-Process "$PSScriptRoot\CodePack.exe" -ArgumentList "CodegenConfig.xml" -PassThru
    $wait_process.WaitForExit()
    Pop-Location | Out-Null
}

function Update-Parser($FileName) {
    Write-Host "Updating Parser: $FileName ..."
    $wait_process = Start-Process "$PSScriptRoot\ParserGen.exe" -ArgumentList "$FileName" -PassThru
    $wait_process.WaitForExit()
}

function Update-And-Build-Tools {
    Remove-Item .\*.exe -Force | Out-Null
    Remove-Item .\*.dll -Force | Out-Null
    Remove-Item .\.Output -Force -Recurse | Out-Null
    New-Item .\.Output -ItemType directory | Out-Null

    # Build CodePack.exe
    Build-Sln ..\..\Vlpp\Tools\CodePack\CodePack\CodePack.vcxproj Release x86
    Test-Single-Binary CodePack.exe

    # Release Vlpp
    Release-Project Vlpp

    # Build ParserGen.exe
    Build-Sln ..\..\Vlpp\Tools\ParserGen\ParserGen\ParserGen.vcxproj Release x86
    Test-Single-Binary ParserGen.exe

    # Update Parsers
    Update-Parser ..\..\Vlpp\Source\Parsing\Xml\ParsingXml.parser.txt
    Update-Parser ..\..\Vlpp\Source\Parsing\Json\ParsingJson.parser.txt
    Update-Parser ..\..\Workflow\Source\Expression\WfExpression.parser.txt
    Update-Parser ..\..\GacUI\Source\Compiler\InstanceQuery\GuiInstanceQuery_Parser.parser.txt

    # Release Vlpp
    Release-Project Vlpp

    # Release Workflow
    Import-Project Workflow ("Vlpp")
    Release-Project Workflow
    Build-Sln ..\..\Workflow\Tools\CppMerge\CppMerge\CppMerge.vcxproj Release x86
    Test-Single-Binary CppMerge.exe

    # Release GacUI
    Import-Project GacUI ("Vlpp","Workflow")
    Release-Project GacUI
    Build-Sln ..\..\GacUI\Tools\GacGen\GacGen\GacGen.vcxproj Release x86 OutDir "GacGen(x32)\"
    Test-Single-Binary-Rename "GacGen(x32)\GacGen.exe" GacGen32.exe
    Build-Sln ..\..\GacUI\Tools\GacGen\GacGen\GacGen.vcxproj Release x64 OutDir "GacGen(x64)\"
    Test-Single-Binary-Rename "GacGen(x64)\GacGen.exe" GacGen64.exe
}

function GacGen($FileName) {
    Write-Host "Compiling GacUI Resource: $FileName ..."
    $gacgen_32 = Start-Process "$PSScriptRoot\GacGen32.exe" -ArgumentList "/P $FileName" -PassThru
    $gacgen_64 = Start-Process "$PSScriptRoot\GacGen64.exe" -ArgumentList "/P $FileName" -PassThru
    $gacgen_32.WaitForExit()
    $gacgen_64.WaitForExit()

    if (Test-Path -Path "$($FileName).log\x32\Error.txt") {
        throw "Failed to compile GacUI Resource (x86): $FileName"
    }
    if (Test-Path -Path "$($FileName).log\x64\Error.txt") {
        throw "Failed to compile GacUI Resource (x64): $FileName"
    }
    
    $output_folder = Get-Content "$($FileName).log\x32\CppOutput.txt"
    $x32_folder = "$($FileName).log\x32\Source"
    $x64_folder = "$($FileName).log\x64\Source"
    if (!(Test-Path -Path $output_folder)) {
        New-Item $output_folder -ItemType directory | Out-Null
    }
    Get-ChildItem -Path $output_folder -ErrorAction SilentlyContinue | %{
        Write-Host "Merging C++ Source File: $output_folder\$($_.Name) ..."
        $cppmerge = Start-Process "$PSScriptRoot\CppMerge.exe" -ArgumentList "/P `"$x32_folder\$($_.Name)`" `"$x64_folder\$($_.Name)`" `"$output_folder\$($_.Name)`"" -PassThru
        $cppmerge.WaitForExit();
    }
}

function Update-GacUI-Skins {
    # Update DarkSkin
    Write-Host "Update GacUI::DarkSkin ..."
    Push-Location ..\..\GacUI\Source\Skins\DarkSkin | Out-Null
    try {
        Remove-Item *.xml
        Copy-Item ..\..\..\Test\GacUISrc\Host\Resources\DarkSkin\*.xml .
        GacGen Resource.xml
    }
    finally {
        Pop-Location
    }

    # Release GacUI
    Release-Project GacUI
}

Push-Location $PSScriptRoot | Out-Null

Write-Host "Cleaning ..."

try {
    #Update-And-Build-Tools
    Update-GacUI-Skins
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Pop-Location | Out-Null
[Console]::ResetColor()