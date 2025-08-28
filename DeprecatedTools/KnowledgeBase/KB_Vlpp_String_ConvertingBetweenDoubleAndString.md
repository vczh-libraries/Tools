# Converting Between Double and String

This guideline shows how to convert between `double` values and `WString` representations using Vlpp's built-in conversion functions.

## Overview

Vlpp provides dedicated functions to convert `double` values to and from `WString` format. These functions handle floating-point precision and formatting consistently across platforms.

## Available Functions

### Double to WString Conversion

- `ftow(double number)` - Convert `double` to `WString`

### WString to Double Conversion

- `wtof(const WString& string)` - Convert `WString` to `double`

## Usage Examples

### Converting Double to WString

```cpp
#include "Vlpp.h"
using namespace vl;

// Convert floating-point numbers
double pi = 3.14159;
WString piStr = ftow(pi);        // L"3.14159"

// Convert integer values represented as double
double wholeNumber = 42.0;
WString wholeStr = ftow(wholeNumber);  // L"42"

// Convert negative values
double negative = -123.456;
WString negativeStr = ftow(negative);  // L"-123.456"
```

### Converting WString to Double

```cpp
// Convert decimal string to double
WString decimalStr = L"3.14159";
double pi = wtof(decimalStr);    // 3.14159

// Convert integer string to double
WString wholeStr = L"42";
double wholeNumber = wtof(wholeStr);   // 42.0

// Invalid strings return 0.0
WString invalidStr = L"not a number";
double invalid = wtof(invalidStr);    // 0.0
```

### Practical Usage

```cpp
// Building numeric messages
double percentage = 85.6;
WString message = L"Progress: " + ftow(percentage) + L"% completed.";

// Font size parsing
WString fontSizeStr = L"12.5";
double fontSize = wtof(fontSizeStr);

// With validation
if (fontSizeStr.Length() > 0 && fontSizeStr[fontSizeStr.Length() - 1] == L'x')
{
    // Relative size like "1.5x"
    double relativeSize = wtof(fontSizeStr.Left(fontSizeStr.Length() - 1));
}
else
{
    // Absolute size like "12.5"
    double absoluteSize = wtof(fontSizeStr);
}
```

## Implementation Details

### Number Formatting

- Trailing zeros after decimal point are removed when possible
- Very large or very small numbers may be displayed in scientific notation
- Precision is automatically determined to preserve significant digits

### Error Handling

- `wtof` returns `0.0` for strings that cannot be parsed as numbers
- Partial parsing stops at the first invalid character
- Empty or null strings return `0.0`

### Cross-Platform Consistency

These functions provide consistent formatting across Windows and Linux platforms, avoiding platform-specific differences in floating-point string representation.

## Related Functions

For other numeric conversions:

- `itow()`, `wtoi()` - Convert between `vint` and `WString`
- `i64tow()`, `wtoi64()` - Convert between `vint64_t` and `WString`
- `utow()`, `wtou()` - Convert between `vuint` and `WString`
- `u64tow()`, `wtou64()` - Convert between `vuint64_t` and `WString`