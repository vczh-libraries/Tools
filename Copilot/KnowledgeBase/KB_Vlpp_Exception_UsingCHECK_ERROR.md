# Using CHECK_ERROR Macro

## Overview

The `CHECK_ERROR` macro is used to raise an `Error` when an assertion condition fails. It's designed for validating critical programming conditions that should never be false in correct code. When the condition evaluates to false, it raises a fatal error that indicates a programming bug or system corruption.

## Syntax

```cpp
CHECK_ERROR(condition, L"error-message")
```

- **condition**: A boolean expression that should be true in correct code
- **error-message**: A wide string literal (prefixed with `L`) describing the error

## When to Use CHECK_ERROR

Use `CHECK_ERROR` to validate:

- Function preconditions that must be met
- Array bounds and index validations
- Pointer validity checks
- State consistency validations
- Critical algorithm invariants
- Resource availability assumptions

## Basic Usage Examples

### Array Bounds Checking

```cpp
#include "Vlpp.h"
using namespace vl;

void ProcessArrayElement(Array<vint>& arr, vint index)
{
    // Validate array bounds - this is a programming error if it fails
    CHECK_ERROR(index >= 0, L"Array index cannot be negative");
    CHECK_ERROR(index < arr.Count(), L"Array index exceeds array bounds");
    
    // Safe to access the array element
    arr[index] = arr[index] * 2;
}

void ProcessArrayRange(Array<vint>& arr, vint startIndex, vint count)
{
    CHECK_ERROR(startIndex >= 0, L"Start index cannot be negative");
    CHECK_ERROR(count >= 0, L"Count cannot be negative");
    CHECK_ERROR(startIndex + count <= arr.Count(), L"Range exceeds array bounds");
    
    // Process the range safely
    for (vint i = startIndex; i < startIndex + count; i++)
    {
        arr[i] = arr[i] + 1;
    }
}
```

### Pointer Validation

```cpp
#include "Vlpp.h"
using namespace vl;

void ProcessString(const wchar_t* str)
{
    // Validate pointer is not null
    CHECK_ERROR(str != nullptr, L"String pointer cannot be null");
    
    // Safe to use the string
    vint length = wcslen(str);
    // ... process string ...
}

void ProcessObject(Object* obj)
{
    CHECK_ERROR(obj != nullptr, L"Object pointer cannot be null");
    
    // Safe to use the object
    // ... process object ...
}
```

### Smart Pointer Validation

```cpp
#include "Vlpp.h"
using namespace vl;

void ProcessResource(Ptr<SomeResource> resource)
{
    // Validate smart pointer contains an object
    CHECK_ERROR(resource, L"Resource pointer cannot be empty");
    
    // Safe to use the resource
    resource->DoSomething();
}

void ProcessNullable(Nullable<vint> value)
{
    // Validate nullable contains a value
    CHECK_ERROR(value, L"Nullable value must contain a value");
    
    // Safe to access the value
    vint actualValue = value.Value();
}
```

### State Consistency Checks

```cpp
#include "Vlpp.h"
using namespace vl;

class FileProcessor
{
private:
    bool isInitialized;
    WString fileName;
    
public:
    FileProcessor() : isInitialized(false) {}
    
    void Initialize(const WString& file)
    {
        CHECK_ERROR(!isInitialized, L"FileProcessor is already initialized");
        
        fileName = file;
        isInitialized = true;
    }
    
    void Process()
    {
        CHECK_ERROR(isInitialized, L"FileProcessor must be initialized before processing");
        CHECK_ERROR(fileName.Length() > 0, L"File name cannot be empty");
        
        // Safe to process the file
        // ... processing logic ...
    }
    
    void Finalize()
    {
        CHECK_ERROR(isInitialized, L"FileProcessor must be initialized before finalizing");
        
        isInitialized = false;
        fileName = WString::Empty;
    }
};
```

### Function Precondition Validation

```cpp
#include "Vlpp.h"
using namespace vl;

void DivideNumbers(double numerator, double denominator, double& result)
{
    // Validate preconditions
    CHECK_ERROR(denominator != 0.0, L"Denominator cannot be zero");
    CHECK_ERROR(!isnan(numerator), L"Numerator cannot be NaN");
    CHECK_ERROR(!isnan(denominator), L"Denominator cannot be NaN");
    
    result = numerator / denominator;
}

void CopyMemory(const void* source, void* destination, vint size)
{
    CHECK_ERROR(source != nullptr, L"Source pointer cannot be null");
    CHECK_ERROR(destination != nullptr, L"Destination pointer cannot be null");
    CHECK_ERROR(size > 0, L"Size must be positive");
    CHECK_ERROR(source != destination, L"Source and destination cannot be the same");
    
    // Safe to copy memory
    memcpy(destination, source, size);
}
```

