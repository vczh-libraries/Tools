#include <Windows.h>
#include "dia2.h"
#include "diacreate.h"
#include "..\..\..\Import\Vlpp.h"

#pragma comment(lib, "diaguids.lib")

using namespace vl;
using namespace vl::console;

namespace dumppdb
{
	extern void DumpPdbToXml(IDiaSymbol* exeSymbol, const wchar_t* xml);
}

IDiaSymbol* CreateDiaSymbol(const wchar_t* pdbPath)
{
    IDiaDataSource* pSource=0;
    IDiaSession* pSession=0;
    IDiaSymbol* pSymbol=0;
    CoInitialize(NULL);
    //HRESULT hr = CoCreateInstance(
    //    CLSID_DiaSource,
    //    NULL,
    //    CLSCTX_INPROC_SERVER,
    //    IID_IDiaDataSource,
    //    (void**) &pSource
    //    );
	HRESULT hr = NoRegCoCreate(
		L"msdia110.dll",
		CLSID_DiaSource,
		IID_IDiaDataSource,
        (void**) &pSource
        );
    if(SUCCEEDED(hr))
	if(SUCCEEDED(pSource->loadDataFromPdb(pdbPath)))
    if(SUCCEEDED(pSource->openSession(&pSession)))
	if(SUCCEEDED(pSession->get_globalScope(&pSymbol)))
	{
		return pSymbol;
	}
	return 0;
}

int wmain(int argc, wchar_t* argv[])
{
	if(argc==3)
	{
		Console::WriteLine(WString(L"importing ")+argv[1]);
		IDiaSymbol* exeSymbol=CreateDiaSymbol(argv[1]);
		if(exeSymbol)
		{
			Console::WriteLine(WString(L"exporting ")+argv[2]);
			dumppdb::DumpPdbToXml(exeSymbol, argv[2]);
			Console::WriteLine(WString(L"exported ")+argv[2]);
		}
		else
		{
			Console::WriteLine(WString(L"Failed to read pdb(")+argv[1]+L")");
		}
	}
	else
	{
		Console::WriteLine(L"PdbDump.exe <pdb-path> <xml-path>");
	}
	return 0;
}