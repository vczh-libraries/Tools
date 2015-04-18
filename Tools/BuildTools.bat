mkdir .Output

MSBUILD Codepack\Codepack.sln                                   /p:Configuration=Release;OutputPath=..\..\.Output\
MSBuild ..\..\Vlpp\Tools\ParserGen\ParserGen\ParserGen.vcxproj	/p:Configuration=Release;Platform=x86;OutDir=..\..\..\..\Tools\Tools\.Output\
MSBuild ..\..\GacUI\Tools\GacGen\GacGen\GacGen.vcxproj		/p:Configuration=Release;Platform=x86;OutDir=..\..\..\..\Tools\Tools\.Output\

copy .Output\*.exe *.exe
copy .Output\*.dll *.dll