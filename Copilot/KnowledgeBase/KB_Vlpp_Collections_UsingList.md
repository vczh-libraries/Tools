# Using List for Dynamic Collections

`List<T>` is a linear container with dynamic size that can grow and shrink during runtime.

## Basic Usage

### Creating and Adding Elements

```cpp
List<vint> numbers;

// Add elements to the end
numbers.Add(10);        // [10]
numbers.Add(20);        // [10, 20]

// Insert elements at specific positions
numbers.Insert(1, 15);  // [10, 15, 20]
numbers.Insert(0, 5);   // [5, 10, 15, 20]
```

### Accessing Elements

```cpp
// Get and set values by index
vint value = numbers.Get(i);  // or numbers[i]
numbers.Set(1, 25);           // or numbers[1] = 25;

// Core operations
vint count = numbers.Count();
bool hasValue = numbers.Contains(20);
vint index = numbers.IndexOf(15);  // returns -1 if not found
```

### Removing Elements

```cpp
bool removed = numbers.Remove(20);     // Remove first occurrence by value
bool removedAt = numbers.RemoveAt(1);  // Remove by index
numbers.RemoveRange(1, 2);             // Remove 2 elements starting at index 1
numbers.Clear();                       // Remove all elements
```

## Working with Complex Types

```cpp
struct Person
{
    WString name;
    vint age;
    
    Person(const WString& n, vint a) : name(n), age(a) {}
    
    bool operator==(const Person& other) const
    {
        return name == other.name && age == other.age;
    }
};

List<Person> people;
people.Add(Person(L"Alice", 25));
people.Insert(0, Person(L"Bob", 30));

// Search and modify
vint aliceIndex = people.IndexOf(Person(L"Alice", 25));
if (aliceIndex != -1)
{
    people[aliceIndex].age = 26;
}
```

## Integration with Collections Framework

```cpp
List<vint> source = {1, 2, 3, 4, 5};

// Use with LINQ operations
auto doubled = From(source)
    .Select([](vint x) { return x * 2; })
    .Where([](vint x) { return x > 5; });

// Collect results back to List
List<vint> results;
CopyFrom(results, doubled);
```

## Performance Characteristics

- **Access Time**: O(1) for read/write by index
- **Add Cost**: O(1) amortized when adding to end
- **Insert Cost**: O(n) worst case (inserting at beginning)
- **Remove Cost**: O(n) worst case (removing from beginning)
- **Search Cost**: O(n) for `Contains()` and `IndexOf()`

## When to Use List<T>

Use `List<T>` when:
- You need a dynamic collection that can grow and shrink
- You frequently add or remove elements
- The size varies significantly during runtime
- You need random access to elements

Consider `Array<T>` when size is known and rarely changes.
Consider `SortedList<T>` when you need automatic sorting.