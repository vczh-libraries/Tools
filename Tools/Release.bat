copy ParserGen.exe ..\..\Release\Tools\ParserGen.exe
copy GacGen.exe ..\..\Release\Tools\GacGen.exe
pushd ..\..\Release
pushd .\Import
call Import.bat
popd
pushd .\Tutorial
call Codegen.bat
pushd .\GacUI_HelloWorlds
MSBUILD GacUI_HelloWorlds.sln /p:Configuration=Debug;Platform=Win32
popd
pushd .\GacUI_Layout
MSBUILD GacUI_Layout.sln /p:Configuration=Debug;Platform=Win32
popd
popd
popd