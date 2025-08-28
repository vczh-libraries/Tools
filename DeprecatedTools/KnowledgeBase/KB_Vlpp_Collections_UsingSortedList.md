# Using SortedList for Ordered Collections

`SortedList<T>` is a linear container that automatically keeps all elements sorted. Elements are contiguous in memory with automatic order maintenance.

## Basic Usage

### Creating and Adding Elements

```cpp
SortedList<vint> numbers;

// Add elements in any order - they will be sorted automatically
numbers.Add(30);        // [30]
numbers.Add(10);        // [10, 30]
numbers.Add(20);        // [10, 20, 30]
numbers.Add(15);        // [10, 15, 20, 30]

// Elements are always in sorted order
for (auto number : numbers)
{
    Console::WriteLine(itow(number)); // Output: 10, 15, 20, 30
}
```

### Core Operations

```cpp
SortedList<WString> words;
words.Add(L"Zebra");
words.Add(L"Apple");
words.Add(L"Banana");
// Automatically sorted: [Apple, Banana, Zebra]

// Core operations
vint count = words.Count();
bool hasApple = words.Contains(L"Apple");     // O(log n) binary search
vint index = words.IndexOf(L"Banana");        // O(log n) binary search

// Access by index (read-only, no Set method)
WString first = words.Get(0);  // or words[0]
```

### Removing Elements

```cpp
bool removed = numbers.Remove(30);     // Remove by value
bool removedAt = numbers.RemoveAt(1);  // Remove by index
numbers.RemoveRange(1, 2);             // Remove 2 elements starting at index 1
numbers.Clear();                       // Remove all elements
```

## Working with Complex Types

Types must support comparison operators:

```cpp
struct Person
{
    WString name;
    vint age;
    
    Person(const WString& n, vint a) : name(n), age(a) {}
    
    // Required for sorting
    friend std::strong_ordering operator<=>(const Person& a, const Person& b)
    {
        if (auto result = a.name <=> b.name; result != 0)
            return result;
        return a.age <=> b.age;
    }
    
    bool operator==(const Person& other) const
    {
        return name == other.name && age == other.age;
    }
};

SortedList<Person> people;
people.Add(Person(L"Charlie", 30));
people.Add(Person(L"Alice", 25));
// Automatically sorted: [Alice(25), Charlie(30)]
```

## Integration with Collections Framework

```cpp
SortedList<vint> source = {3, 1, 4, 1, 5}; // Automatically sorted to [1, 1, 3, 4, 5]

// Use with LINQ operations (elements already sorted)
auto doubled = From(source)
    .Select([](vint x) { return x * 2; })
    .Where([](vint x) { return x > 5; });

// Finding min/max is trivial
if (source.Count() > 0)
{
    vint minimum = source[0];                        // O(1)
    vint maximum = source[source.Count() - 1];       // O(1)
}
```

## Performance Characteristics

- **Access Time**: O(1) for read by index
- **Add Cost**: O(n) worst case (insertion with shifting), O(log n) for position finding
- **Remove Cost**: O(n) worst case (removing with shifting)
- **Search Cost**: O(log n) for `Contains()` and `IndexOf()` (binary search)
- **Always Sorted**: No explicit sorting needed

## When to Use SortedList<T>

Use `SortedList<T>` when:
- You need elements automatically maintained in sorted order
- You frequently search for elements (benefits from binary search)
- You need both dynamic sizing and sorted order
- You want to avoid manual sorting operations

Consider `List<T>` when insertion order matters more than sorted order.
Consider `Array<T>` when you have a fixed number of elements.