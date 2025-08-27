# Using SortedList for Ordered Collections

This guideline shows how to use Vlpp's `SortedList<T>` class for managing collections that maintain their elements in sorted order automatically.

## Overview

`SortedList<T>` is a linear container that automatically keeps all elements sorted. All elements are contiguous in memory, providing efficient access and memory usage while ensuring that the collection is always ordered. SortedLists are useful when you need a collection that maintains sorted order without manual sorting operations.

## Basic Usage

### Creating SortedLists

```cpp
#include "Vlpp.h"
using namespace vl;

void BasicSortedListUsage()
{
    // Create an empty sorted list
    SortedList<vint> numbers;
    
    // Create an empty sorted list for strings
    SortedList<WString> strings;
    
    // SortedList automatically maintains order as elements are added
}
```

### Adding Elements (Automatic Sorting)

```cpp
#include "Vlpp.h"
using namespace vl;

void AddingElementsInOrder()
{
    SortedList<vint> numbers;
    
    // Add elements in any order - they will be sorted automatically
    numbers.Add(30);        // [30]
    numbers.Add(10);        // [10, 30]
    numbers.Add(20);        // [10, 20, 30]
    numbers.Add(15);        // [10, 15, 20, 30]
    numbers.Add(5);         // [5, 10, 15, 20, 30]
    
    // Elements are always kept in sorted order
    for (vint i = 0; i < numbers.Count(); i++)
    {
        Console::WriteLine(itow(numbers[i]));
        // Output: 5, 10, 15, 20, 30
    }
}
```

### Accessing Elements

```cpp
#include "Vlpp.h"
using namespace vl;

void AccessElements()
{
    SortedList<vint> numbers;
    numbers.Add(30);
    numbers.Add(10);
    numbers.Add(20);
    
    // Get values by index (elements are in sorted order)
    for (vint i = 0; i < numbers.Count(); i++)
    {
        vint value = numbers.Get(i);  // or numbers[i]
        // value will be 10, 20, 30 (sorted order)
    }
    
    // Note: No Set() method available - would break sorting invariant
}
```

### Core SortedList Operations

```cpp
#include "Vlpp.h"
using namespace vl;

void CoreOperations()
{
    SortedList<WString> words;
    words.Add(L"Zebra");
    words.Add(L"Apple");
    words.Add(L"Banana");
    
    // Elements are automatically sorted: [Apple, Banana, Zebra]
    
    // Get the number of elements
    vint count = words.Count();  // returns 3
    
    // Check if list contains a value
    bool hasApple = words.Contains(L"Apple");  // true
    bool hasOrange = words.Contains(L"Orange");  // false
    
    // Find the index of a value (binary search - O(log n))
    vint index = words.IndexOf(L"Banana");  // returns 1
    vint notFound = words.IndexOf(L"Orange");  // returns -1
}
```

### Removing Elements

```cpp
#include "Vlpp.h"
using namespace vl;

void RemovingElements()
{
    SortedList<vint> numbers;
    numbers.Add(50);
    numbers.Add(10);
    numbers.Add(30);
    numbers.Add(20);
    numbers.Add(40);
    // Sorted order: [10, 20, 30, 40, 50]
    
    // Remove by value
    bool removed = numbers.Remove(30);  // true
    // Now: [10, 20, 40, 50]
    
    // Remove by index
    bool removedAt = numbers.RemoveAt(1);  // removes element at index 1 (value 20)
    // Now: [10, 40, 50]
    
    // Remove multiple elements
    numbers.Add(35);
    numbers.Add(45);
    // Now: [10, 35, 40, 45, 50]
    
    numbers.RemoveRange(1, 2);  // Remove 2 elements starting at index 1
    // Now: [10, 45, 50]
    
    // Clear all elements
    numbers.Clear();
    // Now: []
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
    
    // Comparison operators needed for sorting
    friend std::strong_ordering operator<=>(const Person& a, const Person& b)
    {
        // Sort by name first, then by age
        if (auto result = a.name <=> b.name; result != 0)
            return result;
        return a.age <=> b.age;
    }
    
    bool operator==(const Person& other) const
    {
        return name == other.name && age == other.age;
    }
};

void ComplexTypeSortedList()
{
    SortedList<Person> people;
    
    // Add people - they will be sorted by name, then age
    people.Add(Person(L"Charlie", 30));
    people.Add(Person(L"Alice", 25));
    people.Add(Person(L"Bob", 35));
    people.Add(Person(L"Alice", 28));  // Different age, same name
    
    // Elements are automatically sorted by name, then age:
    // [Alice(25), Alice(28), Bob(35), Charlie(30)]
    
    // Search for a specific person
    Person target(L"Bob", 35);
    vint bobIndex = people.IndexOf(target);  // Fast binary search
    
    // Remove a person
    people.Remove(Person(L"Alice", 25));
}
```

### Custom Comparison

For types without natural ordering, you can use function objects or provide custom comparison:

```cpp
#include "Vlpp.h"
using namespace vl;

struct PersonByAge
{
    WString name;
    vint age;
    
    PersonByAge() : age(0) {}
    PersonByAge(const WString& n, vint a) : name(n), age(a) {}
    
    // Sort by age instead of name
    friend std::strong_ordering operator<=>(const PersonByAge& a, const PersonByAge& b)
    {
        return a.age <=> b.age;
    }
    
    bool operator==(const PersonByAge& other) const
    {
        return name == other.name && age == other.age;
    }
};

void CustomSorting()
{
    SortedList<PersonByAge> peopleByAge;
    
    peopleByAge.Add(PersonByAge(L"Charlie", 30));
    peopleByAge.Add(PersonByAge(L"Alice", 25));
    peopleByAge.Add(PersonByAge(L"Bob", 35));
    
    // Elements are sorted by age: [Alice(25), Charlie(30), Bob(35)]
    
    for (vint i = 0; i < peopleByAge.Count(); i++)
    {
        Console::WriteLine(peopleByAge[i].name + L" (" + itow(peopleByAge[i].age) + L")");
    }
}
```

