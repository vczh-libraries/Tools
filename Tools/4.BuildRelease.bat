pushd ..\..\Release

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
pushd .\GacUI_Xml
MSBUILD GacUI_Xml.sln /p:Configuration=Debug;Platform=Win32 /m:8
start Debug
popd

popd