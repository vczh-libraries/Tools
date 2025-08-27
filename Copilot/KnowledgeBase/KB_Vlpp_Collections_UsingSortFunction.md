# Using Sort Function for Quick Sort

The `Sort` function in Vlpp provides quick sort capabilities for C++ raw pointers with array-like data structures. It performs efficient in-place sorting using a comparator that returns C++20 three-way comparison results.

## Basic Usage

The Sort function has the following signature:
```cpp
template<typename T, typename F>
void Sort(T* buffer, vint count, F&& orderer)
```

### Simple Sorting

```cpp
#include "Vlpp.h"

// Sort an array of integers
vint numbers[] = {5, 2, 8, 1, 9, 3};
vint count = 6;

Sort(numbers, count, [](const vint& a, const vint& b) {
    return a <=> b;
});

// numbers is now: {1, 2, 3, 5, 8, 9}
```

### Sorting with Custom Comparator

```cpp
struct Person {
    WString name;
    vint age;
    
    std::strong_ordering operator<=>(const Person& other) const {
        auto cmp = age <=> other.age;
        if (cmp == std::strong_ordering::equal)
            return name <=> other.name;
        return cmp;
    }
};

Person people[] = {
    {L"Alice", 25},
    {L"Bob", 30},
    {L"Charlie", 25}
};

// Sort by age first, then by name
Sort(people, 3, [](const Person& a, const Person& b) {
    return a <=> b;
});
```

## Return Types for Comparators

The comparator function must return one of the C++20 three-way comparison results:

- `std::strong_ordering`: For types with total ordering (most common)
- `std::weak_ordering`: For types with weak ordering  
- `std::partial_ordering`: **NOT SUPPORTED** - Sort function will fail with partial ordering

```cpp
// Valid comparator returning std::strong_ordering
auto strongComparator = [](const vint& a, const vint& b) -> std::strong_ordering {
    return a <=> b;
};

// Valid comparator returning std::weak_ordering  
auto weakComparator = [](const WString& a, const WString& b) -> std::weak_ordering {
    return a <=> b;
};

// INVALID - Sort does not work with partial ordering
// This will trigger a CHECK_ERROR at runtime
auto partialComparator = [](const double& a, const double& b) -> std::partial_ordering {
    return a <=> b;  // Don't use this with Sort!
};
```

## Sorting Different Data Types

### String Sorting

```cpp
WString names[] = {L"Charlie", L"Alice", L"Bob"};

Sort(names, 3, [](const WString& a, const WString& b) {
    return a <=> b;
});

// names is now: {L"Alice", L"Bob", L"Charlie"}
```

### Reverse Sorting

```cpp
vint values[] = {1, 5, 3, 9, 2};

Sort(values, 5, [](const vint& a, const vint& b) {
    return b <=> a;  // Reverse the comparison
});

// values is now: {9, 5, 3, 2, 1}
```

### Sorting by Custom Criteria

```cpp
struct Task {
    WString name;
    vint priority;
    DateTime deadline;
};

Task tasks[] = {
    {L"Task A", 1, DateTime::FromDateTime(2024, 1, 15)},
    {L"Task B", 3, DateTime::FromDateTime(2024, 1, 10)},
    {L"Task C", 2, DateTime::FromDateTime(2024, 1, 12)}
};

// Sort by priority (higher first), then by deadline (earlier first)
Sort(tasks, 3, [](const Task& a, const Task& b) {
    auto priorityCmp = b.priority <=> a.priority;  // Higher priority first
    if (priorityCmp == std::strong_ordering::equal)
        return a.deadline <=> b.deadline;  // Earlier deadline first
    return priorityCmp;
});
```

## Working with Collection Buffers

You can use Sort with the internal buffers of Vlpp collections:

```cpp
List<vint> numbers;
numbers.Add(5);
numbers.Add(2);
numbers.Add(8);
numbers.Add(1);

// Sort the internal buffer directly
// Note: This accesses internal implementation details
// Prefer using SortedList for automatic sorting
if (numbers.Count() > 0) {
    Sort(&numbers[0], numbers.Count(), [](const vint& a, const vint& b) {
        return a <=> b;
    });
}
```

## Performance Considerations

1. **In-place sorting**: Sort modifies the original array, no additional memory allocation
2. **Quick sort algorithm**: Average O(n log n) time complexity
3. **Raw pointer operation**: Direct memory access for maximum performance
4. **Template function**: No virtual function call overhead

## Limitations and Alternatives

### Partial Ordering Limitation

Sort function **does not work** with partial ordering. For elements that require partial ordering, use `PartialOrderingProcessor` instead:

```cpp
// For elements with partial ordering relationships
PartialOrderingProcessor processor;
// Use processor.Sort() instead of Sort()
```

### Collection-Specific Alternatives

- **For automatic ordering**: Use `SortedList<T>` which maintains order during insertion
- **For one-time sorting**: Use Sort function with collection's internal buffer
- **For complex sorting**: Consider using `LazyList<T>` with OrderBy operations

## Error Handling

The Sort function will crash with `CHECK_ERROR` if:

1. The comparator returns `std::partial_ordering::unordered`
2. The buffer pointer is null but count > 0
3. The count is negative

```cpp
// This will trigger CHECK_ERROR at runtime
Sort(buffer, count, [](const T& a, const T& b) -> std::partial_ordering {
    return std::partial_ordering::unordered;  // This causes error!
});
```

## Best Practices

1. **Use strongly typed comparators**: Prefer `std::strong_ordering` when possible
2. **Keep comparators simple**: Complex logic can hurt performance  
3. **Consider SortedList**: For frequently changing data that needs to stay ordered
4. **Test edge cases**: Empty arrays, single element arrays, duplicate elements
5. **Avoid partial ordering**: Use PartialOrderingProcessor for complex ordering relationships

```cpp
// Good: Simple, efficient comparator
Sort(array, size, [](const T& a, const T& b) { return a <=> b; });

// Good: Clear multi-criteria sorting
Sort(array, size, [](const Item& a, const Item& b) {
    auto primary = a.priority <=> b.priority;
    return primary != 0 ? primary : a.name <=> b.name;
});

// Better for dynamic data: Use SortedList instead
SortedList<T> sortedData;  // Automatically maintains order
```