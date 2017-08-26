pushd ..\..\Release
call Import\Import.bat
call Tools\Deploy.bat
popd

@for /D /R ..\..\Release\Tutorial %%i in (.) do @ (
	if exist %%i\Codegen.bat (
		pushd %%i
		call Codegen.bat
		popd
	)
)