### Collection Consistency Checks

```cpp
#include "Vlpp.h"
using namespace vl;

void ProcessPair(const Dictionary<WString, vint>& dict, const WString& key)
{
    CHECK_ERROR(dict.Keys().Contains(key), L"Key must exist in dictionary");
    
    vint value = dict[key];
    // ... process the value ...
}

void MergeListsIntoFirst(List<vint>& targetList, const List<vint>& sourceList)
{
    CHECK_ERROR(targetList.Count() >= 0, L"Target list is in invalid state");
    CHECK_ERROR(sourceList.Count() >= 0, L"Source list is in invalid state");
    
    for (vint i = 0; i < sourceList.Count(); i++)
    {
        targetList.Add(sourceList[i]);
    }
}
```

## Complex Condition Examples

### Multiple Condition Validation

```cpp
#include "Vlpp.h"
using namespace vl;

void ProcessRectangle(vint x, vint y, vint width, vint height)
{
    // Validate rectangle parameters
    CHECK_ERROR(width > 0 && height > 0, L"Rectangle dimensions must be positive");
    CHECK_ERROR(x >= 0 && y >= 0, L"Rectangle position must be non-negative");
    CHECK_ERROR(x + width <= 10000 && y + height <= 10000, L"Rectangle exceeds maximum bounds");
    
    // Safe to use rectangle parameters
    // ... process rectangle ...
}
```

### String Validation

```cpp
#include "Vlpp.h"
using namespace vl;

void ProcessUserName(const WString& userName)
{
    CHECK_ERROR(userName.Length() > 0, L"Username cannot be empty");
    CHECK_ERROR(userName.Length() <= 50, L"Username cannot exceed 50 characters");
    CHECK_ERROR(userName.FindFirst(L" ") == -1, L"Username cannot contain spaces");
    
    // Safe to process username
    // ... validation and processing ...
}
```

## Best Practices

### DO Use CHECK_ERROR For:

- **Programming Logic Validation**: Conditions that should never be false in bug-free code
- **Precondition Checking**: Validating function parameters and object state
- **Invariant Verification**: Ensuring critical algorithm conditions
- **Resource Validity**: Checking pointers, handles, and other resources

### DON'T Use CHECK_ERROR For:

- **User Input Validation**: Use `Exception` for user errors instead
- **External Resource Failures**: Use `Exception` for recoverable failures
- **Business Logic Validation**: Use `Exception` for business rule violations
- **Optional Validations**: Use regular if-statements for non-critical checks

### Error Message Guidelines

```cpp
// Good: Descriptive and specific
CHECK_ERROR(index < arr.Count(), L"Array index exceeds array bounds");

// Good: Indicates what value is invalid
CHECK_ERROR(buffer != nullptr, L"Buffer pointer cannot be null");

// Avoid: Too generic
CHECK_ERROR(isValid, L"Invalid state");

// Avoid: No context
CHECK_ERROR(value > 0, L"Error");
```

### Combining with Other Validation

```cpp
#include "Vlpp.h"
using namespace vl;

// Use CHECK_ERROR for programming errors, Exception for user errors
void ProcessFile(const WString& fileName)
{
    // Programming error check
    CHECK_ERROR(fileName.Length() > 0, L"File name parameter cannot be empty");
    
    // User error check (recoverable)
    if (!File(fileName).Exists())
    {
        throw FileNotFoundException(L"File not found: " + fileName);
    }
    
    // Continue processing...
}
```

## When NOT to Catch CHECK_ERROR

Unlike `Exception`, you should generally **never** catch errors raised by `CHECK_ERROR`. These represent programming bugs that need to be fixed, not runtime conditions to handle:

```cpp
// DON'T DO THIS - catching programming errors
try
{
    ProcessArrayElement(arr, -1); // This will CHECK_ERROR
}
catch (const Error&)
{
    // This hides the programming bug!
}

// DO THIS INSTEAD - fix the programming error
if (index >= 0 && index < arr.Count())
{
    ProcessArrayElement(arr, index); // Now it's safe
}
```

## Summary

- **Purpose**: Validate critical programming conditions that should never fail
- **Usage**: `CHECK_ERROR(condition, L"message")`
- **When to Use**: Preconditions, invariants, resource validity checks
- **Error Type**: Raises fatal `Error` that should not be caught
- **Best Practice**: Use descriptive error messages and fix the underlying programming bugs
- **Alternative**: Use `Exception` for user errors and recoverable conditions