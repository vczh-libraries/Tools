# Using Console Write and WriteLine

The Vlpp library provides console output functionality through the `Console` class in the `vl::console` namespace.

## Available Console Methods

### Console::Write
Outputs text to the console without adding a newline:

```cpp
Console::Write(const wchar_t* string);
Console::Write(const WString& string);
Console::Write(const wchar_t* string, vint length);
```

### Console::WriteLine
Outputs text to the console followed by a newline:

```cpp
Console::WriteLine(const WString& string);
```

## Basic Usage

```cpp
#include "Vlpp.h"

using namespace vl;
using namespace vl::console;

// Write without newline
Console::Write(L"Hello ");
Console::Write(L"World");

// Write with newline  
Console::WriteLine(L"!");

// With WString
WString message = WString::Unmanaged(L"Welcome to Vlpp");
Console::WriteLine(message);

// Numbers need conversion
vint number = 42;
Console::WriteLine(WString::Unmanaged(L"Value: ") + itow(number));

double pi = 3.14159;
Console::WriteLine(WString::Unmanaged(L"Pi = ") + ftow(pi));
```

## Additional Console Methods

```cpp
// Reading input
WString input = Console::Read();

// Setting console colors (Windows only)
Console::SetColor(true, false, false, false);  // Red text

// Setting console title (Windows only)
Console::SetTitle(L"My Application");
```

## Cross-Platform Implementation

- **Windows**: Uses Console APIs with Unicode support
- **Linux**: Uses standard C++ streams with UTF-8 conversion

The Console functionality automatically handles platform-specific encoding and character conversion.