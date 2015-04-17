#include "..\..\..\Import\Vlpp.h"
#include <Windows.h>

using namespace vl;

WString GetBaseDirectory()
{
	WString baseDirectory;
	{
		wchar_t currentDirectory[MAX_PATH]={0};
		GetCurrentDirectory(MAX_PATH, currentDirectory);
		baseDirectory=currentDirectory;
		if(baseDirectory[baseDirectory.Length()-1]!=L'\\')
		{
			baseDirectory+=L'\\';
		}
	}
	return baseDirectory;
}