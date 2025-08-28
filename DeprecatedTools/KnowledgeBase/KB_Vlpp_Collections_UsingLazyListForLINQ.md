# Using LazyList for LINQ Operations

`LazyList<T>` implements LINQ for C++ with lazy evaluation, meaning operations are only executed when results are actually needed.

## Creating LazyList

Use `From(collection)` to create a `LazyList<T>` from any collection implementing `IEnumerable<T>`:

```cpp
List<vint> numbers = {1, 2, 3, 4, 5};
auto lazyNumbers = From(numbers);
```

## Basic LINQ Operations

### Where - Filtering

```cpp
// Get even numbers
auto evenNumbers = From(numbers)
    .Where([](vint x) { return x % 2 == 0; });
```

### Select - Transformation

```cpp
// Square each number
auto squaredNumbers = From(numbers)
    .Select([](vint x) { return x * x; });

// Transform to strings
auto numberStrings = From(numbers)
    .Select([](vint x) { return L"Number: " + itow(x); });
```

### Skip, Take, and Reverse

```cpp
// Skip first 3, take next 5
auto middleElements = From(numbers)
    .Skip(3)
    .Take(5);

// Reverse order
auto reversedNumbers = From(numbers)
    .Reverse();
```

## Chaining Operations

Recommended formatting with line breaks before `.` for readability:

```cpp
auto result = From(numbers)
    .Skip(3)
    .Where([](vint x) { return x % 2 == 0; })
    .Select([](vint x) { return x * x; })
    .Take(5)
    .Reverse();
```

## Working with Complex Data

```cpp
struct Person
{
    WString name;
    vint age;
    WString city;
};

List<Person> people = {{L"Alice", 25, L"New York"}, {L"Bob", 30, L"Boston"}};

// Find adult names from specific cities
auto adultNames = From(people)
    .Where([](const Person& p) { return p.age >= 25; })
    .Where([](const Person& p) { return p.city == L"New York" || p.city == L"Boston"; })
    .Select([](const Person& p) { return p.name; });
```

## Converting Results

```cpp
// Direct iteration (no intermediate collection)
for (auto item : From(collection).Where(condition))
{
    // Process item
}

// Convert to specific collection type
List<ResultType> result;
for (auto item : lazyResult)
{
    result.Add(item);
}
```

## Key Characteristics

- **Lazy Evaluation**: Operations execute only when results are needed
- **Memory Efficient**: No intermediate collections created
- **Composable**: Operations can be chained without performance penalty
- **Integration**: Works with all Vlpp collection types and range-based for loops

## Best Practices

1. **Use meaningful lambda parameters** for readability
2. **Break long chains** with line breaks before `.`
3. **Combine filters** when possible for efficiency
4. **Use auto** for complex type inference