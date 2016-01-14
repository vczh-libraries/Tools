copy ParserGen.exe ..\..\Release\Tools\ParserGen.exe
copy GacGen.exe ..\..\Release\Tools\GacGen.exe
pushd ..\..\Release
pushd .\Import
call Import.bat
popd
pushd .\Tutorial
call Codegen.bat
pushd .\GacUI_HelloWorlds
MSBUILD GacUI_HelloWorlds.sln /p:Configuration=Debug;Platform=Win32 /m:8
start Debug
popd
pushd .\GacUI_Layout
MSBUILD GacUI_Layout.sln /p:Configuration=Debug;Platform=Win32 /m:8
start Debug
popd
pushd .\GacUI_Controls
MSBUILD GacUI_Controls.sln /p:Configuration=Debug;Platform=Win32 /m:8
start Debug
popd
pushd .\GacUI_ControlTemplate
MSBUILD GacUI_ControlTemplate.sln /p:Configuration=Debug;Platform=Win32 /m:8
start Debug
popd
popd
popd