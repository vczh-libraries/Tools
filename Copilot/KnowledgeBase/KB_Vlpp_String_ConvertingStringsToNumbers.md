# Converting Strings to Numbers

The Vlpp library provides comprehensive functions for converting strings to various numeric types. These functions are safe and handle conversion errors gracefully by returning 0 when the conversion fails.

## Overview of String-to-Number Functions

Vlpp offers conversion functions for both `WString` (wide character) and `AString` (ASCII character) types:

- `wtoi()`: Convert `WString` to signed integer (`vint`)
- `wtoi64()`: Convert `WString` to signed 64-bit integer (`vint64_t`)
- `wtou()`: Convert `WString` to unsigned integer (`vuint`)
- `wtou64()`: Convert `WString` to unsigned 64-bit integer (`vuint64_t`)
- `wtof()`: Convert `WString` to double-precision floating point

The ASCII equivalents are:
- `atoi()`: Convert `AString` to signed integer (`vint`)
- `atoi64()`: Convert `AString` to signed 64-bit integer (`vint64_t`)
- `atou()`: Convert `AString` to unsigned integer (`vuint`)
- `atou64()`: Convert `AString` to unsigned 64-bit integer (`vuint64_t`)
- `atof()`: Convert `AString` to double-precision floating point

## Using Wide String Conversion Functions

```cpp
#include "Vlpp.h"
using namespace vl;

// Convert WString to signed integer
WString numberStr = WString::Unmanaged(L"12345");
vint value = wtoi(numberStr);        // Result: 12345

// Convert WString to 64-bit signed integer
WString bigNumberStr = WString::Unmanaged(L"9223372036854775807");
vint64_t bigValue = wtoi64(bigNumberStr);

// Convert WString to unsigned integer
WString unsignedStr = WString::Unmanaged(L"4294967295");
vuint unsignedValue = wtou(unsignedStr);

// Convert WString to 64-bit unsigned integer
WString bigUnsignedStr = WString::Unmanaged(L"18446744073709551615");
vuint64_t bigUnsignedValue = wtou64(bigUnsignedStr);

// Convert WString to double
WString floatStr = WString::Unmanaged(L"3.14159");
double floatValue = wtof(floatStr);  // Result: 3.14159
```

## Using ASCII String Conversion Functions

```cpp
#include "Vlpp.h"
using namespace vl;

// Convert AString to signed integer
AString numberStr = AString::Unmanaged("12345");
vint value = atoi(numberStr);        // Result: 12345

// Convert AString to 64-bit signed integer
AString bigNumberStr = AString::Unmanaged("9223372036854775807");
vint64_t bigValue = atoi64(bigNumberStr);

// Convert AString to unsigned integer
AString unsignedStr = AString::Unmanaged("4294967295");
vuint unsignedValue = atou(unsignedStr);

// Convert AString to 64-bit unsigned integer
AString bigUnsignedStr = AString::Unmanaged("18446744073709551615");
vuint64_t bigUnsignedValue = atou64(bigUnsignedStr);

// Convert AString to double
AString floatStr = AString::Unmanaged("3.14159");
double floatValue = atof(floatStr);  // Result: 3.14159
```

## Error Handling with Test Functions

For cases where you need to detect conversion failures, Vlpp provides test versions of these functions that return a success flag:

```cpp
#include "Vlpp.h"
using namespace vl;

// Test conversion with success detection
WString invalidStr = WString::Unmanaged(L"not_a_number");
bool success = false;
vint result = wtoi_test(invalidStr, success);

if (success) {
    // Conversion succeeded, use result
    Console::WriteLine(L"Converted value: " + itow(result));
} else {
    // Conversion failed
    Console::WriteLine(L"Failed to convert string to number");
}

// Similar pattern for other types
vint64_t result64 = wtoi64_test(invalidStr, success);
vuint resultU = wtou_test(invalidStr, success);
vuint64_t resultU64 = wtou64_test(invalidStr, success);
double resultF = wtof_test(invalidStr, success);
```

## Conversion Behavior

### Valid Input Handling
- Functions parse the string from the beginning until an invalid character is encountered
- Leading whitespace is typically ignored
- Valid numeric formats include signs (+ or -) for signed types
- Floating point numbers support decimal points and scientific notation

### Invalid Input Handling
- If the string cannot be converted to a number, the function returns 0
- Empty strings or strings with no valid numeric content return 0
- Out-of-range values are handled according to the underlying platform behavior

### Examples of Valid and Invalid Inputs

```cpp
#include "Vlpp.h"
using namespace vl;

// Valid conversions
WString valid1 = WString::Unmanaged(L"123");      // wtoi() returns 123
WString valid2 = WString::Unmanaged(L"-456");     // wtoi() returns -456
WString valid3 = WString::Unmanaged(L"3.14");     // wtof() returns 3.14
WString valid4 = WString::Unmanaged(L"1.23e-4");  // wtof() returns 0.000123

// Invalid conversions (all return 0)
WString invalid1 = WString::Unmanaged(L"abc");    // wtoi() returns 0
WString invalid2 = WString::Unmanaged(L"");       // wtoi() returns 0
WString invalid3 = WString::Unmanaged(L"123abc"); // May partially convert depending on implementation
```

## Cross-Platform Considerations

These conversion functions work consistently across Windows and Linux platforms. The underlying implementation uses platform-specific functions but provides a unified interface and behavior.

## Best Practices

1. **Use test functions when error detection is important**: If your application needs to handle conversion failures, use the `_test` versions of the functions.

2. **Choose appropriate numeric types**: Use `vint` for general integers, `vint64_t` for large integers, and `vuint`/`vuint64_t` for unsigned values.

3. **Validate input when possible**: Consider validating string format before conversion if you expect specific numeric formats.

4. **Prefer WString functions**: Since Vlpp primarily works with wide characters, prefer the `wto*` functions unless you specifically need ASCII conversion.