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

// Or use specific type qualifiers
auto&& [tempName, tempScore] = student;
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

// More complex tuple
Tuple<WString, DateTime, vint, double> fileInfo(L"document.txt", DateTime::LocalTime(), 1024, 3.14);
auto [filename, timestamp, size, version] = fileInfo;
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
// constStr = L"Won't compile";  // ERROR: const reference
```

### Universal Reference Binding

```cpp
Pair<WString, vint> GetData()
{
    return Pair(L"Function Result", 42);
}

// Perfect forwarding with universal reference
auto&& [str, num] = GetData();
// Extends the lifetime of the temporary return value
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

### Custom Collections

```cpp
List<Tuple<WString, vint, bool>> employees;
employees.Add(Tuple(L"Alice Johnson", 28, true));
employees.Add(Tuple(L"Bob Smith", 32, false));
employees.Add(Tuple(L"Charlie Brown", 25, true));

// Structured binding with multiple values
for (auto [name, age, isActive] : employees)
{
    if (isActive && age >= 30)
    {
        Console::WriteLine(name + L" is a senior active employee");
    }
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
                       score >= 80 ? L"B" : 
                       score >= 70 ? L"C" : L"F";
        return Tuple(name, score, grade);
    });

for (auto [name, score, grade] : gradedStudents)
{
    Console::WriteLine(name + L": " + itow(score) + L" (" + grade + L")");
}
```

### Filtering

```cpp
List<Tuple<WString, vint, WString>> products;
products.Add(Tuple(L"Laptop", 1200, L"Electronics"));
products.Add(Tuple(L"Book", 25, L"Education"));
products.Add(Tuple(L"Phone", 800, L"Electronics"));

// Filter using structured binding
auto expensiveElectronics = From(products)
    .Where([](auto product) {
        auto [name, price, category] = product;
        return category == L"Electronics" && price > 1000;
    });

for (auto [name, price, category] : expensiveElectronics)
{
    Console::WriteLine(L"Expensive " + category + L": " + name + L" ($" + itow(price) + L")");
}
```

### Aggregation

```cpp
List<Pair<WString, vint>> salesData;
salesData.Add(Pair(L"Q1", 150000));
salesData.Add(Pair(L"Q2", 180000));
salesData.Add(Pair(L"Q3", 165000));
salesData.Add(Pair(L"Q4", 195000));

// Calculate total sales using structured binding
vint totalSales = From(salesData)
    .Aggregate(0, [](vint sum, auto quarterData) {
        auto [quarter, sales] = quarterData;
        return sum + sales;
    });

Console::WriteLine(L"Total annual sales: $" + itow(totalSales));
```

## Advanced Patterns

### Nested Structured Binding

```cpp
// Tuple containing another tuple
Tuple<WString, Tuple<vint, vint, vint>> studentWithGrades(
    L"Alice", 
    Tuple(95, 88, 92)
);

auto [name, grades] = studentWithGrades;
auto [math, science, english] = grades;

Console::WriteLine(name + L"'s grades:");
Console::WriteLine(L"  Math: " + itow(math));
Console::WriteLine(L"  Science: " + itow(science));
Console::WriteLine(L"  English: " + itow(english));
```

### Function Return Values

```cpp
// Function returning multiple values via tuple
Tuple<bool, WString, vint> ValidateAndProcess(const WString& input)
{
    if (input.Length() == 0)
        return Tuple(false, L"Empty input", -1);
    
    if (input.Length() > 100)
        return Tuple(false, L"Input too long", -1);
    
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

### Complex Data Processing

```cpp
// Process multiple data streams
List<Pair<WString, Ptr<List<vint>>>> dataStreams;

auto stream1 = Ptr(new List<vint>());
stream1->Add(10); stream1->Add(20); stream1->Add(30);
auto stream2 = Ptr(new List<vint>());
stream2->Add(15); stream2->Add(25); stream2->Add(35);

dataStreams.Add(Pair(L"StreamA", stream1));
dataStreams.Add(Pair(L"StreamB", stream2));

// Process each stream with structured binding
for (auto [streamName, values] : dataStreams)
{
    auto stats = From(*values.Obj())
        .Aggregate(
            Tuple(values->Get(0), values->Get(0), 0),  // min, max, sum
            [](auto acc, vint value) {
                auto [currentMin, currentMax, currentSum] = acc;
                return Tuple(
                    value < currentMin ? value : currentMin,
                    value > currentMax ? value : currentMax,
                    currentSum + value
                );
            }
        );
    
    auto [min, max, sum] = stats;
    double average = static_cast<double>(sum) / values->Count();
    
    Console::WriteLine(streamName + L" statistics:");
    Console::WriteLine(L"  Min: " + itow(min) + L", Max: " + itow(max) + L", Avg: " + ftow(average));
}
```

## Working with Indexed Collections

```cpp
List<WString> items;
items.Add(L"First");
items.Add(L"Second");
items.Add(L"Third");

// Use indexed() function with structured binding
for (auto [item, index] : indexed(items))
{
    Console::WriteLine(L"Item " + itow(index) + L": " + item);
}

// Filter with index information
auto evenIndexedItems = From(indexed(items))
    .Where([](auto indexedItem) {
        auto [item, index] = indexedItem;
        return index % 2 == 0;
    });

for (auto [item, index] : evenIndexedItems)
{
    Console::WriteLine(L"Even index " + itow(index) + L": " + item);
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
for (auto [item, index] : indexed(collection))
{
    // Process item with its index
}
```

### 4. Combine with Other Modern C++ Features

```cpp
// Structured binding with if-init statement (C++17)
if (auto [isValid, result] = TryParse(input); isValid)
{
    Console::WriteLine(L"Parsed value: " + itow(result));
}

// With constexpr if (C++17)
template<typename T>
void ProcessTuple(const T& tuple)
{
    if constexpr (std::tuple_size_v<T> == 2)
    {
        auto [first, second] = tuple;
        // Process pair
    }
    else if constexpr (std::tuple_size_v<T> == 3)
    {
        auto [first, second, third] = tuple;
        // Process triple
    }
}
```

### 5. Error Handling Patterns

```cpp
// Use structured binding for error handling patterns
Tuple<bool, WString> TryGetUserName(vint userId)
{
    if (userId <= 0)
        return Tuple(false, WString::Empty);
    
    // ... lookup logic ...
    return Tuple(true, L"UserName");
}

// Usage with early return
auto [success, userName] = TryGetUserName(123);
if (!success)
    return;

Console::WriteLine(L"Hello, " + userName);
```

Structured binding significantly improves code readability and expressiveness when working with multi-value types in the Vlpp framework. It encourages the use of value types like `Pair` and `Tuple` by making them as convenient to use as individual variables, while maintaining type safety and performance.