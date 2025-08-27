# Using Func for Callable Objects

`Func<F>` in Vlpp works like `std::function<F>` in C++ standard library. It provides a type-erased wrapper for callable objects including function pointers, lambda expressions, and method pointers. Use this when you need to store or pass around callable objects in a flexible way.

## Basic Usage

`Func<F>` uses function signature syntax where `F` represents the function type:

```cpp
#include "Vlpp.h"
using namespace vl;

// Function that takes an integer and returns an integer
Func<vint(vint)> processor;

// Function that takes two integers and returns nothing
Func<void(vint, vint)> calculator;

// Function that takes no parameters and returns a WString
Func<WString()> generator;
```

## Initializing Func with Different Callable Objects

### Lambda Expressions
```cpp
Func<vint(vint)> doubler = [](vint x) { return x * 2; };
auto result = doubler(5); // result is 10
```

### Function Pointers
```cpp
vint AddOne(vint x) { return x + 1; }

Func<vint(vint)> incrementer = AddOne;
auto result = incrementer(5); // result is 6
```

### Method Pointers
When using method pointers, the first argument becomes the object instance:

```cpp
class Calculator
{
public:
    vint Multiply(vint a, vint b) { return a * b; }
};

Calculator calc;
Func<vint(Calculator*, vint, vint)> multiplier = &Calculator::Multiply;
auto result = multiplier(&calc, 3, 4); // result is 12
```

### Another Func with Compatible Types
```cpp
Func<vint(vint)> original = [](vint x) { return x * 2; };
Func<vint(vint)> copy = original; // Copy constructor
```

## Type Inference

You can use `Func(callable-object)` to automatically infer the function type:

```cpp
auto processor = Func([](vint x) { return x * 2; }); // Infers Func<vint(vint)>
```

## Checking for Empty State

`Func<F>` can be empty (not assigned with any callable object). Check this using the `operator bool`:

```cpp
Func<vint(vint)> processor;

if (!processor)
{
    Console::WriteLine(L"Function is empty");
}

// Assign a lambda
processor = [](vint x) { return x * 2; };

if (processor)
{
    Console::WriteLine(L"Function is ready");
    auto result = processor(5); // Safe to call
}
```

## Practical Examples

### Event Handler Pattern
```cpp
class EventManager
{
private:
    Func<void(WString)> onMessage;

public:
    void SetMessageHandler(Func<void(WString)> handler)
    {
        onMessage = handler;
    }
    
    void SendMessage(const WString& message)
    {
        if (onMessage)
        {
            onMessage(message);
        }
    }
};

// Usage
EventManager manager;
manager.SetMessageHandler([](const WString& msg) {
    Console::WriteLine(L"Received: " + msg);
});
manager.SendMessage(L"Hello World");
```

### Callback-Based Async Operations
```cpp
void ProcessDataAsync(const WString& data, Func<void(WString)> onComplete)
{
    // Simulate async processing
    ThreadPoolLite::QueueLambda([=]()
    {
        WString result = L"Processed: " + data;
        onComplete(result);
    });
}

// Usage
ProcessDataAsync(L"input data", [](const WString& result) {
    Console::WriteLine(result);
});
```

### Higher-Order Functions
```cpp
List<vint> numbers;
numbers.Add(1);
numbers.Add(2);
numbers.Add(3);
numbers.Add(4);
numbers.Add(5);

List<vint> results;
CopyFrom(results, From(numbers)
    .Where([](vint x) { return x % 2 == 0; })
    .Select([](vint x) { return x * x; }));

// Custom higher-order function
void ForEach(const List<vint>& list, Func<void(vint)> action)
{
    for (vint item : list)
    {
        action(item);
    }
}

ForEach(results, [](vint x) {
    Console::WriteLine(L"Value: " + itow(x));
});
```

## Type Conversion and Compatibility

`Func<F>` supports implicit conversion when argument and return types can be implicitly converted:

```cpp
// Function that takes and returns derived types
Func<Ptr<Object>(Ptr<Object>)> processor = [](Ptr<Object> obj) {
    return obj;
};

// Can be assigned to function that works with base types if conversion is valid
// This depends on the specific inheritance relationships in your types
```

## Best Practices

### Use Const References for Large Parameters
```cpp
Func<void(const List<WString>&)> listProcessor = [](const List<WString>& strings) {
    for (const auto& str : strings)
    {
        Console::WriteLine(str);
    }
};
```

### Prefer Lambda Capture by Reference When Appropriate
```cpp
vint multiplier = 10;
Func<vint(vint)> scaler = [&multiplier](vint x) {
    return x * multiplier; // Captures multiplier by reference
};
```

### Error Handling with Func
```cpp
Func<bool(const WString&)> validator;

bool ValidateAndProcess(const WString& input)
{
    if (!validator)
    {
        // Default validation: non-empty string
        return !input.IsEmpty();
    }
    
    return validator(input);
}
```

## Performance Considerations

- `Func<F>` has some overhead compared to direct function calls due to type erasure
- For performance-critical code with known function types, consider using function pointers or template parameters
- Lambda expressions captured in `Func<F>` may allocate memory for captured variables

`Func<F>` provides a powerful and flexible way to work with callable objects in Vlpp, enabling functional programming patterns and callback-based designs while maintaining type safety.