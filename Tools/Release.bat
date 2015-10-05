copy ParserGen.exe ..\..\Release\Tools\ParserGen.exe
copy GacGen.exe ..\..\Release\Tools\GacGen.exe
pushd ..\..\Release\Import
call Import.bat
popd
pushd ..\..\GacUI\Document
call BuildDocument.bat
popd
pushd ..\..\vczh-libraries.github.io\Doc\Data
del *.xml /Q > NUL
call CopyData.bat
popd