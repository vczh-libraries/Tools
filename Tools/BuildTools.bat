mkdir .Output

MSBUILD DocTools\DocTools.sln									/p:Configuration=Release;OutputPath=..\..\.Output\
MSBuild ..\..\Vlpp\Tools\CodePack\CodePack\CodePack.vcxproj		/p:Configuration=Release;Platform=x86;OutDir=..\..\..\..\Tools\Tools\.Output\
MSBuild ..\..\Vlpp\Tools\ParserGen\ParserGen\ParserGen.vcxproj	/p:Configuration=Release;Platform=x86;OutDir=..\..\..\..\Tools\Tools\.Output\
MSBuild ..\..\Workflow\Tools\CppMerge\CppMerge\CppMerge.vcxproj	/p:Configuration=Release;Platform=x86;OutDir=..\..\..\..\Tools\Tools\.Output\
MSBuild ..\..\GacUI\Tools\GacGen\GacGen\GacGen.vcxproj			/p:Configuration=Release;Platform=x86;OutDir=..\..\..\..\Tools\Tools\.Output\GacGen(x32)\
MSBuild ..\..\GacUI\Tools\GacGen\GacGen\GacGen.vcxproj			/p:Configuration=Release;Platform=x64;OutDir=..\..\..\..\Tools\Tools\.Output\GacGen(x64)\

copy .Output\*.exe *.exe
copy .Output\*.dll *.dll
copy .Output\GacGen(x32)\GacGen.exe GacGen32.exe
copy .Output\GacGen(x64)\GacGen.exe GacGen64.exe