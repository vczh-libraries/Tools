# Using From Function with Collections

The `From` function creates a `LazyList<T>` from any collection implementing `IEnumerable<T>`, enabling LINQ-style operations.

## Basic Usage

### Creating LazyList from Collections

```cpp
List<vint> numbers = {1, 2, 3, 4, 5};
auto lazyNumbers = From(numbers);

Array<WString> names(3);
names[0] = L"Alice"; names[1] = L"Bob"; names[2] = L"Charlie";
auto lazyNames = From(names);

// From Dictionary (iterates over Pair<K, V>)
Dictionary<WString, vint> scores;
scores.Add(L"Alice", 95);
auto lazyScores = From(scores);
```

### Chaining Operations

```cpp
List<vint> result;
CopyFrom(result, From(numbers)
    .Where([](vint x) { return x % 2 == 0; })  // Filter even numbers
    .Select([](vint x) { return x * x; }));    // Square them
```

## Common Operations

### Filter and Transform

```cpp
List<WString> longWords;
CopyFrom(longWords, From(words)
    .Where([](const WString& w) { return w.Length() > 5; })
    .Select([](const WString& w) { return w.Upper(); }));
```

### Aggregation

```cpp
vint sum = From(values)
    .Aggregate(0, [](vint acc, vint x) { return acc + x; });

vint max = From(values)
    .Aggregate([](vint a, vint b) { return a > b ? a : b; });
```

### Skip and Take

```cpp
List<vint> middle;
CopyFrom(middle, From(numbers)
    .Skip(3)    // Skip first 3
    .Take(4));  // Take next 4
```

## Processing Dictionary Entries

```cpp
List<WString> topStudents;
CopyFrom(topStudents, From(studentGrades)
    .Where([](const Pair<WString, vint>& entry) { return entry.value >= 90; })
    .Select([](const Pair<WString, vint>& entry) { return entry.key; }));
```

## Key Characteristics

- **Lazy Evaluation**: Operations execute only when materialized
- **Method Chaining**: Place line breaks before `.` for readability
- **Materialization**: Use `CopyFrom()` or iterate to execute operations

## Converting Results

```cpp
// To List
List<T> list;
CopyFrom(list, From(collection));

// Direct iteration (no intermediate collection)
for (auto item : From(collection).Where(condition))
{
    // Process item
}
```