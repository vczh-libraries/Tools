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
    try {
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

        # Release Workflow
        Import-Project Workflow ("Vlpp")
        Release-Project Workflow
        Build-Sln ..\..\Workflow\Tools\CppMerge\CppMerge\CppMerge.vcxproj Release x86
        Test-Single-Binary CppMerge.exe

        # Release GacUI
        Import-Project GacUI ("Vlpp","Workflow")
        Release-Project GacUI
        Build-Sln ..\..\GacUI\Tools\GacGen\GacGen\GacGen.vcxproj Release x86 OutDir "GacGen(x32)"
        Build-Sln ..\..\GacUI\Tools\GacGen\GacGen\GacGen.vcxproj Release x64 OutDir "GacGen(x64)"
        Test-Single-Binary-Rename "GacGen(x32)\GacGen.exe" GacGen32.exe
        Test-Single-Binary-Rename "GacGen(x64)\GacGen.exe" GacGen64.exe
    }
    catch {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Push-Location $PSScriptRoot | Out-Null

Write-Host "Cleaning ..."
Remove-Item .\*.exe -Force | Out-Null
Remove-Item .\*.dll -Force | Out-Null
Remove-Item .\.Output -Force -Recurse | Out-Null
New-Item .\.Output -ItemType directory | Out-Null

Update-And-Build-Tools

Pop-Location | Out-Null