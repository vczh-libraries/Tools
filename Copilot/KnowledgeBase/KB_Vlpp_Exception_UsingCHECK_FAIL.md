# Using CHECK_FAIL Macro

## Overview

The `CHECK_FAIL` macro is used to raise an `Error` when code reaches a state that should never be reached. Unlike `CHECK_ERROR` which validates a condition, `CHECK_FAIL` is used to indicate that the execution has reached an impossible or unreachable code path. It's essentially equivalent to `CHECK_ERROR(false, message)` but more explicit about the intent.

## Syntax

```cpp
CHECK_FAIL(L"error-message")
```

- **error-message**: A wide string literal (prefixed with `L`) describing why this code path should never be reached

## When to Use CHECK_FAIL

Use `CHECK_FAIL` to mark:

- Unreachable code paths in switch statements
- Impossible conditions in if-else chains
- Code that should never execute due to logic
- Fallback cases that indicate programming errors
- Unimplemented code paths that should be complete
- Invalid state transitions

## Basic Usage Examples

### Unreachable Switch Cases

```cpp
#include "Vlpp.h"
using namespace vl;

enum class OperationType
{
    Add,
    Subtract,
    Multiply,
    Divide
};

double PerformOperation(double a, double b, OperationType op)
{
    switch (op)
    {
    case OperationType::Add:
        return a + b;
    case OperationType::Subtract:
        return a - b;
    case OperationType::Multiply:
        return a * b;
    case OperationType::Divide:
        CHECK_ERROR(b != 0.0, L"Division by zero");
        return a / b;
    default:
        // This should never happen if all enum values are handled
        CHECK_FAIL(L"Unknown operation type in PerformOperation");
    }
}
```

### Impossible If-Else Conditions

```cpp
#include "Vlpp.h"
using namespace vl;

void ProcessValue(vint value)
{
    if (value > 0)
    {
        Console::WriteLine(L"Positive value: " + itow(value));
    }
    else if (value < 0)
    {
        Console::WriteLine(L"Negative value: " + itow(value));
    }
    else if (value == 0)
    {
        Console::WriteLine(L"Zero value");
    }
    else
    {
        // This is mathematically impossible for integers
        CHECK_FAIL(L"Integer value is neither positive, negative, nor zero");
    }
}
```

### State Machine Invalid Transitions

```cpp
#include "Vlpp.h"
using namespace vl;

enum class ConnectionState
{
    Disconnected,
    Connecting,
    Connected,
    Disconnecting
};

class NetworkConnection
{
private:
    ConnectionState state;
    
public:
    NetworkConnection() : state(ConnectionState::Disconnected) {}
    
    void Connect()
    {
        switch (state)
        {
        case ConnectionState::Disconnected:
            state = ConnectionState::Connecting;
            // ... start connection process ...
            break;
        case ConnectionState::Connecting:
            // Already connecting, ignore
            break;
        case ConnectionState::Connected:
            // Already connected, ignore
            break;
        case ConnectionState::Disconnecting:
            // Wait for disconnection to complete first
            break;
        default:
            CHECK_FAIL(L"Invalid connection state in Connect method");
        }
    }
    
    void OnConnectionComplete()
    {
        switch (state)
        {
        case ConnectionState::Connecting:
            state = ConnectionState::Connected;
            break;
        case ConnectionState::Disconnected:
        case ConnectionState::Connected:
        case ConnectionState::Disconnecting:
            // These states shouldn't receive connection complete
            CHECK_FAIL(L"Received connection complete in invalid state");
        default:
            CHECK_FAIL(L"Unknown connection state in OnConnectionComplete");
        }
    }
};
```

### Algorithm Invariant Violations

```cpp
#include "Vlpp.h"
using namespace vl;

void BinarySearchImplementation(Array<vint>& sortedArray, vint target)
{
    vint left = 0;
    vint right = sortedArray.Count() - 1;
    
    while (left <= right)
    {
        vint mid = left + (right - left) / 2;
        
        if (sortedArray[mid] == target)
        {
            Console::WriteLine(L"Found at index: " + itow(mid));
            return;
        }
        else if (sortedArray[mid] < target)
        {
            left = mid + 1;
        }
        else if (sortedArray[mid] > target)
        {
            right = mid - 1;
        }
        else
        {
            // This should never happen - comparison must be <, >, or ==
            CHECK_FAIL(L"Invalid comparison result in binary search");
        }
    }
    
    Console::WriteLine(L"Target not found");
}
```

