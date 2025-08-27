# Using Range-Based For Loop with Collections

C++ range-based for loops work seamlessly with any collection implementing `IEnumerable<T>` in the Vlpp framework. This provides a clean and familiar syntax for iterating through collections.

## Basic Usage

### With Lists
```cpp
List<vint> numbers;
numbers.Add(1);
numbers.Add(2);
numbers.Add(3);

// Range-based for loop
for (auto number : numbers)
{
    Console::WriteLine(itow(number));
}

// Traditional approach for comparison
for (vint i = 0; i < numbers.Count(); i++)
{
    Console::WriteLine(itow(numbers[i]));
}
```

### With Arrays
```cpp
Array<WString> names(3);
names[0] = L"Alice";
names[1] = L"Bob";
names[2] = L"Charlie";

for (const auto& name : names)
{
    Console::WriteLine(name);
}
```

### With Dictionaries
```cpp
Dictionary<WString, vint> scores;
scores.Add(L"Alice", 95);
scores.Add(L"Bob", 87);
scores.Add(L"Charlie", 92);

// Iterate over key-value pairs
for (const auto& pair : scores)
{
    Console::WriteLine(L"Student: " + pair.key + L", Score: " + itow(pair.value));
}
```

### With SortedList
```cpp
SortedList<vint> sortedNumbers;
sortedNumbers.Add(30);
sortedNumbers.Add(10);
sortedNumbers.Add(20);

// Numbers will be iterated in sorted order (10, 20, 30)
for (auto number : sortedNumbers)
{
    Console::WriteLine(itow(number));
}
```

## Working with LazyList

Range-based for loops work perfectly with LINQ operations through `LazyList<T>`:

```cpp
List<vint> numbers;
for (vint i = 1; i <= 10; i++)
{
    numbers.Add(i);
}

// Chain LINQ operations and iterate the result
for (auto square : From(numbers)
    .Where([](vint x) { return x % 2 == 0; })
    .Select([](vint x) { return x * x; }))
{
    Console::WriteLine(itow(square)); // Prints 4, 16, 36, 64, 100
}
```

## Reference vs Value Semantics

### Using const auto& for Large Objects
When iterating over collections containing large objects, use `const auto&` to avoid unnecessary copying:

```cpp
List<WString> longStrings;
longStrings.Add(L"This is a very long string that we don't want to copy");
longStrings.Add(L"Another long string for demonstration");

// Good: no copying
for (const auto& str : longStrings)
{
    Console::WriteLine(str);
}

// Less efficient: copies each string
for (auto str : longStrings)
{
    Console::WriteLine(str);
}
```

### Modifying Values During Iteration
For collections that allow modification, you can use non-const references:

```cpp
List<vint> numbers;
numbers.Add(1);
numbers.Add(2);
numbers.Add(3);

// This won't work - you can't modify the collection structure during iteration
// But you can modify the values if the collection allows it
```

Note: Range-based for loops iterate over copies of values from the collection, so modifying the loop variable doesn't change the original collection values.

## Working with Different Collection Types

### Group Collections
```cpp
Group<WString, vint> studentGrades;
studentGrades.Add(L"Math", 95);
studentGrades.Add(L"Math", 87);
studentGrades.Add(L"Science", 92);
studentGrades.Add(L"Science", 89);

// Iterate over all key-value pairs
for (const auto& pair : studentGrades)
{
    Console::WriteLine(L"Subject: " + pair.key + L", Grade: " + itow(pair.value));
}
```

## Comparison with Traditional Loops

### Advantages of Range-Based For
- Cleaner, more readable syntax
- No need to manage indices or iterators
- Less prone to off-by-one errors
- Works consistently across all collection types

### When to Use Traditional Loops
- When you need access to the index
- When you need to modify the collection during iteration
- When you need to iterate in reverse or with custom steps
- When performance is critical and you need direct array access

```cpp
List<WString> items;
items.Add(L"first");
items.Add(L"second");
items.Add(L"third");

// Range-based for - when you only need the values
for (const auto& item : items)
{
    Console::WriteLine(item);
}

// Traditional for - when you need the index
for (vint i = 0; i < items.Count(); i++)
{
    Console::WriteLine(L"Item " + itow(i) + L": " + items[i]);
}

// Traditional for - when iterating in reverse
for (vint i = items.Count() - 1; i >= 0; i--)
{
    Console::WriteLine(items[i]);
}
```

## Best Practices

### Choose Appropriate Type Declaration
```cpp
List<WString> strings;
strings.Add(L"hello");
strings.Add(L"world");

// Good: specific type when you need string operations
for (const WString& str : strings)
{
    if (str.Length() > 5)
    {
        Console::WriteLine(str);
    }
}

// Good: auto when type is obvious or complex
for (const auto& str : strings)
{
    Console::WriteLine(str);
}
```

### Consistent Style
Use consistent reference semantics throughout your codebase:
- `const auto&` for read-only iteration of objects
- `auto` for simple value types like `vint`, `bool`
- Explicit types when clarity is important

The range-based for loop is the preferred iteration method in modern C++ with Vlpp collections, providing clean and efficient code that's easy to read and maintain.