# Using Array for Fixed Size Collections

This guideline shows how to use Vlpp's `Array<T>` class for managing fixed-size collections of elements.

## Overview

`Array<T>` is a linear container with fixed size in runtime. All elements are contiguous in memory, providing efficient access and memory usage. Arrays are useful when you know the size at construction time and don't need to add or remove elements frequently.

## Basic Usage

### Creating Arrays

```cpp
#include "Vlpp.h"
using namespace vl;

void BasicArrayUsage()
{
    // Create an array with 5 elements (default initialized)
    Array<vint> numbers(5);
    
    // Create an array from existing data
    vint sourceData[] = {1, 2, 3, 4, 5};
    Array<vint> fromArray(sourceData, 5);
    
    // Create an empty array (can be resized later)
    Array<WString> strings;
}
```

### Accessing Elements

```cpp
#include "Vlpp.h"
using namespace vl;

void AccessElements()
{
    Array<vint> numbers(5);
    
    // Set values
    for (vint i = 0; i < numbers.Count(); i++)
    {
        numbers.Set(i, i * 10);  // or numbers[i] = i * 10;
    }
    
    // Get values
    for (vint i = 0; i < numbers.Count(); i++)
    {
        vint value = numbers.Get(i);  // or numbers[i]
        // value will be 0, 10, 20, 30, 40
    }
}
```

### Core Array Operations

```cpp
#include "Vlpp.h"
using namespace vl;

void CoreOperations()
{
    Array<WString> words(3);
    
    // Get the number of elements
    vint count = words.Count();  // returns 3
    
    // Set elements
    words[0] = L"Hello";
    words[1] = L"World";
    words[2] = L"Array";
    
    // Check if array contains a value
    bool hasHello = words.Contains(L"Hello");  // true
    bool hasGoodbye = words.Contains(L"Goodbye");  // false
    
    // Find the index of a value
    vint index = words.IndexOf(L"World");  // returns 1
    vint notFound = words.IndexOf(L"Missing");  // returns -1
}
```

### Resizing Arrays

```cpp
#include "Vlpp.h"
using namespace vl;

void ResizeArrays()
{
    Array<vint> numbers(3);
    numbers[0] = 10;
    numbers[1] = 20;
    numbers[2] = 30;
    
    // Resize to larger size (new elements are default initialized)
    numbers.Resize(5);
    // numbers now has: [10, 20, 30, 0, 0]
    
    // Resize to smaller size (extra elements are removed)
    numbers.Resize(2);
    // numbers now has: [10, 20]
    
    // Resize can be called multiple times
    numbers.Resize(4);
    // numbers now has: [10, 20, 0, 0]
}
```

### Working with Complex Types

```cpp
#include "Vlpp.h"
using namespace vl;

struct Person
{
    WString name;
    vint age;
    
    Person() : age(0) {}
    Person(const WString& n, vint a) : name(n), age(a) {}
    
    bool operator==(const Person& other) const
    {
        return name == other.name && age == other.age;
    }
};

void ComplexTypeArrays()
{
    Array<Person> people(3);
    
    // Set using assignment
    people[0] = Person(L"Alice", 25);
    people[1] = Person(L"Bob", 30);
    people[2] = Person(L"Carol", 28);
    
    // Search for a person
    Person target(L"Bob", 30);
    vint bobIndex = people.IndexOf(target);  // returns 1
    
    // Access person's data
    if (bobIndex != -1)
    {
        WString bobName = people[bobIndex].name;
        vint bobAge = people[bobIndex].age;
    }
}
```

### Array Initialization from Data

```cpp
#include "Vlpp.h"
using namespace vl;

void InitializeFromData()
{
    // Initialize from C-style array
    const wchar_t* words[] = {L"One", L"Two", L"Three"};
    Array<WString> wordArray(words, 3);
    
    // Initialize from existing array
    Array<vint> source(5);
    for (vint i = 0; i < 5; i++)
    {
        source[i] = i + 1;
    }
    
    // Copy construct another array
    Array<vint> copy(source.Buffer(), source.Count());
}
```

### Iterating Through Arrays

```cpp
#include "Vlpp.h"
using namespace vl;

void IterateArrays()
{
    Array<vint> numbers(5);
    for (vint i = 0; i < numbers.Count(); i++)
    {
        numbers[i] = i * i;
    }
    
    // Range-based for loop (C++11)
    for (auto number : numbers)
    {
        // Process each number
        Console::WriteLine(itow(number));
    }
    
    // Indexed iteration using collections framework
    for (auto [number, index] : indexed(numbers))
    {
        Console::WriteLine(L"numbers[" + itow(index) + L"] = " + itow(number));
    }
}
```

## Integration with Collections Framework

Arrays work seamlessly with Vlpp's collections framework:

```cpp
#include "Vlpp.h"
using namespace vl;

void CollectionsIntegration()
{
    Array<vint> source(5);
    for (vint i = 0; i < 5; i++)
    {
        source[i] = i + 1;
    }
    
    // Use with LazyList operations
    auto doubled = From(source)
        .Select([](vint x) { return x * 2; })
        .Where([](vint x) { return x > 5; });
    
    // Copy to other collection types
    List<vint> list;
    CopyFrom(list, source);
    
    // Create LazyList from Array
    auto lazy = From(source);
    vint sum = lazy.Aggregate([](vint a, vint b) { return a + b; });
}
```

## Performance Characteristics

- **Access Time**: O(1) for both read and write operations by index
- **Memory Layout**: Elements are stored contiguously in memory
- **Cache Efficiency**: Excellent cache locality for sequential access
- **Resize Cost**: O(n) - creates new buffer and copies all elements
- **Search Cost**: O(n) for `Contains()` and `IndexOf()` operations

## When to Use Array<T>

Use `Array<T>` when:
- You know the approximate size at creation time
- You need random access to elements
- Memory layout and cache performance are important
- You rarely need to resize the collection
- You want the simplest possible array-like container

Consider `List<T>` instead when:
- You frequently add or remove elements
- The size varies significantly during runtime
- You need more dynamic collection operations

## Related Classes

- `List<T>` - Dynamic array that can grow and shrink
- `SortedList<T>` - Automatically sorted dynamic array
- `ArrayBase<T>` - Base class providing common array functionality