### Parser State Validation

```cpp
#include "Vlpp.h"
using namespace vl;

enum class ParseState
{
    ExpectingIdentifier,
    ExpectingOperator,
    ExpectingValue,
    Complete
};

class ExpressionParser
{
private:
    ParseState currentState;
    
public:
    ExpressionParser() : currentState(ParseState::ExpectingIdentifier) {}
    
    void ProcessToken(const WString& token)
    {
        switch (currentState)
        {
        case ParseState::ExpectingIdentifier:
            if (IsIdentifier(token))
            {
                currentState = ParseState::ExpectingOperator;
            }
            else
            {
                throw ParserException(L"Expected identifier");
            }
            break;
            
        case ParseState::ExpectingOperator:
            if (IsOperator(token))
            {
                currentState = ParseState::ExpectingValue;
            }
            else
            {
                throw ParserException(L"Expected operator");
            }
            break;
            
        case ParseState::ExpectingValue:
            if (IsValue(token))
            {
                currentState = ParseState::Complete;
            }
            else
            {
                throw ParserException(L"Expected value");
            }
            break;
            
        case ParseState::Complete:
            throw ParserException(L"Expression is already complete");
            
        default:
            // This indicates a programming error in state management
            CHECK_FAIL(L"Parser is in an invalid state");
        }
    }
    
private:
    bool IsIdentifier(const WString& token) { /* implementation */ return true; }
    bool IsOperator(const WString& token) { /* implementation */ return true; }
    bool IsValue(const WString& token) { /* implementation */ return true; }
};
```

### Resource Management Validation

```cpp
#include "Vlpp.h"
using namespace vl;

class ResourceManager
{
private:
    enum class ResourceState
    {
        Unallocated,
        Allocated,
        Released
    };
    
    ResourceState state;
    void* resourceHandle;
    
public:
    ResourceManager() : state(ResourceState::Unallocated), resourceHandle(nullptr) {}
    
    void Allocate()
    {
        switch (state)
        {
        case ResourceState::Unallocated:
            resourceHandle = AllocateResource();
            state = ResourceState::Allocated;
            break;
        case ResourceState::Allocated:
            throw ResourceException(L"Resource is already allocated");
        case ResourceState::Released:
            throw ResourceException(L"Cannot allocate released resource");
        default:
            CHECK_FAIL(L"Resource manager is in invalid state during allocation");
        }
    }
    
    void Release()
    {
        switch (state)
        {
        case ResourceState::Allocated:
            ReleaseResource(resourceHandle);
            resourceHandle = nullptr;
            state = ResourceState::Released;
            break;
        case ResourceState::Unallocated:
            // Nothing to release
            break;
        case ResourceState::Released:
            // Already released
            break;
        default:
            CHECK_FAIL(L"Resource manager is in invalid state during release");
        }
    }
    
private:
    void* AllocateResource() { /* implementation */ return nullptr; }
    void ReleaseResource(void* handle) { /* implementation */ }
};
```

## Template and Generic Code Examples

### Type-Based Dispatch

```cpp
#include "Vlpp.h"
using namespace vl;

template<typename T>
void ProcessType(const T& value)
{
    if constexpr (std::is_integral_v<T>)
    {
        Console::WriteLine(L"Processing integer: " + itow(static_cast<vint>(value)));
    }
    else if constexpr (std::is_floating_point_v<T>)
    {
        Console::WriteLine(L"Processing float: " + ftow(static_cast<double>(value)));
    }
    else if constexpr (std::is_same_v<T, WString>)
    {
        Console::WriteLine(L"Processing string: " + value);
    }
    else
    {
        // Template should only be instantiated with supported types
        CHECK_FAIL(L"Unsupported type in ProcessType template");
    }
}
```

### Variant Processing

```cpp
#include "Vlpp.h"
using namespace vl;

void ProcessVariantValue(const Variant<vint, double, WString>& value)
{
    vint index = value.Index();
    
    switch (index)
    {
    case 0: // vint
        Console::WriteLine(L"Integer: " + itow(value.Get<vint>()));
        break;
    case 1: // double
        Console::WriteLine(L"Double: " + ftow(value.Get<double>()));
        break;
    case 2: // WString
        Console::WriteLine(L"String: " + value.Get<WString>());
        break;
    default:
        // Variant should only contain the declared types
        CHECK_FAIL(L"Variant contains unexpected type index");
    }
}
```

