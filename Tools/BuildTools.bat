rmdir /S /Q .\.Output
rmdir /S /Q .\.vs
del *.wait.tmp
del *.exe
del *.dll

start RunAndLock %RANDOM% "MSBUILD DocTools\DocTools.sln									/p:Configuration=Release;OutputPath=..\..\.Output\"
start RunAndLock %RANDOM% "MSBuild ..\..\Vlpp\Tools\CodePack\CodePack\CodePack.vcxproj		/p:Configuration=Release;Platform=x86;OutDir=..\..\..\..\Tools\Tools\.Output\"
start RunAndLock %RANDOM% "MSBuild ..\..\Vlpp\Tools\ParserGen\ParserGen\ParserGen.vcxproj	/p:Configuration=Release;Platform=x86;OutDir=..\..\..\..\Tools\Tools\.Output\"
start RunAndLock %RANDOM% "MSBuild ..\..\Workflow\Tools\CppMerge\CppMerge\CppMerge.vcxproj	/p:Configuration=Release;Platform=x86;OutDir=..\..\..\..\Tools\Tools\.Output\"
start RunAndLock %RANDOM% "MSBuild ..\..\GacUI\Tools\GacGen\GacGen\GacGen.vcxproj			/p:Configuration=Release;Platform=x86;OutDir=..\..\..\..\Tools\Tools\.Output\GacGen(x32)\"
start RunAndLock %RANDOM% "MSBuild ..\..\GacUI\Tools\GacGen\GacGen\GacGen.vcxproj			/p:Configuration=Release;Platform=x64;OutDir=..\..\..\..\Tools\Tools\.Output\GacGen(x64)\"

call WaitForLock

copy .Output\*.exe *.exe
copy .Output\*.dll *.dll
copy .Output\GacGen(x32)\GacGen.exe GacGen32.exe
copy .Output\GacGen(x64)\GacGen.exe GacGen64.exe