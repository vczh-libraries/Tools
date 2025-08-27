# Using Range-Based For Loop with Collections

C++ range-based for loops work seamlessly with any collection implementing `IEnumerable<T>` in the Vlpp framework.

## Basic Usage

### With Core Collection Types

```cpp
List<vint> numbers = {1, 2, 3};
for (auto number : numbers)
{
    Console::WriteLine(itow(number));
}

Array<WString> names(3);
names[0] = L"Alice"; names[1] = L"Bob"; names[2] = L"Charlie";
for (const auto& name : names)
{
    Console::WriteLine(name);
}

Dictionary<WString, vint> scores;
scores.Add(L"Alice", 95);
for (const auto& pair : scores)
{
    Console::WriteLine(L"Student: " + pair.key + L", Score: " + itow(pair.value));
}
```

## Working with LazyList

Range-based for loops work with LINQ operations:

```cpp
List<vint> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

// Chain LINQ operations and iterate
for (auto square : From(numbers)
    .Where([](vint x) { return x % 2 == 0; })
    .Select([](vint x) { return x * x; }))
{
    Console::WriteLine(itow(square)); // Prints 4, 16, 36, 64, 100
}
```

## Reference vs Value Semantics

```cpp
List<WString> longStrings = {L"This is a very long string"};

// Good: no copying for large objects
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

## Comparison with Traditional Loops

### Range-based for - when you only need values
```cpp
for (const auto& item : items)
{
    Console::WriteLine(item);
}
```

### Traditional for - when you need index or custom iteration
```cpp
// When you need the index
for (vint i = 0; i < items.Count(); i++)
{
    Console::WriteLine(L"Item " + itow(i) + L": " + items[i]);
}

// When iterating in reverse
for (vint i = items.Count() - 1; i >= 0; i--)
{
    Console::WriteLine(items[i]);
}
```

## Best Practices

- Use `const auto&` for read-only iteration of objects
- Use `auto` for simple value types like `vint`, `bool`
- Choose range-based for when you only need values, not indices
- Use traditional loops when you need index access or custom iteration patterns