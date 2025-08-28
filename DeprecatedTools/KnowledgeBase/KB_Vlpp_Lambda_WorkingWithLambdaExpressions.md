# Working with Lambda Expressions

Lambda expressions in Vlpp provide a concise way to define anonymous functions inline. They are extensively used throughout the Vlpp framework for functional programming patterns, event handling, and callback-based operations. Vlpp prefers lambda expressions over native function pointers for most callback scenarios.

## Basic Lambda Syntax

Lambda expressions use the standard C++ lambda syntax:

```cpp
#include "Vlpp.h"
using namespace vl;

// Basic lambda with no parameters
auto simple = []() {
    Console::WriteLine(L"Hello from lambda");
};

// Lambda with parameters
auto adder = [](vint a, vint b) {
    return a + b;
};

// Lambda with explicit return type
auto multiplier = [](vint a, vint b) -> vint {
    return a * b;
};
```

## Capture Mechanisms

### Capture by Value
```cpp
vint multiplier = 10;
auto scaler = [multiplier](vint x) {
    return x * multiplier; // multiplier is copied
};

vint result = scaler(5); // result is 50
```

### Capture by Reference
```cpp
vint counter = 0;
auto incrementCounter = [&counter]() {
    counter++; // Modifies the original counter
};

incrementCounter();
Console::WriteLine(itow(counter)); // Prints "1"
```

### Capture All by Value or Reference
```cpp
vint a = 10, b = 20;

// Capture all by value
auto byValue = [=](vint x) {
    return a + b + x; // a and b are copied
};

// Capture all by reference
auto byReference = [&](vint x) {
    a += x; // Modifies original a
    return a + b;
};
```

### Mixed Capture
```cpp
vint multiplier = 10;
vint base = 100;

auto processor = [=, &base](vint x) {
    base += x; // base captured by reference (modifies original)
    return base * multiplier; // multiplier captured by value
};
```

## Using Lambdas with Vlpp Collections

### LINQ-style Operations
```cpp
List<vint> numbers;
numbers.Add(1);
numbers.Add(2);
numbers.Add(3);
numbers.Add(4);
numbers.Add(5);

List<vint> evenSquares;
CopyFrom(evenSquares, From(numbers)
    .Where([](vint x) { return x % 2 == 0; })    // Filter even numbers
    .Select([](vint x) { return x * x; }));       // Square them

// evenSquares contains: {4, 16}
```

### Custom Processing
```cpp
List<WString> names;
names.Add(L"Alice");
names.Add(L"Bob");
names.Add(L"Charlie");

// Process each name
for (auto name : names)
{
    auto processor = [](const WString& n) {
        return L"Hello, " + n + L"!";
    };
    Console::WriteLine(processor(name));
}
```

## Lambda Expressions as Function Arguments

### Callback Pattern
```cpp
void ProcessAsync(const WString& data, Func<void(WString)> onComplete)
{
    // Simulate async work
    ThreadPoolLite::QueueLambda([=]() {
        WString result = L"Processed: " + data;
        onComplete(result);
    });
}

// Usage with lambda
ProcessAsync(L"input", [](const WString& result) {
    Console::WriteLine(result);
});
```

### Higher-Order Functions
```cpp
template<typename T, typename Predicate>
List<T> FilterList(const List<T>& source, Predicate predicate)
{
    List<T> result;
    for (const auto& item : source)
    {
        if (predicate(item))
        {
            result.Add(item);
        }
    }
    return result;
}

List<vint> numbers;
numbers.Add(1);
numbers.Add(2);
numbers.Add(3);
numbers.Add(4);
numbers.Add(5);

// Filter using lambda
auto evenNumbers = FilterList(numbers, [](vint x) {
    return x % 2 == 0;
});
```

## Lambda Expressions with Events

```cpp
class Button
{
public:
    Event<void()> onClick;
    
    void Click()
    {
        onClick();
    }
};

Button button;

// Subscribe with lambda
auto handle = button.onClick.Add([]() {
    Console::WriteLine(L"Button clicked!");
});

button.Click(); // Triggers the lambda
```

## Local Functions with Lambdas

Since C++ doesn't directly support local functions, lambdas serve as an alternative:

