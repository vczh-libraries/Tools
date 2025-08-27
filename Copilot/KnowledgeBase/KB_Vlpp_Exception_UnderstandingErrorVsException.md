# Understanding Error vs Exception

## Overview

In the Vlpp framework, there are two distinct types of error handling mechanisms: `Error` and `Exception`. Understanding the difference between these two is crucial for proper error handling and application stability.

## Error Class

`Error` is a base class representing **fatal errors** which cannot be recovered by try-catch blocks. These represent conditions that should never happen in a well-functioning program.

### Key Characteristics of Error

- **Fatal and Unrecoverable**: Represents programming errors or system failures that indicate a fundamental problem
- **Should Not Be Caught**: Even if you catch an `Error`, you must always re-raise it in the catch statement
- **Indicates Logic Violations**: Used to report conditions that should never occur in correct code
- **Program State Corruption**: When an `Error` occurs, the program state may be corrupted and continuing execution is unsafe

### When to Use Error

Use `Error` to report:
- Assertion failures in critical logic
- Invalid program states that indicate bugs
- System-level failures that cannot be recovered
- Conditions that represent programming errors rather than user errors

### Example Usage

```cpp
#include "Vlpp.h"
using namespace vl;

void ProcessArray(Array<vint>& arr, vint index)
{
    // Check for programming error - invalid index
    CHECK_ERROR(index >= 0 && index < arr.Count(), L"Index out of bounds");
    
    // Process the array element
    arr[index] = arr[index] * 2;
}

void CriticalFunction()
{
    // This should never happen in correct code
    CHECK_FAIL(L"Critical function reached unreachable state");
}
```

### Catching Error (Rare Cases)

In rare cases where you must catch an `Error`, always re-raise it:

```cpp
try
{
    SomeFunction();
}
catch (const Error& error)
{
    // Log the error or perform cleanup
    LogCriticalError(error.Message());
    
    // MUST re-raise the error
    throw;
}
```

## Exception Class

`Exception` is a base class representing **recoverable errors** that can be handled by try-catch blocks. These represent expected error conditions that the application can handle gracefully.

### Key Characteristics of Exception

- **Recoverable**: Represents errors that the application can handle and continue execution
- **User-Caused Errors**: Often represents errors made by users or external factors
- **Control Flow**: Sometimes used as a control flow mechanism (e.g., early exit from deep recursion)
- **Expected Conditions**: Represents anticipated error scenarios in normal operation

### When to Use Exception

Use `Exception` to report:
- User input validation failures
- File I/O errors that can be handled
- Network communication failures
- Resource allocation failures that can be recovered
- Business logic violations that users can correct

### Example Usage

```cpp
#include "Vlpp.h"
using namespace vl;

class ValidationException : public Exception
{
public:
    ValidationException(const WString& message) 
        : Exception(message) 
    {
    }
};

void ValidateUserInput(const WString& input)
{
    if (input.Length() == 0)
    {
        throw ValidationException(L"Input cannot be empty");
    }
    
    if (input.Length() > 100)
    {
        throw ValidationException(L"Input is too long (maximum 100 characters)");
    }
}

// Usage with proper exception handling
bool ProcessUserInput(const WString& userInput)
{
    try
    {
        ValidateUserInput(userInput);
        // Process the valid input
        return true;
    }
    catch (const ValidationException& ex)
    {
        // Handle the validation error gracefully
        Console::WriteLine(L"Validation Error: " + ex.Message());
        return false;
    }
}
```

## Using Exception for Control Flow

Sometimes `Exception` is used as a control flow mechanism, particularly for early exit from complex operations:

```cpp
class EarlyExitException : public Exception
{
public:
    vint result;
    
    EarlyExitException(vint value) : result(value) {}
};

void DeepRecursiveSearch(/* parameters */)
{
    // ... deep recursive logic ...
    
    if (foundResult)
    {
        // Use exception to quickly exit from deep recursion
        throw EarlyExitException(resultValue);
    }
    
    // Continue recursive search
}

vint PerformComplexSearch()
{
    try
    {
        DeepRecursiveSearch(/* arguments */);
        return -1; // Not found
    }
    catch (const EarlyExitException& ex)
    {
        return ex.result; // Found result
    }
}
```

## Best Practices

### DO use Error for:
- Programming logic violations
- Assertion failures
- System corruption detection
- Conditions that indicate bugs

### DO use Exception for:
- User input validation
- External resource failures
- Business rule violations
- Recoverable error conditions

### DON'T:
- Catch `Error` without re-raising it
- Use `Exception` for programming logic errors
- Use `Error` for user-correctable problems
- Ignore either type of error completely

### Error Handling Strategy

```cpp
void RobustFunction()
{
    try
    {
        // Normal operation
        UserOperation();
    }
    catch (const Error& error)
    {
        // Log critical error and re-raise
        LogCriticalError(error.Message());
        throw; // MUST re-raise
    }
    catch (const Exception& ex)
    {
        // Handle recoverable error
        HandleRecoverableError(ex.Message());
        // Continue execution or return error status
    }
}
```

## Summary

- **Error**: Fatal, unrecoverable conditions that indicate programming bugs or system corruption
- **Exception**: Recoverable errors that represent expected failure conditions
- Always re-raise `Error` if you must catch it
- Use `Exception` for user errors and recoverable conditions
- Choose the appropriate type based on whether the error represents a programming bug (`Error`) or an expected failure condition (`Exception`)