# Converting Strings to Numbers

The Vlpp library provides functions for converting strings to various numeric types. These functions return 0 when conversion fails.

## Available Functions

### Wide String Functions (WString)
- `wtoi(WString)`: Convert to signed integer (`vint`)
- `wtoi64(WString)`: Convert to signed 64-bit integer (`vint64_t`)
- `wtou(WString)`: Convert to unsigned integer (`vuint`)
- `wtou64(WString)`: Convert to unsigned 64-bit integer (`vuint64_t`)
- `wtof(WString)`: Convert to double-precision floating point

### ASCII String Functions (AString)
- `atoi(AString)`: Convert to signed integer (`vint`)
- `atoi64(AString)`: Convert to signed 64-bit integer (`vint64_t`)
- `atou(AString)`: Convert to unsigned integer (`vuint`)
- `atou64(AString)`: Convert to unsigned 64-bit integer (`vuint64_t`)
- `atof(AString)`: Convert to double-precision floating point

## Basic Usage

```cpp
// Wide string conversion
WString numberStr = WString::Unmanaged(L"12345");
vint value = wtoi(numberStr);

WString floatStr = WString::Unmanaged(L"3.14159");
double floatValue = wtof(floatStr);

// ASCII string conversion
AString asciiStr = AString::Unmanaged("42");
vint asciiValue = atoi(asciiStr);
```

## Error Detection

Use test versions when you need to detect conversion failures:

```cpp
WString input = WString::Unmanaged(L"not_a_number");
bool success = false;
vint result = wtoi_test(input, success);

if (success) {
    // Use result
} else {
    // Handle conversion failure
}
```

## Conversion Behavior

- Returns 0 for invalid input (empty strings, non-numeric content)
- Parses from beginning until invalid character encountered
- Leading whitespace typically ignored
- Supports signs for signed types, decimal points and scientific notation for floating point

## Best Practices

1. Use `_test` versions when error detection is needed
2. Prefer `wtoi()` family for wide strings (recommended in Vlpp)
3. Choose appropriate numeric types: `vint` for general integers, `vint64_t` for large values