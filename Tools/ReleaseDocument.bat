pushd ..\..\GacUI\Document
call BuildDocument.bat
popd
pushd ..\..\vczh-libraries.github.io\Doc\Data
del *.xml /Q > NUL
call CopyData.bat
popd