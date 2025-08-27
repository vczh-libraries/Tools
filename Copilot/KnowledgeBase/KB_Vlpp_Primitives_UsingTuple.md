# Using Tuple for Multiple Values

## Overview

`Tuple<T...>` is a value type that provides an easy way to organize multiple values without defining a custom struct. It can hold any number of values of different types, making it useful for grouping related data, returning multiple values from functions, and intermediate data processing.

## Basic Usage

### Creating a Tuple

```cpp
#include "Vlpp.h"
using namespace vl;

// Explicit type specification
Tuple<WString, vint, bool> studentInfo(L"Alice", 95, true);

// Using automatic type deduction with Tuple() constructor
auto coordinates = Tuple(10, 20, 30);  // Creates Tuple<int, int, int>

// Mixed types
auto record = Tuple(L"Document.txt", DateTime::LocalTime(), 1024);
// Creates Tuple<const wchar_t*, DateTime, int>

// From variables
WString name = L"Bob";
vint age = 25;
bool isActive = true;
auto person = Tuple(name, age, isActive);  // Creates Tuple<WString, vint, bool>
```

### Accessing Values

Values in a tuple are immutable, but you can access them using the `get<Index>()` method where the index must be a compile-time constant:

```cpp
Tuple<WString, vint, bool> student(L"Charlie", 88, false);

// Access values using get<index>()
WString name = student.get<0>();    // "Charlie"
vint score = student.get<1>();      // 88
bool isHonor = student.get<2>();    // false

// Index must be compile-time constant
// student.get<i>();  // ERROR: i must be constexpr
```

### Assignment and Immutability

```cpp
Tuple<WString, vint> original(L"Test", 100);

// Cannot modify individual elements
// original.get<0>() = L"Modified";  // ERROR: values are immutable

// But you can assign entire tuples
original = Tuple(L"New Value", 200);

// Or assign from another compatible tuple
Tuple<WString, vint> another(L"Another", 150);
original = another;
```

## Working with Structured Binding

`Tuple<T...>` supports structured binding, which provides a more convenient way to access all values:

```cpp
Tuple<WString, vint, bool> student(L"David", 92, true);

// C++17 structured binding
auto [name, score, isHonor] = student;
Console::WriteLine(name + L" scored " + itow(score));

// You can also use specific types
const auto& [studentName, studentScore, honorStatus] = student;

// In range-based for loops (when iterating over containers of tuples)
List<Tuple<WString, vint>> grades;
grades.Add(Tuple(L"Alice", 95));
grades.Add(Tuple(L"Bob", 88));

for (auto [name, grade] : grades)
{
    Console::WriteLine(name + L": " + itow(grade));
}
```

## Comparison Operations

`Tuple<T...>` supports comparison operations when all contained types are comparable:

```cpp
Tuple<vint, WString> a(1, L"first");
Tuple<vint, WString> b(1, L"second");
Tuple<vint, WString> c(2, L"first");

// Equality comparison
bool equal = (a == b);  // false (different second values)

// Ordering comparison (lexicographic - compares elements in order)
auto ordering = a <=> b;  // std::strong_ordering::less ("first" < "second")
bool isLess = a < c;      // true (1 < 2)

// Same first element, compare second element
Tuple<vint, vint> x(5, 10);
Tuple<vint, vint> y(5, 20);
bool xLessY = x < y;  // true (same first, 10 < 20)
```

## Common Use Cases

### Returning Multiple Values from Functions

```cpp
// Function returning multiple related values
Tuple<vint, vint, double> AnalyzeNumbers(const Array<vint>& numbers)
{
    if (numbers.Count() == 0)
        return Tuple(0, 0, 0.0);
    
    vint min = numbers[0];
    vint max = numbers[0];
    vint sum = 0;
    
    for (vint i = 0; i < numbers.Count(); i++)
    {
        if (numbers[i] < min) min = numbers[i];
        if (numbers[i] > max) max = numbers[i];
        sum += numbers[i];
    }
    
    double average = static_cast<double>(sum) / numbers.Count();
    return Tuple(min, max, average);
}

// Usage
Array<vint> data(5);
data[0] = 3; data[1] = 7; data[2] = 1; data[3] = 9; data[4] = 5;

auto [minimum, maximum, avg] = AnalyzeNumbers(data);
Console::WriteLine(L"Min: " + itow(minimum) + L", Max: " + itow(maximum) + 
                   L", Avg: " + ftow(avg));
```

### Intermediate Data Processing

