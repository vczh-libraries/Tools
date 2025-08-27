# Using Variant for Union Types

## Overview

`Variant<T...>` represents any but only one value of different types, making it perfect for implementing union types in C++. It must be initialized or assigned with a value - a `Variant<T...>` cannot be empty. This type provides type-safe unions that know which type they currently hold.

## Basic Usage

### Creating a Variant

```cpp
#include "Vlpp.h"
using namespace vl;

// Variant holding either WString, vint, or bool
Variant<WString, vint, bool> value;

// Initialize with different types
value = L"Hello World";     // Contains WString
value = 42;                 // Contains vint  
value = true;               // Contains bool

// Direct initialization
Variant<WString, vint> number(42);
Variant<WString, vint> text(L"Test");
```

### Checking Current Type

Use the `Index()` method to determine which type is currently stored:

```cpp
Variant<WString, vint, bool> value = 42;

vint typeIndex = value.Index();
// typeIndex == 1 (vint is at index 1: WString=0, vint=1, bool=2)

switch (typeIndex)
{
    case 0: Console::WriteLine(L"Contains WString"); break;
    case 1: Console::WriteLine(L"Contains vint"); break;
    case 2: Console::WriteLine(L"Contains bool"); break;
}
```

### Safe Value Access

Use `Get<T>()` when you're certain about the type, or `TryGet<T>()` for safe access:

```cpp
Variant<WString, vint, bool> value = L"Hello";

// Safe access - returns pointer or nullptr
auto stringPtr = value.TryGet<WString>();
if (stringPtr)
{
    Console::WriteLine(L"String value: " + *stringPtr);
}

// Direct access - only use when certain of type
if (value.Index() == 0)  // WString is at index 0
{
    WString text = value.Get<WString>();
    Console::WriteLine(L"Text: " + text);
}
```

## Working with Nullable Variants

If you need a variant that can be empty, add `nullptr_t` to the type list:

```cpp
// Variant that can be empty
Variant<nullptr_t, WString, vint> optionalValue;

// Initialize as empty
optionalValue = nullptr;

// Check if empty
if (optionalValue.Index() == 0)  // nullptr_t is at index 0
{
    Console::WriteLine(L"Value is empty");
}

// Assign a value
optionalValue = L"Now has text";
optionalValue = 123;
```

## Variant with Apply

Use `Apply` with a callback to handle the value generically:

```cpp
Variant<WString, vint, bool> value = 42;

// Template lambda that handles all types
value.Apply([](auto&& v) {
    using T = std::decay_t<decltype(v)>;
    if constexpr (std::is_same_v<T, WString>)
    {
        Console::WriteLine(L"String: " + v);
    }
    else if constexpr (std::is_same_v<T, vint>)
    {
        Console::WriteLine(L"Integer: " + itow(v));
    }
    else if constexpr (std::is_same_v<T, bool>)
    {
        Console::WriteLine(v ? L"True" : L"False");
    }
});
```

## Variant with Overloading

Use `Overloading` with `Apply` to handle different types with specific functions:

```cpp
Variant<WString, vint, bool> value = L"Test";

value.Apply(Overloading(
    [](const WString& str) { 
        Console::WriteLine(L"Processing string: " + str);
    },
    [](vint number) { 
        Console::WriteLine(L"Processing number: " + itow(number));
    },
    [](bool flag) { 
        Console::WriteLine(flag ? L"Flag is set" : L"Flag is clear");
    }
));
```

## Partial Handling with TryApply

Use `TryApply` when you don't need to handle every possible type:

```cpp
Variant<WString, vint, bool, double> value = 3.14;

// Only handle numeric types
bool handled = value.TryApply(Overloading(
    [](vint number) { 
        Console::WriteLine(L"Integer: " + itow(number));
        return true;
    },
    [](double number) { 
        Console::WriteLine(L"Double: " + ftow(number));
        return true;
    }
));

if (!handled)
{
    Console::WriteLine(L"Unhandled type");
}
```

## Common Patterns

### Configuration Value Storage

```cpp
class ConfigValue
{
private:
    Variant<WString, vint, bool, double> value;

public:
    ConfigValue(const WString& str) : value(str) {}
    ConfigValue(vint num) : value(num) {}
    ConfigValue(bool flag) : value(flag) {}

    WString ToString()
    {
        return value.Apply(Overloading(
            [](const WString& str) -> WString { return str; },
            [](vint num) -> WString { return itow(num); },
            [](bool flag) -> WString { return flag ? L"true" : L"false"; },
            [](double num) -> WString { return ftow(num); }
        ));
    }

    template<typename T>
    bool TryGetValue(T& out)
    {
        auto ptr = value.TryGet<T>();
        if (ptr)
        {
            out = *ptr;
            return true;
        }
        return false;
    }
};
```

## Best Practices

1. **Use Overloading for Type-Specific Handling**: When each type needs different processing, `Overloading` is more readable than template lambdas.
2. **Prefer TryGet for Safe Access**: Use `TryGet<T>()` instead of `Get<T>()` unless you're certain about the type.
3. **Consider nullptr_t for Optional Values**: Add `nullptr_t` to the type list for variants that can be empty.
4. **Use TryApply for Partial Handling**: When you only care about some types, `TryApply` is more appropriate than `Apply`.
5. **Keep Type Lists Small**: Too many types in a variant can make it unwieldy. Consider redesigning if you have more than 5-6 types.
6. **Document Type Indices**: Since `Index()` returns numeric values, document what each index represents for clarity.

The `Variant<T...>` type provides a powerful and type-safe way to implement union types in C++, enabling elegant solutions for state machines, configuration systems, and any scenario where a value can be one of several different types.