```cpp
void ComplexFunction()
{
    // Lambda as local function
    auto validateInput = [](const WString& input) -> bool {
        return !input.IsEmpty() && input.Length() > 3;
    };
    
    auto processValidInput = [](const WString& input) -> WString {
        return L"Processed: " + input.Upper();
    };
    
    WString userInput = L"hello";
    
    if (validateInput(userInput))
    {
        WString result = processValidInput(userInput);
        Console::WriteLine(result);
    }
}
```

## Lambda Chaining and Composition

```cpp
auto addTen = [](vint x) { return x + 10; };
auto multiplyByTwo = [](vint x) { return x * 2; };

// Function composition using lambdas
auto composite = [=](vint x) {
    return multiplyByTwo(addTen(x));
};

vint result = composite(5); // (5 + 10) * 2 = 30
```

## Recursive Lambdas

Recursive lambdas require careful handling in C++:

```cpp
void DemonstrateRecursiveLambda()
{
    // Using std::function for recursive lambda
    Func<vint(vint)> factorial = [&factorial](vint n) -> vint {
        return (n <= 1) ? 1 : n * factorial(n - 1);
    };
    
    vint result = factorial(5); // result is 120
    Console::WriteLine(L"5! = " + itow(result));
}
```

## Lambda Expressions with Smart Pointers

```cpp
class Worker
{
public:
    void Process(const WString& data)
    {
        Console::WriteLine(L"Processing: " + data);
    }
};

Ptr<Worker> worker = Ptr(new Worker());

// Capture smart pointer
auto processor = [worker](const WString& data) {
    worker->Process(data); // Smart pointer keeps object alive
};

processor(L"test data");
```

## Error Handling in Lambdas

```cpp
auto safeProcessor = [](const WString& input) -> WString {
    try
    {
        if (input.IsEmpty())
        {
            throw Exception(L"Input cannot be empty");
        }
        return input.Upper();
    }
    catch (const Exception& e)
    {
        Console::WriteLine(L"Error: " + e.Message());
        return L"ERROR";
    }
};

WString result = safeProcessor(L"hello"); // Returns "HELLO"
WString error = safeProcessor(L"");       // Returns "ERROR"
```

## Performance Considerations

### Prefer Lambda Capture by Reference for Large Objects
```cpp
class LargeObject
{
    Array<vint> data;
public:
    LargeObject() : data(10000) {}
    vint GetSum() const 
    { 
        vint sum = 0;
        for (vint i = 0; i < data.Count(); i++)
            sum += data[i];
        return sum;
    }
};

LargeObject obj;

// Good: capture by reference
auto processor = [&obj]() {
    return obj.GetSum();
};

// Less efficient: capture by value (copies the large object)
auto inefficient = [obj]() {
    return obj.GetSum();
};
```

### Template Lambdas (C++14 and later)
```cpp
// Generic lambda that works with any type
auto printer = [](const auto& value) {
    Console::WriteLine(L"Value: " + itow(value));
};

printer(42);
printer(3.14);
```

## Best Practices

### Keep Lambdas Simple and Focused
```cpp
// Good: Simple, single-purpose lambda
auto isEven = [](vint x) { return x % 2 == 0; };

// Less good: Complex lambda doing multiple things
auto complexLambda = [](vint x) {
    if (x < 0) return false;
    bool result = x % 2 == 0;
    Console::WriteLine(L"Checking: " + itow(x));
    return result;
};
```

### Use Meaningful Variable Names in Captures
```cpp
vint threshold = 100;
WString prefix = L"Result: ";

// Good: Clear intent
auto processor = [threshold, prefix](vint value) {
    if (value > threshold)
    {
        return prefix + itow(value);
    }
    return WString(L"Below threshold");
};
```

### Be Careful with Capture Lifetimes
```cpp
Func<vint()> CreateGetter()
{
    vint localValue = 42;
    
    // Dangerous: capturing local variable by reference
    // return [&localValue]() { return localValue; }; // localValue will be destroyed!
    
    // Safe: capturing by value
    return [localValue]() { return localValue; };
}
```

### Use Move Capture for Expensive-to-Copy Objects (C++14)
```cpp
Ptr<Worker> worker = CreateWorker();

// Move capture to avoid copying smart pointer
auto processor = [worker = std::move(worker)](const WString& data) {
    worker->Process(data);
};
```

Lambda expressions in Vlpp enable elegant functional programming patterns and provide a clean way to define small, focused pieces of logic inline. They are essential for working with collections, events, and asynchronous operations throughout the Vlpp framework.