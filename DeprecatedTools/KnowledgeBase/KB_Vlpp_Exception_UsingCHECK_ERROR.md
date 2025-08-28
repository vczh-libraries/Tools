# Using CHECK_ERROR Macro

The `CHECK_ERROR` macro raises an `Error` when an assertion condition fails. It's designed for validating critical programming conditions that should never be false in correct code.

## Syntax

```cpp
CHECK_ERROR(condition, L"error-message")
```

- **condition**: A boolean expression that should be true in correct code
- **error-message**: A wide string literal describing the error

## When to Use CHECK_ERROR

Use `CHECK_ERROR` to validate:
- Function preconditions that must be met
- Array bounds and index validations  
- Pointer validity checks
- State consistency validations
- Critical algorithm invariants

## Basic Usage

```cpp
#include "Vlpp.h"
using namespace vl;

// Array bounds checking
void ProcessArrayElement(Array<vint>& arr, vint index)
{
    CHECK_ERROR(index >= 0, L"Array index cannot be negative");
    CHECK_ERROR(index < arr.Count(), L"Array index exceeds array bounds");
    
    arr[index] = arr[index] * 2;
}

// Pointer validation
void ProcessString(const wchar_t* str)
{
    CHECK_ERROR(str != nullptr, L"String pointer cannot be null");
    
    vint length = wcslen(str);
    // ... process string ...
}

// Smart pointer validation
void ProcessResource(Ptr<SomeResource> resource)
{
    CHECK_ERROR(resource, L"Resource pointer cannot be empty");
    
    resource->DoSomething();
}

// State consistency
class FileProcessor
{
private:
    bool isInitialized;
    
public:
    void Initialize()
    {
        CHECK_ERROR(!isInitialized, L"FileProcessor is already initialized");
        isInitialized = true;
    }
    
    void Process()
    {
        CHECK_ERROR(isInitialized, L"FileProcessor must be initialized before processing");
        // ... processing logic ...
    }
};

// Function preconditions
void DivideNumbers(double numerator, double denominator, double& result)
{
    CHECK_ERROR(denominator != 0.0, L"Denominator cannot be zero");
    CHECK_ERROR(!isnan(numerator), L"Numerator cannot be NaN");
    
    result = numerator / denominator;
}
```

## Best Practices

### Use CHECK_ERROR For:
- Programming logic validation
- Precondition checking  
- Invariant verification
- Resource validity

### DON'T Use CHECK_ERROR For:
- User input validation (use `Exception`)
- External resource failures (use `Exception`) 
- Business logic validation (use `Exception`)

### Error Message Guidelines

```cpp
// Good: Descriptive and specific
CHECK_ERROR(index < arr.Count(), L"Array index exceeds array bounds");

// Avoid: Too generic
CHECK_ERROR(isValid, L"Invalid state");
```

## Important Notes

- `CHECK_ERROR` raises fatal `Error` that should not be caught
- These represent programming bugs that need to be fixed
- Use `Exception` for user errors and recoverable conditions