```cpp
// Processing data with multiple attributes
List<WString> words;
words.Add(L"apple");
words.Add(L"banana");
words.Add(L"cherry");
words.Add(L"date");

// Create tuples for complex processing
auto wordAnalysis = From(words)
    .Select([](const WString& word) {
        return Tuple(word, word.Length(), word[0]);  // word, length, first char
    })
    .Where([](auto tuple) { 
        auto [word, length, firstChar] = tuple;
        return length >= 5 && firstChar >= L'a' && firstChar <= L'm';
    })
    .OrderByKey([](auto tuple) { 
        return tuple.get<1>();  // Sort by length
    });

for (auto [word, length, firstChar] : wordAnalysis)
{
    Console::WriteLine(word + L" (length: " + itow(length) + 
                       L", starts with: " + WString::FromChar(firstChar) + L")");
}
```

### Configuration and Settings

```cpp
// Application configuration tuple
using AppConfig = Tuple<WString, vint, bool, double>;

AppConfig LoadConfiguration()
{
    // Load from file or database
    return Tuple(L"MyApp", 8080, true, 1.5);  // name, port, debug, scale
}

void ApplyConfiguration(const AppConfig& config)
{
    auto [appName, port, debugMode, uiScale] = config;
    
    Console::WriteLine(L"Application: " + appName);
    Console::WriteLine(L"Port: " + itow(port));
    Console::WriteLine(L"Debug Mode: " + (debugMode ? L"On" : L"Off"));
    Console::WriteLine(L"UI Scale: " + ftow(uiScale));
}

// Usage
auto config = LoadConfiguration();
ApplyConfiguration(config);
```

### Coordinate Systems

```cpp
// 3D point representation
using Point3D = Tuple<double, double, double>;

Point3D CreatePoint(double x, double y, double z)
{
    return Tuple(x, y, z);
}

double CalculateDistance(const Point3D& p1, const Point3D& p2)
{
    auto [x1, y1, z1] = p1;
    auto [x2, y2, z2] = p2;
    
    double dx = x2 - x1;
    double dy = y2 - y1;
    double dz = z2 - z1;
    
    return sqrt(dx*dx + dy*dy + dz*dz);
}

// Usage
auto origin = CreatePoint(0, 0, 0);
auto point = CreatePoint(3, 4, 5);
double distance = CalculateDistance(origin, point);
```

## Working with Collections

### Lists of Tuples

```cpp
List<Tuple<WString, vint, WString>> employees;
employees.Add(Tuple(L"Alice Johnson", 28, L"Engineer"));
employees.Add(Tuple(L"Bob Smith", 32, L"Manager"));
employees.Add(Tuple(L"Charlie Brown", 25, L"Designer"));

// Filter and display
auto seniors = From(employees)
    .Where([](auto employee) {
        auto [name, age, position] = employee;
        return age >= 30;
    });

Console::WriteLine(L"Senior Employees:");
for (auto [name, age, position] : seniors)
{
    Console::WriteLine(L"- " + name + L" (" + itow(age) + L", " + position + L")");
}
```

### Complex Data Transformations

```cpp
// Transform data through multiple steps
List<WString> rawData;
rawData.Add(L"Item1:100:Active");
rawData.Add(L"Item2:250:Inactive");
rawData.Add(L"Item3:175:Active");

auto processedData = From(rawData)
    .Select([](const WString& line) {
        // Parse the string and create tuple
        auto parts = line.Split(L':');
        return Tuple(parts[0], wtoi(parts[1]), parts[2] == L"Active");
    })
    .Where([](auto item) {
        auto [name, value, isActive] = item;
        return isActive && value > 150;
    })
    .Select([](auto item) {
        auto [name, value, isActive] = item;
        return Tuple(name, L"Value: " + itow(value), L"Status: Active");
    });

for (auto [name, valueStr, statusStr] : processedData)
{
    Console::WriteLine(name + L" - " + valueStr + L", " + statusStr);
}
```

## Best Practices

1. **Use structured binding** when accessing multiple elements to make code more readable.

2. **Leverage automatic type deduction** with `Tuple(...)` constructor to avoid verbose type specifications.

3. **Consider using Tuple for function return values** when returning multiple related values instead of defining a custom struct.

4. **Use type aliases** for complex tuples to improve readability:
   ```cpp
   using PersonInfo = Tuple<WString, vint, WString>;  // name, age, email
   using Coordinates = Tuple<double, double, double>; // x, y, z
   ```

5. **Remember comparison semantics**: Tuples are compared lexicographically (element by element in order).

6. **Use get<Index>() for single element access** when you only need one specific element.

7. **Prefer Tuple over Pair for 3+ values**: While `Pair<K, V>` is specialized for two values, use `Tuple<T...>` for three or more values.

8. **Consider performance**: For frequently used data structures, a custom struct might be more performant than a tuple.

The `Tuple<T...>` type provides a flexible and efficient way to group multiple values together, making it particularly useful for functional programming patterns, data transformation, and scenarios where you need to return or pass multiple values without defining custom types.