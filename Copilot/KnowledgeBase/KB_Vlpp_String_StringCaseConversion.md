# String Case Conversion

Vlpp provides functions to convert `WString` values between uppercase and lowercase with proper Unicode support.

## Available Functions

- `wupper(const WString& string)` - Convert `WString` to uppercase
- `wlower(const WString& string)` - Convert `WString` to lowercase

## Basic Usage

```cpp
#include "Vlpp.h"
using namespace vl;

// Convert to uppercase
WString text = WString::Unmanaged(L"Hello World");
WString upperText = wupper(text);  // "HELLO WORLD"

// Convert to lowercase
WString mixedCase = WString::Unmanaged(L"GacUI Library");
WString lowerText = wlower(mixedCase);  // "gacui library"
```

## Common Use Cases

### Case-Insensitive Comparison
```cpp
bool CaseInsensitiveEquals(const WString& str1, const WString& str2)
{
    return wlower(str1) == wlower(str2);
}
```

### Normalize User Input
```cpp
WString ProcessCommand(const WString& command)
{
    WString normalizedCommand = wlower(command);
    
    if (normalizedCommand == WString::Unmanaged(L"exit")) {
        // Handle exit command
    }
    return normalizedCommand;
}
```

## Key Features

- **Unicode Support**: Properly handles accented characters and non-Latin scripts
- **Immutable**: Creates new `WString` objects, original strings unchanged
- **Cross-Platform**: Consistent behavior across Windows and Linux
- **Standards Compliant**: Follows Unicode case conversion standards

## Performance Notes

- Functions create new string objects
- Consider caching results for repeated conversions of the same string
- Efficient for typical GUI application string lengths