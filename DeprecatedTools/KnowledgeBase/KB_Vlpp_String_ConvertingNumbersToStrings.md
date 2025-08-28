# Converting Numbers to Strings

This guideline shows how to convert various numeric types to string representations using Vlpp's built-in conversion functions.

## Overview

Vlpp provides dedicated functions to convert integers and unsigned integers to `WString` (wide string) format. These functions are preferred over standard library alternatives and work consistently across platforms.

## Available Functions

### Integer to WString Conversion

- `itow(vint number)` - Convert `vint` (signed integer) to `WString`
- `i64tow(vint64_t number)` - Convert `vint64_t` (64-bit signed integer) to `WString`
- `utow(vuint number)` - Convert `vuint` (unsigned integer) to `WString`  
- `u64tow(vuint64_t number)` - Convert `vuint64_t` (64-bit unsigned integer) to `WString`

## Usage Examples

### Converting Basic Integer Types

```cpp
#include "Vlpp.h"
using namespace vl;

// Convert signed integers
vint signedNumber = 42;
WString signedStr = itow(signedNumber);      // L"42"

// Convert unsigned integers
vuint unsignedNumber = 100U;
WString unsignedStr = utow(unsignedNumber);  // L"100"

// Convert negative numbers
vint negativeNumber = -123;
WString negativeStr = itow(negativeNumber);  // L"-123"
```

### Converting 64-bit Integer Types

```cpp
// Convert 64-bit signed integers
vint64_t largeSignedNumber = 9223372036854775807LL;
WString largeSignedStr = i64tow(largeSignedNumber);
// L"9223372036854775807"

// Convert 64-bit unsigned integers
vuint64_t largeUnsignedNumber = 18446744073709551615ULL;
WString largeUnsignedStr = u64tow(largeUnsignedNumber);
// L"18446744073709551615"
```

### Practical Usage in Applications

```cpp
void BuildUserMessage()
{
    vint totalItems = 1250;
    vuint64_t bytesProcessed = 1024ULL * 1024ULL * 500ULL; // 500 MB
    
    WString message = L"Processing completed: " 
                    + itow(totalItems) 
                    + L" items processed, "
                    + u64tow(bytesProcessed) 
                    + L" bytes transferred.";
}

// Building error messages with line numbers
vint lineNumber = 42;
WString error = L"Syntax error on line " + itow(lineNumber);

// Formatting IDs and counts
vuint userId = 12345;
WString userInfo = L"User ID: " + utow(userId);
```

## Type Recommendations

- Use `itow()` for general purpose signed integers (`vint`)
- Use `utow()` for general purpose unsigned integers (`vuint`)  
- Use `i64tow()` when you specifically need 64-bit signed integer conversion
- Use `u64tow()` when you specifically need 64-bit unsigned integer conversion

## Related Functions

For the reverse operation (string to number conversion), see:
- `wtoi()` - Convert `WString` to `vint`
- `wtoi64()` - Convert `WString` to `vint64_t`
- `wtou()` - Convert `WString` to `vuint`
- `wtou64()` - Convert `WString` to `vuint64_t`

For floating-point conversions:
- `ftow()` - Convert `double` to `WString`
- `wtof()` - Convert `WString` to `double`

## Implementation Details

These functions use the underlying platform's conversion routines but provide a consistent interface across Windows and Linux platforms. They handle all standard decimal representations and negative values appropriately for signed types.