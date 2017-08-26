pushd ..\..\Release\Tutorial

call :BuildTutorial GacUI_HelloWorlds
call :BuildTutorial GacUI_Layout
call :BuildTutorial GacUI_Controls
call :BuildTutorial GacUI_ControlTemplate
call :BuildTutorial GacUI_Xml

popd
goto :eof

:BuildTutorial
pushd .\%~1
MSBUILD %~1.sln /p:Configuration=Debug;Platform=Win32 /m:8
MSBUILD %~1.sln /p:Configuration=Release;Platform=Win32 /m:8
start Release
popd
exit /b