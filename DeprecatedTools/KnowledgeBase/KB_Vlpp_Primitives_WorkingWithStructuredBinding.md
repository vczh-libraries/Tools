# Working with Structured Binding

## Overview

Structured binding is a C++17 feature that allows you to decompose objects into individual variables in a single declaration. In the Vlpp framework, structured binding works with `Pair<K, V>`, `Tuple<T...>`, and other compatible types, providing a clean and readable way to access multiple values simultaneously.

## Basic Structured Binding Syntax

### With Pair

```cpp
#include "Vlpp.h"
using namespace vl;

Pair<WString, vint> student(L"Alice", 95);

// Structured binding declaration
auto [name, score] = student;
Console::WriteLine(name + L" scored " + itow(score));

// You can also specify explicit types
const auto& [studentName, studentScore] = student;
```

### With Tuple

```cpp
Tuple<WString, vint, bool> studentRecord(L"Bob", 88, true);

// Decompose into three variables
auto [name, score, isHonor] = studentRecord;

if (isHonor)
{
    Console::WriteLine(name + L" is on the honor roll with score " + itow(score));
}
```

## Reference Qualifiers

### Value Binding (Copy)

```cpp
Pair<WString, vint> data(L"Test", 100);

// Creates copies of the values
auto [str, num] = data;
str = L"Modified";  // Only modifies the copy, not original data

Console::WriteLine(data.key);  // Still "Test"
```

### Reference Binding

```cpp
Pair<WString, vint> data(L"Test", 100);

// Creates references to the original values
auto& [str, num] = data;
str = L"Modified";  // Modifies the original data.key

Console::WriteLine(data.key);  // Now "Modified"

// Const reference binding
const auto& [constStr, constNum] = data;
```

## Usage in Range-Based For Loops

### Dictionary Iteration

```cpp
Dictionary<WString, vint> grades;
grades.Add(L"Alice", 95);
grades.Add(L"Bob", 88);
grades.Add(L"Charlie", 92);

// Structured binding in range-based for loop
for (auto [name, grade] : grades)
{
    if (grade >= 90)
    {
        Console::WriteLine(name + L" has an A grade!");
    }
}

// With const reference for efficiency
for (const auto& [name, grade] : grades)
{
    Console::WriteLine(L"Student: " + name + L", Grade: " + itow(grade));
}
```

### Group Iteration

```cpp
Group<WString, WString> courseEnrollments;
courseEnrollments.Add(L"Math", L"Alice");
courseEnrollments.Add(L"Math", L"Bob");
courseEnrollments.Add(L"Science", L"Alice");
courseEnrollments.Add(L"Science", L"Charlie");

// Each iteration gives one student-course pair
for (auto [course, student] : courseEnrollments)
{
    Console::WriteLine(student + L" is enrolled in " + course);
}
```

## LINQ Operations with Structured Binding

### Transformations

```cpp
List<Pair<WString, vint>> rawScores;
rawScores.Add(Pair(L"Alice", 85));
rawScores.Add(Pair(L"Bob", 92));
rawScores.Add(Pair(L"Charlie", 78));

// Use structured binding in lambda expressions
auto gradedStudents = From(rawScores)
    .Select([](auto pair) {
        auto [name, score] = pair;
        WString grade = score >= 90 ? L"A" : 
                       score >= 80 ? L"B" : L"C";
        return Tuple(name, score, grade);
    });

for (auto [name, score, grade] : gradedStudents)
{
    Console::WriteLine(name + L": " + itow(score) + L" (" + grade + L")");
}
```

### Function Return Values

```cpp
// Function returning multiple values via tuple
Tuple<bool, WString, vint> ValidateAndProcess(const WString& input)
{
    if (input.Length() == 0)
        return Tuple(false, L"Empty input", -1);
    
    return Tuple(true, L"Valid input", input.Length());
}

// Use structured binding to handle return value
auto [isValid, message, length] = ValidateAndProcess(L"Hello World");

if (isValid)
{
    Console::WriteLine(L"Success: " + message + L" (length: " + itow(length) + L")");
}
else
{
    Console::WriteLine(L"Error: " + message);
}
```

## Working with Indexed Collections

```cpp
List<WString> items;
items.Add(L"First");
items.Add(L"Second");

// Use indexed() function with structured binding
for (auto [index, item] : indexed(items))
{
    Console::WriteLine(L"Item " + itow(index) + L": " + item);
}
```

## Best Practices

### 1. Use Meaningful Variable Names

```cpp
// Good: descriptive names
auto [studentName, examScore] = studentData;

// Less clear: generic names
auto [first, second] = studentData;
```

### 2. Choose Appropriate Reference Qualifiers

```cpp
// For large objects, use const reference to avoid copying
const auto& [largeString, complexObject] = data;

// For small objects, value binding is fine
auto [number, flag] = simpleData;

// Use reference when you need to modify original values
auto& [modifiableName, modifiableScore] = mutableData;
```

### 3. Be Consistent in Loop Patterns

```cpp
// Consistent pattern for dictionary iteration
for (const auto& [key, value] : dictionary)
{
    // Process key-value pairs
}

// Consistent pattern for indexed iteration
for (auto [index, item] : indexed(collection))
{
    // Process item with its index
}
```

### 4. Error Handling Patterns

```cpp
// Use structured binding for error handling patterns
Tuple<bool, WString> TryGetUserName(vint userId)
{
    if (userId <= 0)
        return Tuple(false, WString::Empty);
    
    return Tuple(true, L"UserName");
}

// Usage with early return
auto [success, userName] = TryGetUserName(123);
if (!success)
    return;

Console::WriteLine(L"Hello, " + userName);
```

Structured binding significantly improves code readability and expressiveness when working with multi-value types in the Vlpp framework. It encourages the use of value types like `Pair` and `Tuple` by making them as convenient to use as individual variables, while maintaining type safety and performance.