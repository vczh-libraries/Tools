# Using List for Dynamic Collections

This guideline shows how to use Vlpp's `List<T>` class for managing dynamic collections of elements that can grow and shrink during runtime.

## Overview

`List<T>` is a linear container with dynamic size. All elements are contiguous in memory, providing efficient access and memory usage while allowing you to add, remove, and modify elements frequently. Lists are useful when you don't know the exact size at construction time and need to modify the collection during runtime.

## Basic Usage

### Creating Lists

```cpp
#include "Vlpp.h"
using namespace vl;

void BasicListUsage()
{
    // Create an empty list
    List<vint> numbers;
    
    // Create an empty list with initial capacity (optimization)
    List<WString> strings;
    
    // Lists automatically grow as needed
}
```

### Adding Elements

```cpp
#include "Vlpp.h"
using namespace vl;

void AddingElements()
{
    List<vint> numbers;
    
    // Add elements to the end
    numbers.Add(10);        // [10]
    numbers.Add(20);        // [10, 20]
    numbers.Add(30);        // [10, 20, 30]
    
    // Insert elements at specific positions
    numbers.Insert(1, 15);  // [10, 15, 20, 30]
    numbers.Insert(0, 5);   // [5, 10, 15, 20, 30]
    
    // Insert at the end (equivalent to Add)
    numbers.Insert(numbers.Count(), 35); // [5, 10, 15, 20, 30, 35]
}
```

### Accessing Elements

```cpp
#include "Vlpp.h"
using namespace vl;

void AccessElements()
{
    List<vint> numbers;
    numbers.Add(10);
    numbers.Add(20);
    numbers.Add(30);
    
    // Get values by index
    for (vint i = 0; i < numbers.Count(); i++)
    {
        vint value = numbers.Get(i);  // or numbers[i]
        // value will be 10, 20, 30
    }
    
    // Set values by index
    numbers.Set(1, 25);  // or numbers[1] = 25;
    // numbers is now [10, 25, 30]
}
```

### Core List Operations

```cpp
#include "Vlpp.h"
using namespace vl;

void CoreOperations()
{
    List<WString> words;
    words.Add(L"Hello");
    words.Add(L"World");
    words.Add(L"List");
    
    // Get the number of elements
    vint count = words.Count();  // returns 3
    
    // Check if list contains a value
    bool hasHello = words.Contains(L"Hello");  // true
    bool hasGoodbye = words.Contains(L"Goodbye");  // false
    
    // Find the index of a value
    vint index = words.IndexOf(L"World");  // returns 1
    vint notFound = words.IndexOf(L"Missing");  // returns -1
}
```

### Removing Elements

```cpp
#include "Vlpp.h"
using namespace vl;

void RemovingElements()
{
    List<vint> numbers;
    numbers.Add(10);
    numbers.Add(20);
    numbers.Add(30);
    numbers.Add(20);  // duplicate
    numbers.Add(40);
    // numbers: [10, 20, 30, 20, 40]
    
    // Remove by value (removes first occurrence)
    bool removed = numbers.Remove(20);  // true
    // numbers: [10, 30, 20, 40]
    
    // Remove by index
    bool removedAt = numbers.RemoveAt(1);  // true
    // numbers: [10, 20, 40]
    
    // Remove multiple elements
    numbers.Add(50);
    numbers.Add(60);
    // numbers: [10, 20, 40, 50, 60]
    
    numbers.RemoveRange(1, 2);  // Remove 2 elements starting at index 1
    // numbers: [10, 50, 60]
    
    // Clear all elements
    numbers.Clear();
    // numbers: []
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

void ComplexTypeList()
{
    List<Person> people;
    
    // Add people to the list
    people.Add(Person(L"Alice", 25));
    people.Add(Person(L"Bob", 30));
    people.Add(Person(L"Carol", 28));
    
    // Insert a person at the beginning
    people.Insert(0, Person(L"David", 22));
    
    // Search for a person
    Person target(L"Bob", 30);
    vint bobIndex = people.IndexOf(target);  // returns 2 (after David was inserted)
    
    // Modify a person's data
    if (bobIndex != -1)
    {
        people[bobIndex].age = 31;  // Bob is now 31
    }
    
    // Remove a person
    people.Remove(Person(L"Carol", 28));
}
```

