# Using CHECK_FAIL Macro

The `CHECK_FAIL` macro raises an `Error` when code reaches a state that should never be reached. Unlike `CHECK_ERROR` which validates a condition, `CHECK_FAIL` indicates that execution has reached an impossible code path.

## Syntax

```cpp
CHECK_FAIL(L"error-message")
```

- **error-message**: A wide string literal describing why this code path should never be reached

## When to Use CHECK_FAIL

Use `CHECK_FAIL` to mark:
- Unreachable code paths in switch statements
- Impossible conditions in if-else chains  
- Invalid state transitions
- Unimplemented code paths that should be complete

## Basic Usage

```cpp
#include "Vlpp.h"
using namespace vl;

// Unreachable switch cases
enum class OperationType { Add, Subtract, Multiply, Divide };

double PerformOperation(double a, double b, OperationType op)
{
    switch (op)
    {
    case OperationType::Add:      return a + b;
    case OperationType::Subtract: return a - b;
    case OperationType::Multiply: return a * b;
    case OperationType::Divide:   return a / b;
    default:
        CHECK_FAIL(L"Unknown operation type in PerformOperation");
    }
}

// Impossible conditions
void ProcessValue(vint value)
{
    if (value > 0)
    {
        Console::WriteLine(L"Positive");
    }
    else if (value < 0)
    {
        Console::WriteLine(L"Negative");
    }
    else if (value == 0)
    {
        Console::WriteLine(L"Zero");
    }
    else
    {
        // Mathematically impossible for integers
        CHECK_FAIL(L"Integer value is neither positive, negative, nor zero");
    }
}

// State machine validation
enum class ConnectionState { Disconnected, Connecting, Connected };

class NetworkConnection
{
private:
    ConnectionState state;
    
public:
    void OnConnectionComplete()
    {
        switch (state)
        {
        case ConnectionState::Connecting:
            state = ConnectionState::Connected;
            break;
        case ConnectionState::Disconnected:
        case ConnectionState::Connected:
            CHECK_FAIL(L"Received connection complete in invalid state");
        default:
            CHECK_FAIL(L"Unknown connection state");
        }
    }
};

// Variant processing
void ProcessVariant(const Variant<vint, double, WString>& value)
{
    switch (value.Index())
    {
    case 0: Console::WriteLine(L"Integer: " + itow(value.Get<vint>())); break;
    case 1: Console::WriteLine(L"Double: " + ftow(value.Get<double>())); break;
    case 2: Console::WriteLine(L"String: " + value.Get<WString>()); break;
    default:
        CHECK_FAIL(L"Variant contains unexpected type index");
    }
}
```

## Best Practices

### Use CHECK_FAIL For:
- Unreachable code paths
- Impossible conditions  
- Invalid state transitions
- Algorithm invariant violations

### DON'T Use CHECK_FAIL For:
- User input validation (use `Exception`)
- External resource failures (use `Exception`)
- Expected error conditions (use `Exception`)

### Error Message Guidelines

```cpp
// Good: Describes the impossible condition
CHECK_FAIL(L"State machine reached invalid state during transition");

// Avoid: Too generic
CHECK_FAIL(L"This should never happen");
```

## vs CHECK_ERROR

```cpp
// Use CHECK_ERROR when you have a specific condition
CHECK_ERROR(index >= 0, L"Index cannot be negative");

// Use CHECK_FAIL when the mere fact we're here is the problem
default:
    CHECK_FAIL(L"Unknown enum value");
```

- `CHECK_FAIL` raises fatal `Error` that should not be caught
- Use descriptive messages explaining why the path should never execute