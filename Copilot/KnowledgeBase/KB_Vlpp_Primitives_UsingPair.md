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

## Working with Structured Binding

`Pair<K, V>` supports structured binding for convenient access to both values:

```cpp
Pair<WString, vint> student(L"Charlie", 85);

// C++17 structured binding
auto [name, score] = student;
Console::WriteLine(name + L": " + itow(score));

// In range-based for loops with containers
Dictionary<WString, vint> grades;
grades.Add(L"Alice", 95);
grades.Add(L"Bob", 88);

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
Pair<vint, WString> c(2, L"first");

// Equality comparison
bool equal = (a == b);  // false (different values)

// Ordering comparison (compares key first, then value)
auto ordering = a <=> b;  // std::strong_ordering::less
bool isLess = a < c;      // true (1 < 2)

// Pairs with same key are ordered by value
Pair<vint, vint> x(5, 10);
Pair<vint, vint> y(5, 20);
bool xLessY = x < y;  // true (same key, 10 < 20)
```

## Usage in Collections

### Dictionary Elements

`Dictionary<K, V>` enumerates as `Pair<const K&, const V&>`:

```cpp
Dictionary<WString, vint> studentGrades;
studentGrades.Add(L"Alice", 95);
studentGrades.Add(L"Bob", 88);
studentGrades.Add(L"Charlie", 92);

// Iterating over dictionary returns pairs
for (auto pair : studentGrades)
{
    Console::WriteLine(pair.key + L": " + itow(pair.value));
}

// Using structured binding
for (auto [name, grade] : studentGrades)
{
    if (grade >= 90)
    {
        Console::WriteLine(name + L" has an A grade!");
    }
}
```

### Group Elements

`Group<K, V>` also enumerates as `Pair<const K&, const V&>`:

```cpp
Group<WString, WString> studentCourses;
studentCourses.Add(L"Alice", L"Math");
studentCourses.Add(L"Alice", L"Science");
studentCourses.Add(L"Bob", L"Math");
studentCourses.Add(L"Bob", L"English");

// Each pair represents one student-course relationship
for (auto [student, course] : studentCourses)
{
    Console::WriteLine(student + L" is enrolled in " + course);
}
```

### Creating Collections of Pairs

```cpp
List<Pair<WString, vint>> coordinates;
coordinates.Add(Pair(L"A", 10));
coordinates.Add(Pair(L"B", 20));
coordinates.Add(Pair(L"C", 15));

// Sort by value (second element)
coordinates.OrderByKey([](const Pair<WString, vint>& p) { return p.value; });

for (auto [point, value] : coordinates)
{
    Console::WriteLine(L"Point " + point + L" has value " + itow(value));
}
```

## LINQ Operations

Pairs work seamlessly with LINQ operations:

```cpp
Dictionary<WString, vint> scores;
scores.Add(L"Alice", 95);
scores.Add(L"Bob", 78);
scores.Add(L"Charlie", 88);
scores.Add(L"David", 92);

// Find students with high scores using LINQ
auto highScorers = From(scores)
    .Where([](auto pair) { return pair.value >= 90; })
    .Select([](auto pair) { return pair.key; });

for (auto name : highScorers)
{
    Console::WriteLine(name + L" scored 90 or above");
}

// Transform pairs
auto formatted = From(scores)
    .Select([](auto pair) { 
        return Pair(pair.key, L"Score: " + itow(pair.value));
    });
```

## Common Patterns

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
Array<vint> data(5);
data[0] = 3; data[1] = 7; data[2] = 1; data[3] = 9; data[4] = 5;

auto [minimum, maximum] = GetMinMax(data);
Console::WriteLine(L"Min: " + itow(minimum) + L", Max: " + itow(maximum));
```

### Intermediate Processing

```cpp
// Processing data with intermediate key-value relationships
List<WString> words;
words.Add(L"apple");
words.Add(L"banana");
words.Add(L"cherry");

// Create word-length pairs for processing
auto wordLengths = From(words)
    .Select([](const WString& word) { 
        return Pair(word, word.Length());
    })
    .Where([](auto pair) { return pair.value >= 6; })  // Words with 6+ characters
    .OrderByKey([](auto pair) { return pair.value; }); // Sort by length

for (auto [word, length] : wordLengths)
{
    Console::WriteLine(word + L" has " + itow(length) + L" characters");
}
```

## Best Practices

1. **Use structured binding** when both values are needed to make code more readable.

2. **Leverage automatic type deduction** with `Pair(key, value)` constructor to avoid verbose type specifications.

3. **Consider using Pair for function return values** when returning two related values instead of defining a custom struct.

4. **Use Pair with LINQ operations** for powerful data transformation and filtering scenarios.

5. **Remember comparison semantics**: Pairs are compared first by key, then by value.

The `Pair<K, V>` type provides a simple and efficient way to handle two-value relationships throughout the Vlpp framework, especially when working with associative containers and LINQ operations.