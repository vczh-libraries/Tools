# Working with Variant Apply and Overloading

The `Apply` method provides a powerful way to work with `Variant<T...>` values in a type-safe manner, allowing you to handle different types stored in the variant using callbacks.

## Using Apply with Template Lambda Expressions

Use the `Apply` method with a callback to read the value in a generic way:

```cpp
#include "Vlpp.h"
using namespace vl;

Variant<WString, vint, bool> v = L"Hello World";

v.Apply([](auto& value) {
    if constexpr (std::is_same_v<std::decay_t<decltype(value)>, WString>) {
        Console::WriteLine(L"String value: " + value);
    } else if constexpr (std::is_same_v<std::decay_t<decltype(value)>, vint>) {
        Console::WriteLine(L"Integer value: " + itow(value));
    } else if constexpr (std::is_same_v<std::decay_t<decltype(value)>, bool>) {
        Console::WriteLine(L"Boolean value: " + (value ? L"true" : L"false"));
    }
});
```

## Using Apply with Overloading Helper

You can use `Overloading` with `Apply` to handle the value of different types implicitly:

```cpp
Variant<WString, vint, bool> v = 42;

v.Apply(Overloading(
    [](const WString& str) { 
        Console::WriteLine(L"String: " + str);
    },
    [](vint num) { 
        Console::WriteLine(L"Number: " + itow(num));
    },
    [](bool flag) { 
        Console::WriteLine(L"Boolean: " + (flag ? L"true" : L"false"));
    }
));
```

## Using TryApply for Partial Handling

The `TryApply` method is similar to `Apply`, but you don't have to handle every case:

```cpp
Variant<WString, vint, bool> v = L"Test";

// Only handle string and integer cases, ignore boolean
bool handled = v.TryApply(Overloading(
    [](const WString& str) { 
        Console::WriteLine(L"Found string: " + str);
        return true;
    },
    [](vint num) { 
        Console::WriteLine(L"Found number: " + itow(num));
        return true;
    }
    // No handler for bool - this is allowed with TryApply
));

if (!handled) {
    Console::WriteLine(L"Variant type was not handled");
}
```

## Working with Return Values from Apply

The `Apply` method can return values from the callback functions:

```cpp
Variant<WString, vint, bool> v = 100;

WString result = v.Apply(Overloading(
    [](const WString& str) -> WString { 
        return L"String length: " + itow(str.Length());
    },
    [](vint num) -> WString { 
        return L"Number doubled: " + itow(num * 2);
    },
    [](bool flag) -> WString { 
        return L"Boolean negated: " + (flag ? L"false" : L"true");
    }
));

Console::WriteLine(result);
```

## Handling Complex Types in Variants

When working with variants containing complex types like collections:

```cpp
using ComplexVariant = Variant<List<vint>, Dictionary<WString, vint>, WString>;

ComplexVariant v;
List<vint> numbers;
numbers.Add(1);
numbers.Add(2);
v = numbers;

vint count = v.Apply(Overloading(
    [](const List<vint>& list) -> vint { 
        return list.Count();
    },
    [](const Dictionary<WString, vint>& dict) -> vint { 
        return dict.Count();
    },
    [](const WString& str) -> vint { 
        return str.Length();
    }
));

Console::WriteLine(L"Count: " + itow(count));
```

## Best Practices

1. **Always use const references** for complex types in lambda parameters to avoid unnecessary copying
2. **Use template lambdas** when you need generic handling across multiple types
3. **Use Overloading helper** when you need type-specific handling for each variant type
4. **Use TryApply** when you only need to handle specific types and can ignore others
5. **Ensure all callback return types are compatible** when using Apply with return values