### Iterating Through SortedLists

```cpp
#include "Vlpp.h"
using namespace vl;

void IterateSortedLists()
{
    SortedList<vint> numbers;
    // Add in random order
    numbers.Add(5);
    numbers.Add(2);
    numbers.Add(8);
    numbers.Add(1);
    numbers.Add(9);
    
    // Iteration always gives sorted order
    for (vint i = 0; i < numbers.Count(); i++)
    {
        Console::WriteLine(itow(numbers[i]));
        // Output: 1, 2, 5, 8, 9
    }
    
    // Range-based for loop (C++11)
    for (auto number : numbers)
    {
        // Process each number in sorted order
        Console::WriteLine(itow(number));
    }
    
    // Indexed iteration using collections framework
    for (auto [number, index] : indexed(numbers))
    {
        Console::WriteLine(L"position " + itow(index) + L": " + itow(number));
    }
}
```

## Integration with Collections Framework

SortedLists work seamlessly with Vlpp's collections framework:

```cpp
#include "Vlpp.h"
using namespace vl;

void CollectionsIntegration()
{
    SortedList<vint> source;
    // Add elements in any order
    source.Add(3);
    source.Add(1);
    source.Add(4);
    source.Add(1);  // duplicates allowed
    source.Add(5);
    
    // Use with LazyList operations (elements already sorted)
    auto doubled = From(source)
        .Select([](vint x) { return x * 2; })
        .Where([](vint x) { return x > 5; });
    
    // Copy to other collection types
    List<vint> list;
    CopyFrom(list, source);  // list will have sorted elements
    
    Array<vint> array;
    CopyFrom(array, source);  // array will have sorted elements
    
    // Create LazyList from SortedList
    auto lazy = From(source);
    vint sum = lazy.Aggregate([](vint a, vint b) { return a + b; });
}
```

## Efficient Operations

SortedList provides efficient operations due to its sorted nature:

```cpp
#include "Vlpp.h"
using namespace vl;

void EfficientOperations()
{
    SortedList<vint> numbers;
    
    // Add many elements
    for (vint i = 100; i >= 1; i--)
    {
        numbers.Add(i);  // Each insert finds correct position efficiently
    }
    
    // Binary search for elements (O(log n))
    bool found = numbers.Contains(50);  // Very fast
    vint index = numbers.IndexOf(75);   // Very fast
    
    // Range operations on sorted data
    auto greaterThan50 = From(numbers)
        .Where([](vint x) { return x > 50; });
    
    // Finding min/max is trivial (first/last element)
    if (numbers.Count() > 0)
    {
        vint minimum = numbers[0];                    // O(1)
        vint maximum = numbers[numbers.Count() - 1];  // O(1)
    }
}
```

## Performance Characteristics

- **Access Time**: O(1) for read operations by index
- **Memory Layout**: Elements are stored contiguously in memory
- **Cache Efficiency**: Excellent cache locality for sequential access
- **Add Cost**: O(n) in worst case (when inserting at the beginning), O(log n) to find position + O(n) to shift elements
- **Remove Cost**: O(n) in worst case (when removing from the beginning)
- **Search Cost**: O(log n) for `Contains()` and `IndexOf()` operations (binary search)
- **Sort Maintenance**: Always maintained - no explicit sorting needed

## Comparison with Other Collections

### SortedList vs List

```cpp
#include "Vlpp.h"
using namespace vl;

void SortedListVsList()
{
    List<vint> regularList;
    SortedList<vint> sortedList;
    
    // Adding elements
    regularList.Add(30);
    regularList.Add(10);
    regularList.Add(20);
    // regularList: [30, 10, 20]
    
    sortedList.Add(30);
    sortedList.Add(10);
    sortedList.Add(20);
    // sortedList: [10, 20, 30] - automatically sorted!
    
    // Regular list needs explicit sorting
    Sort(&regularList[0], regularList.Count());
    
    // SortedList is always sorted - no explicit sorting needed
}
```

### SortedList vs Array

```cpp
#include "Vlpp.h"
using namespace vl;

void SortedListVsArray()
{
    Array<vint> array(5);
    array[0] = 30;
    array[1] = 10;
    array[2] = 20;
    array[3] = 40;
    array[4] = 5;
    
    // Array needs explicit sorting
    Sort(&array[0], array.Count());
    
    SortedList<vint> sortedList;
    sortedList.Add(30);
    sortedList.Add(10);
    sortedList.Add(20);
    sortedList.Add(40);
    sortedList.Add(5);
    
    // SortedList is automatically sorted
    // Both now have the same order: [5, 10, 20, 30, 40]
}
```

## When to Use SortedList<T>

Use `SortedList<T>` when:
- You need elements to be automatically maintained in sorted order
- You frequently search for elements (benefits from binary search)
- You need both dynamic sizing and sorted order
- You want to avoid manual sorting operations
- You frequently need minimum/maximum elements

Consider `List<T>` instead when:
- Order of insertion matters more than sorted order
- You frequently need to insert at specific positions
- Sorting overhead is not acceptable for your use case

Consider `Array<T>` instead when:
- You have a fixed number of elements
- You need the simplest possible container
- You can sort once and don't need frequent insertions

## Related Classes

- `List<T>` - Dynamic array that maintains insertion order
- `Array<T>` - Fixed-size array container
- `ObservableList<T>` - List that triggers events when modified
- `LazyList<T>` - LINQ-style enumerable sequence