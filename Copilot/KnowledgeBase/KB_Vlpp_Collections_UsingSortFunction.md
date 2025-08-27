# Using Sort Function for Quick Sort

The `Sort` function provides quick sort capabilities for C++ raw pointers with array-like data structures using C++20 three-way comparison.

## Basic Usage

```cpp
template<typename T, typename F>
void Sort(T* buffer, vint count, F&& orderer)
```

### Simple Sorting

```cpp
vint numbers[] = {5, 2, 8, 1, 9, 3};
Sort(numbers, 6, [](const vint& a, const vint& b) {
    return a <=> b;
});
// numbers is now: {1, 2, 3, 5, 8, 9}
```

### Custom Comparator

```cpp
struct Person {
    WString name;
    vint age;
};

Person people[] = {{L"Alice", 25}, {L"Bob", 30}, {L"Charlie", 25}};

// Sort by age first, then by name
Sort(people, 3, [](const Person& a, const Person& b) {
    auto ageCmp = a.age <=> b.age;
    if (ageCmp == std::strong_ordering::equal)
        return a.name <=> b.name;
    return ageCmp;
});
```

## Return Types for Comparators

The comparator must return C++20 three-way comparison results:

- `std::strong_ordering`: For types with total ordering (most common)
- `std::weak_ordering`: For types with weak ordering  
- `std::partial_ordering`: **NOT SUPPORTED** - will trigger `CHECK_ERROR`

```cpp
// Valid - strong ordering
Sort(numbers, count, [](const vint& a, const vint& b) -> std::strong_ordering {
    return a <=> b;
});

// Valid - weak ordering
Sort(strings, count, [](const WString& a, const WString& b) -> std::weak_ordering {
    return a <=> b;
});
```

## Common Patterns

### Reverse Sorting

```cpp
Sort(values, 5, [](const vint& a, const vint& b) {
    return b <=> a;  // Reverse the comparison
});
```

### Working with Collection Buffers

```cpp
List<vint> numbers = {5, 2, 8, 1};

// Sort the internal buffer directly
if (numbers.Count() > 0) {
    Sort(&numbers[0], numbers.Count(), [](const vint& a, const vint& b) {
        return a <=> b;
    });
}
```

## Limitations and Alternatives

### For Partial Ordering
Sort function **does not work** with partial ordering. Use `PartialOrderingProcessor` instead.

### For Automatic Ordering
Use `SortedList<T>` which maintains order during insertion rather than sorting after.

## Performance Characteristics

- **Algorithm**: Quick sort with O(n log n) average time complexity
- **Memory**: In-place sorting, no additional allocation
- **Access**: Direct memory access for maximum performance

## Best Practices

1. **Use strongly typed comparators** when possible
2. **Keep comparators simple** for better performance
3. **Consider SortedList** for frequently changing data
4. **Avoid partial ordering** - use PartialOrderingProcessor instead