## Complex Algorithm Examples

### Tree Traversal Validation

```cpp
#include "Vlpp.h"
using namespace vl;

enum class TraversalMode
{
    PreOrder,
    InOrder,
    PostOrder
};

struct TreeNode
{
    vint value;
    Ptr<TreeNode> left;
    Ptr<TreeNode> right;
};

void TraverseTree(Ptr<TreeNode> node, TraversalMode mode)
{
    if (!node) return;
    
    switch (mode)
    {
    case TraversalMode::PreOrder:
        ProcessNode(node);
        TraverseTree(node->left, mode);
        TraverseTree(node->right, mode);
        break;
        
    case TraversalMode::InOrder:
        TraverseTree(node->left, mode);
        ProcessNode(node);
        TraverseTree(node->right, mode);
        break;
        
    case TraversalMode::PostOrder:
        TraverseTree(node->left, mode);
        TraverseTree(node->right, mode);
        ProcessNode(node);
        break;
        
    default:
        CHECK_FAIL(L"Unknown tree traversal mode");
    }
}

void ProcessNode(Ptr<TreeNode> node) { /* implementation */ }
```

## Best Practices

### DO Use CHECK_FAIL For:

- **Unreachable Code Paths**: Default cases in complete switch statements
- **Impossible Conditions**: Fallback cases in exhaustive if-else chains
- **State Validation**: Invalid state transitions that indicate programming errors
- **Algorithm Invariants**: Conditions that should never occur in correct algorithms
- **Template Constraints**: Unsupported type instantiations

### DON'T Use CHECK_FAIL For:

- **User Input Validation**: Use `Exception` for invalid user input
- **External Resource Failures**: Use `Exception` for file/network errors
- **Expected Error Conditions**: Use `Exception` for recoverable errors
- **Debugging Assertions**: Use regular assert for development-only checks

### Error Message Guidelines

```cpp
// Good: Describes what impossible condition occurred
CHECK_FAIL(L"Binary search reached impossible comparison state");

// Good: Indicates the context and problem
CHECK_FAIL(L"State machine reached invalid state during transition");

// Good: Specific about the algorithmic impossibility
CHECK_FAIL(L"Tree traversal mode is not recognized");

// Avoid: Too generic
CHECK_FAIL(L"This should never happen");

// Avoid: No context
CHECK_FAIL(L"Error");
```

### Comparison with CHECK_ERROR

```cpp
// Use CHECK_ERROR when you have a specific condition to validate
CHECK_ERROR(index >= 0, L"Index cannot be negative");

// Use CHECK_FAIL when no specific condition makes sense
// (the mere fact we're here is the problem)
switch (enumValue)
{
case EnumValue::Value1:
    // handle value1
    break;
case EnumValue::Value2:
    // handle value2
    break;
default:
    CHECK_FAIL(L"Unknown enum value"); // No specific condition to check
}
```

## Integration with Error Handling Strategy

```cpp
void RobustFunction()
{
    try
    {
        // Normal operation that might use CHECK_FAIL internally
        ProcessComplexLogic();
    }
    catch (const Error& error)
    {
        // CHECK_FAIL will raise Error - log and re-raise
        LogCriticalError(error.Message());
        throw; // MUST re-raise
    }
    catch (const Exception& ex)
    {
        // Handle recoverable errors
        HandleRecoverableError(ex.Message());
    }
}

void ProcessComplexLogic()
{
    // ... logic that might reach impossible states ...
    
    if (someImpossibleCondition)
    {
        CHECK_FAIL(L"Logic reached impossible condition");
    }
}
```

## Summary

- **Purpose**: Mark unreachable code paths and impossible conditions
- **Usage**: `CHECK_FAIL(L"message")`
- **When to Use**: Switch defaults, impossible if-else conditions, invalid state transitions
- **Error Type**: Raises fatal `Error` that should not be caught
- **vs CHECK_ERROR**: Use when there's no specific condition to check, just an impossible situation
- **Best Practice**: Use descriptive messages that explain why this path should never execute