# Using Array for Fixed Size Collections

This guideline shows how to use Vlpp's `Array<T>` class for managing fixed-size collections of elements.

## Overview

`Array<T>` is a linear container with fixed size in runtime. All elements are contiguous in memory, providing efficient access and memory usage.

## Basic Usage

### Creating Arrays

```cpp
// Create an array with 5 elements (default initialized)
Array<vint> numbers(5);

// Create an array from existing data
vint sourceData[] = {1, 2, 3, 4, 5};
Array<vint> fromArray(sourceData, 5);
```

### Core Operations

```cpp
Array<WString> words(3);

// Access elements
words[0] = L"Hello";
vint count = words.Count();

// Search operations
bool hasValue = words.Contains(L"Hello");
vint index = words.IndexOf(L"World");  // returns -1 if not found

// Resize array
words.Resize(5);  // Keeps existing elements, fills new ones with defaults
```

## Integration with Collections Framework

```cpp
Array<vint> source(5);
// ... populate source ...

// Use with LazyList operations
auto result = From(source)
    .Select([](vint x) { return x * 2; })
    .Where([](vint x) { return x > 5; });
```

## Performance Characteristics

- **Access Time**: O(1) for read/write by index
- **Resize Cost**: O(n) - creates new buffer and copies elements
- **Search Cost**: O(n) for `Contains()` and `IndexOf()`

## When to Use Array<T>

Use `Array<T>` when:
- You know the size at creation time
- You need random access to elements
- Memory layout and cache performance are important
- You rarely resize the collection

Consider `List<T>` when you frequently modify the collection size.