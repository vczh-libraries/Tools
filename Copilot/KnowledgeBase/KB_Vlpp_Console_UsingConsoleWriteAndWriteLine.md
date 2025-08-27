# Using Console Write and WriteLine

The Vlpp library provides console output functionality through the `Console` class in the `vl::console` namespace. This provides cross-platform console text output capabilities.

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

### Simple Text Output

```cpp
#include "Vlpp.h"

using namespace vl;
using namespace vl::console;

int main()
{
    // Write text without newline
    Console::Write(L"Hello ");
    Console::Write(L"World");
    
    // Write text with newline  
    Console::WriteLine(L"!");
    
    // Output: Hello World!
    //         (cursor on next line)
    
    return 0;
}
```

### Working with WString

```cpp
WString message = WString::Unmanaged(L"Welcome to Vlpp");
Console::WriteLine(message);

// Concatenate strings
WString name = WString::Unmanaged(L"Alice");
Console::WriteLine(WString::Unmanaged(L"Hello, ") + name + WString::Unmanaged(L"!"));
```

### Writing Numbers

Convert numbers to strings before output:

```cpp
vint number = 42;
Console::WriteLine(WString::Unmanaged(L"The answer is: ") + itow(number));

double pi = 3.14159;
Console::WriteLine(WString::Unmanaged(L"Pi = ") + ftow(pi));

// Boolean values
bool isTrue = true;
Console::WriteLine(isTrue ? L"True" : L"False");
```

## Cross-Platform Implementation

The Console implementation is platform-specific:

### Windows Implementation
- Uses Windows Console APIs (`WriteConsole`, `WriteFile`)
- Handles both console and file output redirection
- Supports Unicode output through `WriteConsole`
- Falls back to code page conversion for file redirection

### Linux Implementation  
- Uses standard C++ streams (`std::wcout`)
- Converts wide characters to the system encoding
- Handles UTF-8 output correctly

## Common Usage Patterns

### Debug Output

```cpp
void DebugInfo(const WString& context, vint value)
{
    Console::Write(L"[DEBUG] ");
    Console::Write(context);
    Console::Write(L": ");
    Console::WriteLine(itow(value));
}

// Usage
DebugInfo(L"Loop counter", 5);
// Output: [DEBUG] Loop counter: 5
```

### Progress Reporting

```cpp
void ReportProgress(vint current, vint total)
{
    Console::Write(L"Progress: ");
    Console::Write(itow(current));
    Console::Write(L"/");
    Console::Write(itow(total));
    Console::Write(L" (");
    Console::Write(itow((current * 100) / total));
    Console::WriteLine(L"%)");
}

// Usage
for (vint i = 1; i <= 10; i++)
{
    ReportProgress(i, 10);
    // Simulate work
}
```

### Error Reporting

```cpp
void ReportError(const WString& operation, const Exception& ex)
{
    Console::Write(L"ERROR in ");
    Console::Write(operation);
    Console::Write(L": ");
    Console::WriteLine(ex.Message());
}

try
{
    // Some operation that might fail
}
catch (const Exception& ex)
{
    ReportError(L"file processing", ex);
}
```

### Formatted Output

```cpp
void PrintUserInfo(const WString& name, vint age, const WString& city)
{
    Console::WriteLine(L"User Information:");
    Console::WriteLine(L"  Name: " + name);
    Console::WriteLine(L"  Age: " + itow(age));
    Console::WriteLine(L"  City: " + city);
}

// Usage
PrintUserInfo(L"John Doe", 30, L"New York");
```

## Additional Console Features

Besides Write and WriteLine, the Console class provides other useful methods:

### Reading Input
```cpp
WString input = Console::Read();  // Read a line from console
```

### Setting Console Colors (Windows only)
```cpp
Console::SetColor(true, false, false, false);  // Red text
Console::WriteLine(L"This is red text");
```

### Setting Console Title (Windows only)
```cpp
Console::SetTitle(L"My Application");
```

## Best Practices

1. **Use WString consistently** - Always work with `WString` rather than raw `wchar_t*`
2. **Handle encoding properly** - The Console automatically handles platform-specific encoding
3. **Use WriteLine for line-based output** - More efficient than Write + newline
4. **Convert data before output** - Use `itow`, `ftow`, etc. for numbers
5. **Consider buffering** - For high-volume output, consider using streams

## Example: Simple Logging Function

```cpp
enum class LogLevel { Info, Warning, Error };

void Log(LogLevel level, const WString& message)
{
    WString prefix;
    switch (level)
    {
    case LogLevel::Info:    prefix = L"[INFO] "; break;
    case LogLevel::Warning: prefix = L"[WARN] "; break;
    case LogLevel::Error:   prefix = L"[ERR ] "; break;
    }
    
    Console::WriteLine(prefix + message);
}

// Usage
Log(LogLevel::Info, L"Application started");
Log(LogLevel::Warning, L"Configuration file not found, using defaults");
Log(LogLevel::Error, L"Failed to connect to database");
```

The Console functionality provides a simple, cross-platform way to output text to the terminal, handling the complexity of character encoding and platform differences automatically.