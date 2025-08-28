# Using Pair for Two Values

## Overview

`Pair<K, V>` is a value type that stores two values: a key and a value. It provides a simple way to represent a tuple of 2 values without defining a custom struct. It is commonly used for key-value relationships and as the element type in dictionaries and groups.

## Basic Usage

### Creating a Pair

```cpp
#include "Vlpp.h"
using namespace vl;

// Explicit type specification
Pair<WString, vint> student(L"Alice", 95);

// Using automatic type deduction with Pair() constructor
auto score = Pair(L"Math", 87);  // Creates Pair<const wchar_t*, vint>

// From variables
WString subject = L"Science";
vint grade = 92;
auto result = Pair(subject, grade);  // Creates Pair<WString, vint>
```

### Accessing Values

```cpp
Pair<WString, vint> student(L"Bob", 88);

// Access the key and value using public fields
WString name = student.key;     // "Bob"
vint score = student.value;     // 88

// Modify values (if not const)
student.key = L"Robert";
student.value = 90;
```

## Structured Binding

`Pair<K, V>` supports structured binding for convenient access to both values:

```cpp
Pair<WString, vint> student(L"Charlie", 85);

// C++17 structured binding
auto [name, score] = student;
Console::WriteLine(name + L": " + itow(score));

// In range-based for loops with containers
Dictionary<WString, vint> grades;
grades.Add(L"Alice", 95);
for (auto [name, score] : grades)
{
    Console::WriteLine(name + L" scored " + itow(score));
}
```

## Comparison Operations

`Pair<K, V>` supports comparison operations when both K and V types are comparable:

```cpp
Pair<vint, WString> a(1, L"first");
Pair<vint, WString> b(1, L"second");

// Equality comparison
bool equal = (a == b);  // false (different values)

// Ordering comparison (compares key first, then value)
bool isLess = a < b;  // true (same key, "first" < "second")
```

## Usage in Collections

### Dictionary Elements

`Dictionary<K, V>` enumerates as `Pair<const K&, const V&>`:

```cpp
Dictionary<WString, vint> studentGrades;
studentGrades.Add(L"Alice", 95);

// Iterating over dictionary returns pairs
for (auto [name, grade] : studentGrades)
{
    Console::WriteLine(name + L": " + itow(grade));
}
```

### Return Multiple Values

```cpp
// Function returning multiple related values
Pair<vint, vint> GetMinMax(const Array<vint>& numbers)
{
    if (numbers.Count() == 0)
        return Pair(0, 0);
    
    vint min = numbers[0];
    vint max = numbers[0];
    
    for (vint i = 1; i < numbers.Count(); i++)
    {
        if (numbers[i] < min) min = numbers[i];
        if (numbers[i] > max) max = numbers[i];
    }
    
    return Pair(min, max);
}

// Usage
auto [minimum, maximum] = GetMinMax(data);
```

## LINQ Operations

```cpp
Dictionary<WString, vint> scores;
scores.Add(L"Alice", 95);

// Find students with high scores using LINQ
auto highScorers = From(scores)
    .Where([](auto pair) { return pair.value >= 90; })
    .Select([](auto pair) { return pair.key; });
```

## Best Practices

1. **Use structured binding** when both values are needed to make code more readable.
2. **Leverage automatic type deduction** with `Pair(key, value)` constructor to avoid verbose type specifications.
3. **Consider using Pair for function return values** when returning two related values instead of defining a custom struct.
4. **Remember comparison semantics**: Pairs are compared first by key, then by value.

The `Pair<K, V>` type provides a simple and efficient way to handle two-value relationships throughout the Vlpp framework, especially when working with associative containers and LINQ operations.