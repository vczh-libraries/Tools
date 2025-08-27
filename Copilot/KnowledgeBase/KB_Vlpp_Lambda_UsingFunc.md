# Using Func for Callable Objects

`Func<F>` works like `std::function<F>` providing a type-erased wrapper for callable objects including function pointers, lambda expressions, and method pointers.

## Basic Usage

`Func<F>` uses function signature syntax:

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

## Initializing Func

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
When using method pointers, provide the object instance as the first argument:

```cpp
class Calculator
{
public:
    vint Multiply(vint a, vint b) { return a * b; }
};

Calculator calc;
Func<vint(Calculator*, vint, vint)> multiplier(&calc, &Calculator::Multiply);
auto result = multiplier(3, 4); // result is 12
```

### Type Inference
```cpp
auto processor = Func([](vint x) { return x * 2; }); // Infers Func<vint(vint)>
```

## Checking for Empty State

`Func<F>` can be empty. Check using `operator bool`:

```cpp
Func<vint(vint)> processor;

if (!processor)
{
    Console::WriteLine(L"Function is empty");
}

processor = [](vint x) { return x * 2; };

if (processor)
{
    auto result = processor(5); // Safe to call
}
```

## Basic Usage Examples

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

### Higher-Order Functions
```cpp
void ForEach(const List<vint>& list, Func<void(vint)> action)
{
    for (vint item : list)
    {
        action(item);
    }
}

List<vint> numbers;
numbers.Add(1);
numbers.Add(2);
numbers.Add(3);

ForEach(numbers, [](vint x) {
    Console::WriteLine(L"Value: " + itow(x));
});
```

### Callback-Based Operations
```cpp
void ProcessDataAsync(const WString& data, Func<void(WString)> onComplete)
{
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

### Error Handling
```cpp
Func<bool(const WString&)> validator;

bool ValidateAndProcess(const WString& input)
{
    if (!validator)
    {
        return input != WString::Empty; // Default validation
    }
    
    return validator(input);
}
```

## Performance Notes

- `Func<F>` has overhead compared to direct function calls due to type erasure
- For performance-critical code, consider function pointers or template parameters
- Lambda expressions may allocate memory for captured variables