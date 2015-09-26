copy ParserGen.exe ..\..\Release\Tools\ParserGen.exe
copy GacGen.exe ..\..\Release\Tools\GacGen.exe
cd ..\..\Release\Import
call Import.bat
cd ..\..\GacUI\Document
call BuildDocument.bat
cd ..\..\vczh-libraries.github.io\Doc\Data
del *.xml /Q > NUL
call CopyData.bat
cd ..\..\..\Tools\Tools