### Working with Shared Pointers

```cpp
#include "Vlpp.h"
using namespace vl;

void SharedPointerList()
{
    List<Ptr<Person>> people;
    
    // Add shared pointers
    people.Add(Ptr(new Person(L"Alice", 25)));
    people.Add(Ptr(new Person(L"Bob", 30)));
    people.Add(Ptr(new Person(L"Carol", 28)));
    
    // Access through shared pointers
    for (vint i = 0; i < people.Count(); i++)
    {
        if (people[i])
        {
            people[i]->age += 1;  // Everyone gets a year older
        }
    }
    
    // Remove null pointers (if any were added)
    for (vint i = people.Count() - 1; i >= 0; i--)
    {
        if (!people[i])
        {
            people.RemoveAt(i);
        }
    }
}
```

### Iterating Through Lists

```cpp
#include "Vlpp.h"
using namespace vl;

void IterateLists()
{
    List<vint> numbers;
    for (vint i = 1; i <= 5; i++)
    {
        numbers.Add(i * i);
    }
    
    // Indexed iteration
    for (vint i = 0; i < numbers.Count(); i++)
    {
        Console::WriteLine(itow(numbers[i]));
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

Lists work seamlessly with Vlpp's collections framework:

```cpp
#include "Vlpp.h"
using namespace vl;

void CollectionsIntegration()
{
    List<vint> source;
    for (vint i = 1; i <= 10; i++)
    {
        source.Add(i);
    }
    
    // Use with LazyList operations
    auto doubled = From(source)
        .Select([](vint x) { return x * 2; })
        .Where([](vint x) { return x > 10; });
    
    // Collect results back to a List
    List<vint> results;
    CopyFrom(results, doubled);
    
    // Copy to other collection types
    Array<vint> array;
    CopyFrom(array, source);
    
    // Create LazyList from List
    auto lazy = From(source);
    vint sum = lazy.Aggregate([](vint a, vint b) { return a + b; });
}
```

## Performance Characteristics

- **Access Time**: O(1) for both read and write operations by index
- **Memory Layout**: Elements are stored contiguously in memory
- **Cache Efficiency**: Excellent cache locality for sequential access
- **Add Cost**: O(1) amortized when adding to the end (may require reallocation)
- **Insert Cost**: O(n) in worst case (when inserting at the beginning)
- **Remove Cost**: O(n) in worst case (when removing from the beginning)
- **Search Cost**: O(n) for `Contains()` and `IndexOf()` operations

## Dynamic Behavior

Unlike `Array<T>`, `List<T>` automatically manages its memory:

```cpp
#include "Vlpp.h"
using namespace vl;

void DynamicBehavior()
{
    List<vint> numbers;
    
    // List starts empty
    Console::WriteLine(itow(numbers.Count()));  // 0
    
    // Adding elements automatically grows the list
    for (vint i = 0; i < 1000; i++)
    {
        numbers.Add(i);  // Internal buffer grows as needed
    }
    
    // Removing elements doesn't shrink the buffer (optimization)
    for (vint i = 0; i < 500; i++)
    {
        numbers.RemoveAt(0);
    }
    
    // List still has good performance
    Console::WriteLine(itow(numbers.Count()));  // 500
}
```

## When to Use List<T>

Use `List<T>` when:
- You need a dynamic collection that can grow and shrink
- You frequently add or remove elements
- The size varies significantly during runtime
- You need random access to elements
- You want automatic memory management

Consider `Array<T>` instead when:
- You know the size at creation time and it rarely changes
- You want the simplest possible array-like container
- Memory allocation overhead is a concern

Consider `SortedList<T>` instead when:
- You need the elements to be automatically sorted
- You frequently search for elements

## Related Classes

- `Array<T>` - Fixed-size array container
- `SortedList<T>` - Automatically sorted dynamic list
- `ObservableList<T>` - List that triggers events when modified
- `LazyList<T>` - LINQ-style enumerable sequence