# Converting Between Double and String

This guideline shows how to convert between `double` values and `WString` representations using Vlpp's built-in conversion functions.

## Overview

Vlpp provides dedicated functions to convert `double` values to and from `WString` format. These functions handle floating-point precision and formatting consistently across platforms, making them preferred over standard library alternatives.

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

void ConvertDoubleToString()
{
    // Convert floating-point numbers
    double pi = 3.14159;
    WString piStr = ftow(pi);
    // piStr contains L"3.14159"
    
    // Convert integer values represented as double
    double wholeNumber = 42.0;
    WString wholeStr = ftow(wholeNumber);
    // wholeStr contains L"42"
    
    // Convert negative values
    double negative = -123.456;
    WString negativeStr = ftow(negative);
    // negativeStr contains L"-123.456"
    
    // Convert very small numbers
    double smallNumber = 0.001;
    WString smallStr = ftow(smallNumber);
    // smallStr contains L"0.001"
}
```

### Converting WString to Double

```cpp
#include "Vlpp.h"
using namespace vl;

void ConvertStringToDouble()
{
    // Convert decimal string to double
    WString decimalStr = L"3.14159";
    double pi = wtof(decimalStr);
    // pi contains 3.14159
    
    // Convert integer string to double
    WString wholeStr = L"42";
    double wholeNumber = wtof(wholeStr);
    // wholeNumber contains 42.0
    
    // Convert negative string to double
    WString negativeStr = L"-123.456";
    double negative = wtof(negativeStr);
    // negative contains -123.456
    
    // Invalid strings return 0.0
    WString invalidStr = L"not a number";
    double invalid = wtof(invalidStr);
    // invalid contains 0.0
}
```

### Practical Usage in Font Size Parsing

This example shows how `ftow` and `wtof` are used in real GacUI code for parsing font sizes:

```cpp
#include "Vlpp.h"
using namespace vl;

struct DocumentFontSize
{
    double size;
    bool relative;
    
    static DocumentFontSize Parse(const WString& value)
    {
        if (value.Length() > 0 && value[value.Length() - 1] == L'x')
        {
            // Parse relative font size (e.g., "1.5x")
            return DocumentFontSize(wtof(value.Left(value.Length() - 1)), true);
        }
        else
        {
            // Parse absolute font size (e.g., "12.5")
            return DocumentFontSize(wtof(value), false);
        }
    }
    
    WString ToString() const
    {
        return ftow(size) + (relative ? L"x" : L"");
    }
};

void UseFontSizeParsing()
{
    // Parse absolute font size
    auto absoluteSize = DocumentFontSize::Parse(L"12.5");
    // absoluteSize.size = 12.5, absoluteSize.relative = false
    
    // Parse relative font size
    auto relativeSize = DocumentFontSize::Parse(L"1.2x");
    // relativeSize.size = 1.2, relativeSize.relative = true
    
    // Convert back to string
    WString absoluteStr = absoluteSize.ToString();
    // absoluteStr contains L"12.5"
    
    WString relativeStr = relativeSize.ToString();
    // relativeStr contains L"1.2x"
}
```

### Building Numeric Messages

```cpp
#include "Vlpp.h"
using namespace vl;

void BuildPercentageMessage()
{
    double completionRate = 0.856;
    double percentage = completionRate * 100.0;
    
    WString message = L"Progress: " 
                    + ftow(percentage) 
                    + L"% completed.";
    
    // message contains: L"Progress: 85.6% completed."
}

void BuildMeasurementMessage()
{
    double temperature = 23.7;
    double humidity = 45.2;
    
    WString report = L"Temperature: " 
                   + ftow(temperature) 
                   + L"°C, Humidity: "
                   + ftow(humidity)
                   + L"%";
    
    // report contains: L"Temperature: 23.7°C, Humidity: 45.2%"
}
```

## Implementation Details

### Number Formatting

The `ftow` function uses the underlying platform's floating-point formatting but provides consistent behavior:
- Trailing zeros after decimal point are removed when possible
- Very large or very small numbers may be displayed in scientific notation
- The precision is automatically determined to preserve the significant digits

### Error Handling

The `wtof` function handles invalid input gracefully:
- Returns `0.0` for strings that cannot be parsed as numbers
- Partial parsing stops at the first invalid character
- Empty or null strings return `0.0`

### Cross-Platform Consistency

These functions provide consistent formatting across Windows and Linux platforms, avoiding platform-specific differences in floating-point string representation.

## Related Functions

For testing conversion validity before using the result:
- `wtof_test(const WString& string, bool& success)` - Test if string can be converted to double

For other numeric conversions:
- `itow()`, `wtoi()` - Convert between `vint` and `WString`
- `i64tow()`, `wtoi64()` - Convert between `vint64_t` and `WString`
- `utow()`, `wtou()` - Convert between `vuint` and `WString`
- `u64tow()`, `wtou64()` - Convert between `vuint64_t` and `WString`