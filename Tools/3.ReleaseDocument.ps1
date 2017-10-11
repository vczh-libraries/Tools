. $PSScriptRoot\Common.ps1

# Prevent from displaying "Debug or Close Application" dialog on crash
$dontshowui_key = "HKCU:\Software\Microsoft\Windows\Windows Error Reporting"
$dontshowui_value = (Get-ItemProperty $dontshowui_key).DontShowUI
Set-ItemProperty $dontshowui_key -Name DontShowUI -Value 1
Push-Location $PSScriptRoot | Out-Null

function Parse-Header($Platform) {
    Write-Host "Compiling $Platform Headers ..."
    Start-Process-And-Wait (,("$PSScriptRoot\.Output\DocPreprocess.exe", "`"$PSScriptRoot\.Output\Doc\$Platform\Headers.txt`" `"$PSScriptRoot\.Output\Doc\Headers.h`" `"$PSScriptRoot\.Output\Doc`"")) $true
    Start-Process-And-Wait (,("$PSScriptRoot\.Output\DocTokenizer.exe", "`"$PSScriptRoot\.Output\Doc\$Platform\Headers.txt`" `"$PSScriptRoot\.Output\Doc\$Platform\Headers.tokens.txt`"")) $true
    Start-Process-And-Wait (,("$PSScriptRoot\.Output\DocParser.exe", "`"$PSScriptRoot\.Output\Doc\$Platform\Headers.tokens.txt`" `"$PSScriptRoot\.Output\Doc\$Platform\Headers.ast.xml`"")) $true
}

try {
    # Cleaning
    Write-Host "Cleaning ..."
    Build-Sln .\DocTools\DocTools.sln "Release" "Any CPU" "OutputPath"
    Remove-Item .\.Output\Doc -Force -Recurse -ErrorAction SilentlyContinue | Out-Null
    New-Item .\.Output\Doc -ItemType directory -ErrorAction SilentlyContinue | Out-Null
    Copy-Item ..\..\Vlpp\Release\*.h .\.Output\Doc
    Copy-Item ..\..\Vlpp\Release\*.cpp .\.Output\Doc
    Copy-Item ..\..\Workflow\Release\*.h .\.Output\Doc
    Copy-Item ..\..\Workflow\Release\*.cpp .\.Output\Doc
    Copy-Item ..\..\GacUI\Release\GacUI*.h .\.Output\Doc
    Copy-Item ..\..\GacUI\Release\GacUI*.cpp .\.Output\Doc

    Set-Location .\.Output\Doc | Out-Null
    Set-Content .\Headers.h -Value "#include `"GacUICompiler.h`"`r`n#include `"GacUIWindows.h`""

    New-Item .\x86 -ItemType directory | Out-Null
    New-Item .\x64 -ItemType directory | Out-Null
    New-Item .\Index -ItemType directory | Out-Null

    # Preprocess Headers
    Write-Host "Preprocess Headers ..."
    $vsdevcmd = "$($env:VS140COMNTOOLS)VsDevCmd.bat"

    $msbuild_arguments = "cl.exe `"`"$PSScriptRoot\.Output\Doc\Headers.h`" /D WIN32 /D _DEBUG /D WINDOWS /D _UNICODE /D UNICODE /P /C"
    $cmd_arguments = "`"`"$vsdevcmd`" & $msbuild_arguments"
    Start-Process-And-Wait (,($env:ComSpec, "/c $cmd_arguments"))
    Move-Item -Path .\Headers.i -Destination .\x86\Headers.txt
    
    $msbuild_arguments = "cl.exe `"`"$PSScriptRoot\.Output\Doc\Headers.h`" /D _WIN64 /D WIN32 /D _DEBUG /D WINDOWS /D _UNICODE /D UNICODE /P /C"
    $cmd_arguments = "`"`"$vsdevcmd`" & $msbuild_arguments"
    Start-Process-And-Wait (,($env:ComSpec, "/c $cmd_arguments"))
    Move-Item -Path .\Headers.i -Destination .\x64\Headers.txt

    # Compiling Headers
    Parse-Header x86
    Parse-Header x64

    # Building Index
    Write-Host "Building Index ..."
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Pop-Location | Out-Null
Set-ItemProperty $dontshowui_key -Name DontShowUI -Value $dontshowui_value
[Console]::ResetColor()