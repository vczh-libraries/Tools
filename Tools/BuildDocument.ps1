function Parse-Header($Platform) {
    Write-Host "Compiling $Platform Headers ..."
    Start-Process-And-Wait (,("$PSScriptRoot\.Output\DocPreprocess.exe", "`"$PSScriptRoot\.Output\Doc\$Platform\Headers.txt`" `"$PSScriptRoot\.Output\Doc\Headers.h`" `"$PSScriptRoot\.Output\Doc`"")) $true
    Start-Process-And-Wait (,("$PSScriptRoot\.Output\DocTokenizer.exe", "`"$PSScriptRoot\.Output\Doc\$Platform\Headers.txt`" `"$PSScriptRoot\.Output\Doc\$Platform\Headers.tokens.txt`"")) $true
    Start-Process-And-Wait (,("$PSScriptRoot\.Output\DocParser.exe", "`"$PSScriptRoot\.Output\Doc\$Platform\Headers.tokens.txt`" `"$PSScriptRoot\.Output\Doc\$Platform\Headers.ast.xml`"")) $true
}

function Build-Document {
    Push-Location $PSScriptRoot | Out-Null

    try {
        # Cleaning
        Write-Host "Cleaning ..."
        Build-Sln $PSScriptRoot\.\DocTools\DocTools.sln "Release" "Any CPU" "OutputPath"
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
        $vsdevcmd = $env:VLPP_VSDEVCMD_PATH
        if ($vsdevcmd -eq $null) {
            throw "You have to add an environment variable named VLPP_VSDEVCMD_PATH and set its value to the path of VsDevCmd.bat (e.g. C:\Program Files (x86)\Microsoft Visual Studio\2017\Professional\Common7\Tools\VsDevCmd.bat)"
        }

        $cdcmd = "cd `"$PSScriptRoot\.Output\Doc\`""

        $msbuild_arguments = "cl.exe `"Headers.h /D WIN32 /D _DEBUG /D WINDOWS /D _UNICODE /D UNICODE /P /C"
        $cmd_arguments = "`"`"$vsdevcmd`" & $cdcmd & $msbuild_arguments"
        Start-Process-And-Wait (,($env:ComSpec, "/c $cmd_arguments"))
        Move-Item -Path .\Headers.i -Destination .\x86\Headers.txt
    
        $msbuild_arguments = "cl.exe `"Headers.h /D _WIN64 /D WIN32 /D _DEBUG /D WINDOWS /D _UNICODE /D UNICODE /P /C"
        $cmd_arguments = "`"`"$vsdevcmd`" & $cdcmd & $msbuild_arguments"
        Start-Process-And-Wait (,($env:ComSpec, "/c $cmd_arguments"))
        Move-Item -Path .\Headers.i -Destination .\x64\Headers.txt

        # Compiling Headers
        Parse-Header x86
        Parse-Header x64

        # Building Index
        Write-Host "Building Index ..."
        Start-Process-And-Wait (,("$PSScriptRoot\.Output\DocResolver.exe", "`"x86, Windows`" `"$PSScriptRoot\.Output\Doc\x86\Headers.ast.xml`" `"x64, Windows`" `"$PSScriptRoot\.Output\Doc\x64\Headers.ast.xml`" `"$PSScriptRoot\.Output\Doc\Resolved.ast.xml`"")) $true
        Start-Process-And-Wait (,("$PSScriptRoot\.Output\DocIndex.exe", "`"$PSScriptRoot\.Output\Doc\Resolved.ast.xml`" `"$PSScriptRoot\.Output\Doc\Index`"")) $true

        # Copy
        Write-Host "Copy files to $PSScriptRoot\..\..\vczh-libraries.github.io\Doc\Data"
        Remove-Item "$PSScriptRoot\..\..\vczh-libraries.github.io\Doc\Data\*.*" -Force | Out-Null
        Copy-Item "$PSScriptRoot\.Output\Doc\Index\*.*" "$PSScriptRoot\..\..\vczh-libraries.github.io\Doc\Data" | Out-Null
    }
    catch {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    finally {
        Pop-Location | Out-Null
    }
}

function Build-Document-2 {
    Push-Location "$PSScriptRoot\..\..\Document\.Output" | Out-Null

    try {
        # Cleaning
        Write-Host "Cleaning ..."
        Remove-Item .\Import -Force -Recurse -ErrorAction SilentlyContinue | Out-Null
        
        # Preprocessing
        Write-Host "Preprocessing ..."
        New-Item .\Import -ItemType directory -ErrorAction SilentlyContinue | Out-Null

        Copy-Item ..\..\Vlpp\Release\*.h        .\Import
        Copy-Item ..\..\Vlpp\Release\*.cpp      .\Import
        Copy-Item ..\..\Workflow\Release\*.h    .\Import
        Copy-Item ..\..\Workflow\Release\*.cpp  .\Import
        Copy-Item ..\..\GacUI\Release\*.h       .\Import
        Copy-Item ..\..\GacUI\Release\*.cpp     .\Import

        $vsdevcmd = $env:VLPP_VSDEVCMD_PATH
        if ($vsdevcmd -eq $null) {
            throw "You have to add an environment variable named VLPP_VSDEVCMD_PATH and set its value to the path of VsDevCmd.bat (e.g. C:\Program Files (x86)\Microsoft Visual Studio\2017\Professional\Common7\Tools\VsDevCmd.bat)"
        }

        $cdcmd = "cd `"$PSScriptRoot\..\..\Document\.Output`""
        $msbuild_arguments = "cl.exe `"Includes.cpp /I .\Import /D WIN32 /D _DEBUG /D WINDOWS /D _UNICODE /D UNICODE /P /C"
        $cmd_arguments = "`"`"$vsdevcmd`" & $cdcmd & $msbuild_arguments"
        Start-Process-And-Wait (,($env:ComSpec, "/c $cmd_arguments")) -Inline $true -WorkingDirectory "."
        Move-Item -Path .\Includes.i -Destination .\Import\Preprocessed.txt
    }
    catch {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    finally {
        Pop-Location | Out-Null
    }
}