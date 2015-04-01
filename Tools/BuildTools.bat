MSBuild PdbTypeParser\PdbTypeParser\PdbTypeParser.csproj	/p:Configuration=Release;OutputPath=..\..\.Output\

MSBuild Codepack\Codepack\Codepack.csproj					/p:Configuration=Release;OutputPath=..\..\.Output\
MSBuild CopyWebsite\CopyWebsite\CopyWebsite.csproj			/p:Configuration=Release;OutputPath=..\..\.Output\
MSBuild GenDocIndex\GenDocIndex\GenDocIndex.csproj			/p:Configuration=Release;OutputPath=..\..\.Output\
MSBuild GenXmlDocRef\GenXmlDocRef\GenXmlDocRef.csproj		/p:Configuration=Release;OutputPath=..\..\.Output\
MSBuild LinkPdbXml\LinkPdbXml\LinkPdbXml.csproj				/p:Configuration=Release;OutputPath=..\..\.Output\
MSBuild Recurcpy\Recurcpy\Recurcpy.csproj					/p:Configuration=Release;OutputPath=..\..\.Output\

MSBuild Fpmacro\Fpmacro\Fpmacro.vcxproj						/p:Configuration=Release;Platform=x86;OutDir=..\..\.Output\
MSBuild ParserGen\ParserGen\ParserGen.vcxproj				/p:Configuration=Release;Platform=x86;OutDir=..\..\.Output\
MSBuild PdbDump\PdbDump\PdbDump.vcxproj						/p:Configuration=Release;Platform=x86;OutDir=..\..\.Output\
REM MSBuild GacGen\GacGen\GacGen.vcxproj						/p:Configuration=Release;Platform=x86;OutDir=..\..\.Output\

copy .Output\*.exe *.exe
copy .Output\*.dll *.dll
copy PdbDump\PdbDump\msdia110.dll msdia110.dll