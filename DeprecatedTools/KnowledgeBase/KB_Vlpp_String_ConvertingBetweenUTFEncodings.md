# Converting Between UTF Encodings

The Vlpp library provides comprehensive support for converting between different UTF encodings. This is essential when working with different systems or APIs that expect specific character encodings.

## Overview of String Types

Vlpp uses immutable string types with different character encodings:

- `WString`: Wide string using `wchar_t` (UTF-16 on Windows, UTF-32 on other platforms)
- `U8String`: UTF-8 string using `char8_t`
- `U16String`: UTF-16 string using `char16_t`
- `U32String`: UTF-32 string using `char32_t`
- `AString`: ASCII string using `char`

## Using ConvertUtfString Template Function

The most generic way to convert between UTF encodings is using the `ConvertUtfString<From, To>` template function:

```cpp
#include "Vlpp.h"
using namespace vl;

// Convert from WString to UTF-8
WString wideText = WString::Unmanaged(L"Hello, ??!");
auto utf8Text = ConvertUtfString<wchar_t, char8_t>(wideText);

// Convert from UTF-8 to UTF-16
U8String utf8Input = U8String::Unmanaged(u8"Hello, ??!");
auto utf16Text = ConvertUtfString<char8_t, char16_t>(utf8Input);
```

## Using Convenient Type-Specific Functions

For common conversions involving `WString`, Vlpp provides convenient functions:

### Converting WString to Other Encodings
```cpp
WString wideText = WString::Unmanaged(L"Hello, ??!");

// Convert to UTF-8
auto utf8Result = wtou8(wideText);

// Convert to UTF-16
auto utf16Result = wtou16(wideText);

// Convert to UTF-32
auto utf32Result = wtou32(wideText);

// Convert to ASCII (may lose data for non-ASCII characters)
auto asciiResult = wtoa(wideText);
```

### Converting Other Encodings to WString
```cpp
// From UTF-8 to WString
U8String utf8Text = U8String::Unmanaged(u8"Hello, ??!");
auto wideFromUtf8 = u8tow(utf8Text);

// From UTF-16 to WString
U16String utf16Text = U16String::Unmanaged(u"Hello, ??!");
auto wideFromUtf16 = u16tow(utf16Text);

// From UTF-32 to WString
U32String utf32Text = U32String::Unmanaged(U"Hello, ??!");
auto wideFromUtf32 = u32tow(utf32Text);

// From ASCII to WString
AString asciiText = AString::Unmanaged("Hello, World!");
auto wideFromAscii = atow(asciiText);
```

## Cross-Platform Considerations

The behavior of `wchar_t` differs between platforms:
- **Windows**: `wchar_t` is 16-bit (UTF-16)
- **Linux/Unix**: `wchar_t` is 32-bit (UTF-32)

When writing cross-platform code:
```cpp
// This will work correctly on both platforms
WString text = WString::Unmanaged(L"Hello, ??!");
U8String utf8 = wtou8(text);  // Always converts to UTF-8 correctly

// For explicit UTF-16 or UTF-32, use the specific types
U16String utf16Text = U16String::Unmanaged(u"Explicit UTF-16");
U32String utf32Text = U32String::Unmanaged(U"Explicit UTF-32");
```

## Template Usage in Generic Code

When writing template functions that need to convert between arbitrary UTF encodings:

```cpp
template<typename FromChar, typename ToChar>
ObjectString<ToChar> ConvertString(const ObjectString<FromChar>& input)
{
    return ConvertUtfString<FromChar, ToChar>(input);
}

// Usage examples
WString wideText = WString::Unmanaged(L"Hello");
auto utf8Result = ConvertString<wchar_t, char8_t>(wideText);
auto utf16Result = ConvertString<wchar_t, char16_t>(wideText);
```

## Error Handling

UTF conversion functions in Vlpp handle invalid sequences gracefully:
- Invalid UTF sequences are typically replaced with replacement characters
- The conversion functions do not throw exceptions
- Always check the result if data integrity is critical