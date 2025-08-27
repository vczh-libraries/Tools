# String Case Conversion

This guideline shows how to convert string case (uppercase/lowercase) using Vlpp's built-in conversion functions.

## Overview

Vlpp provides dedicated functions to convert `WString` values between uppercase and lowercase. These functions handle Unicode character case conversion properly across platforms, making them preferred over standard library alternatives.

## Available Functions

### Case Conversion Functions

- `wupper(const WString& string)` - Convert `WString` to uppercase
- `wlower(const WString& string)` - Convert `WString` to lowercase

## Usage Examples

### Converting to Uppercase

```cpp
#include "Vlpp.h"
using namespace vl;

void ConvertToUppercase()
{
    // Convert regular text
    WString text = L"Hello World";
    WString upperText = wupper(text);
    // upperText contains L"HELLO WORLD"
    
    // Convert mixed case
    WString mixedCase = L"GacUI Library";
    WString upperMixed = wupper(mixedCase);
    // upperMixed contains L"GACUI LIBRARY"
    
    // Convert text with numbers and symbols
    WString complex = L"Test123!@#";
    WString upperComplex = wupper(complex);
    // upperComplex contains L"TEST123!@#"
    
    // Convert empty string
    WString empty = L"";
    WString upperEmpty = wupper(empty);
    // upperEmpty contains L""
}
```

### Converting to Lowercase

```cpp
#include "Vlpp.h"
using namespace vl;

void ConvertToLowercase()
{
    // Convert regular text
    WString text = L"HELLO WORLD";
    WString lowerText = wlower(text);
    // lowerText contains L"hello world"
    
    // Convert mixed case
    WString mixedCase = L"GacUI Library";
    WString lowerMixed = wlower(mixedCase);
    // lowerMixed contains L"gacui library"
    
    // Convert text with numbers and symbols
    WString complex = L"TEST123!@#";
    WString lowerComplex = wlower(complex);
    // lowerComplex contains L"test123!@#"
    
    // Convert already lowercase text
    WString alreadyLower = L"already lowercase";
    WString stillLower = wlower(alreadyLower);
    // stillLower contains L"already lowercase"
}
```

### Practical Usage Examples

This example shows case-insensitive string comparison:

```cpp
#include "Vlpp.h"
using namespace vl;

bool CaseInsensitiveEquals(const WString& str1, const WString& str2)
{
    return wlower(str1) == wlower(str2);
}

void UseCaseInsensitiveComparison()
{
    WString userInput = L"GacUI";
    WString expected = L"gacui";
    
    if (CaseInsensitiveEquals(userInput, expected))
    {
        // Strings match ignoring case
    }
}
```

### Building Case-Normalized Identifiers

```cpp
#include "Vlpp.h"
using namespace vl;

WString NormalizeIdentifier(const WString& identifier)
{
    // Convert to lowercase for consistent comparison
    return wlower(identifier);
}

void UseNormalizedIdentifiers()
{
    WString className1 = L"MainWindow";
    WString className2 = L"MAINWINDOW";
    WString className3 = L"mainwindow";
    
    WString normalized1 = NormalizeIdentifier(className1);
    WString normalized2 = NormalizeIdentifier(className2);
    WString normalized3 = NormalizeIdentifier(className3);
    
    // All normalized strings are equal: L"mainwindow"
    bool allEqual = (normalized1 == normalized2) && (normalized2 == normalized3);
    // allEqual is true
}
```

### Working with User Input

```cpp
#include "Vlpp.h"
using namespace vl;

WString ProcessUserCommand(const WString& command)
{
    WString normalizedCommand = wlower(command);
    
    if (normalizedCommand == L"exit" || normalizedCommand == L"quit")
    {
        return L"Exiting application...";
    }
    else if (normalizedCommand == L"help")
    {
        return L"Displaying help information...";
    }
    else
    {
        return L"Unknown command: " + command;
    }
}

void HandleUserInput()
{
    // Handle various case inputs
    WString result1 = ProcessUserCommand(L"EXIT");    // "Exiting application..."
    WString result2 = ProcessUserCommand(L"Help");    // "Displaying help information..."
    WString result3 = ProcessUserCommand(L"QUIT");    // "Exiting application..."
    WString result4 = ProcessUserCommand(L"invalid"); // "Unknown command: invalid"
}
```

## Implementation Details

### Unicode Support

The `wupper` and `wlower` functions properly handle Unicode characters:
- They work correctly with accented characters and non-Latin scripts
- Case conversion follows Unicode standards
- Results are consistent across different platforms

### Performance Considerations

- Both functions create new `WString` objects and do not modify the original string
- For repeated case conversions of the same string, consider caching the result
- The functions are efficient for typical string lengths used in GUI applications

### Cross-Platform Consistency

These functions provide consistent case conversion behavior across Windows and Linux platforms, avoiding platform-specific differences in case handling.

## Related Functions

For other string operations:
- `ftow()`, `wtof()` - Convert between `double` and `WString`
- `itow()`, `wtoi()` - Convert between `vint` and `WString`
- String comparison functions in VlppOS Locale support