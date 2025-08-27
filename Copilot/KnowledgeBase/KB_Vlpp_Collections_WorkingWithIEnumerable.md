# Working with IEnumerable and IEnumerator

The `IEnumerable<T>` and `IEnumerator<T>` interfaces form the foundation of iteration in the Vlpp framework. All collection types implement `IEnumerable<T>`, enabling range-based for loops, LINQ operations, and custom iteration patterns.

## Understanding IEnumerable&lt;T&gt;

`IEnumerable<T>` represents any type that can provide a sequence of values. All Vlpp collections (List, Array, Dictionary, Group, etc.) implement this interface.

### Key Methods

- `CreateEnumerator()` - Creates an enumerator for iteration
- `GetCollectionObject()` - Gets the underlying collection object
- `GetCollectionReference()` - Gets associated collection reference
- `SetCollectionReference()` - Associates a collection reference

```cpp
List<vint> numbers;
numbers.Add(1);
numbers.Add(2);
numbers.Add(3);

// IEnumerable<vint>* enumerable = &numbers;
// All collections can be treated as IEnumerable<T>
```

## Understanding IEnumerator&lt;T&gt;

`IEnumerator<T>` provides the mechanism to iterate through a collection element by element.

### Key Methods

- `Next()` - Advances to the next element, returns false when exhausted
- `Current()` - Gets the current element (only valid after successful Next())
- `Index()` - Gets the current position index
- `Reset()` - Resets the enumerator to the beginning
- `Clone()` - Creates a copy of the enumerator at its current state
- `Evaluated()` - Indicates if all values have been evaluated (for lazy collections)

### Basic Enumerator Usage

```cpp
List<WString> names;
names.Add(L"Alice");
names.Add(L"Bob");
names.Add(L"Charlie");

// Manual enumeration
auto enumerator = names.CreateEnumerator();
while (enumerator->Next())
{
    Console::WriteLine(L"Name: " + enumerator->Current());
    Console::WriteLine(L"Index: " + itow(enumerator->Index()));
}
delete enumerator;
```

## Range-Based For Loop Integration

The most common way to work with `IEnumerable<T>` is through range-based for loops:

```cpp
List<vint> numbers;
for (vint i = 1; i <= 5; i++)
    numbers.Add(i);

// Simple iteration
for (auto number : numbers)
{
    Console::WriteLine(itow(number));
}

// Works with any IEnumerable<T>
Dictionary<WString, vint> scores;
scores.Add(L"Alice", 95);
scores.Add(L"Bob", 87);

for (auto [name, score] : scores)  // Dictionary implements IEnumerable<Pair<K, V>>
{
    Console::WriteLine(name + L": " + itow(score));
}
```

## Using the indexed() Function

The `indexed()` function creates an enumerable that pairs each value with its index:

```cpp
List<WString> colors;
colors.Add(L"Red");
colors.Add(L"Green");
colors.Add(L"Blue");

// Iterate with index using structured binding
for (auto [color, index] : indexed(colors))
{
    Console::WriteLine(itow(index) + L": " + color);
}
// Output:
// 0: Red
// 1: Green
// 2: Blue
```

## Enumerator State Management

### Cloning Enumerators

```cpp
List<vint> numbers;
for (vint i = 1; i <= 5; i++)
    numbers.Add(i);

auto enumerator1 = numbers.CreateEnumerator();
enumerator1->Next();  // Move to first element
enumerator1->Next();  // Move to second element

// Clone the enumerator at current position
auto enumerator2 = enumerator1->Clone();

Console::WriteLine(L"Enumerator 1: " + itow(enumerator1->Current()));  // 2
Console::WriteLine(L"Enumerator 2: " + itow(enumerator2->Current()));  // 2

// They can now advance independently
enumerator1->Next();
Console::WriteLine(L"Enumerator 1: " + itow(enumerator1->Current()));  // 3
Console::WriteLine(L"Enumerator 2: " + itow(enumerator2->Current()));  // 2

delete enumerator1;
delete enumerator2;
```

### Resetting Enumerators

```cpp
List<WString> items;
items.Add(L"First");
items.Add(L"Second");
items.Add(L"Third");

auto enumerator = items.CreateEnumerator();

// First pass through the collection
Console::WriteLine(L"First iteration:");
while (enumerator->Next())
{
    Console::WriteLine(enumerator->Current());
}

// Reset and iterate again
enumerator->Reset();
Console::WriteLine(L"Second iteration:");
while (enumerator->Next())
{
    Console::WriteLine(enumerator->Current());
}

delete enumerator;
```

## Working with Different Collection Types

### Array Enumeration

```cpp
Array<vint> arr(5);
for (vint i = 0; i < 5; i++)
    arr.Set(i, i * 10);

// Array implements IEnumerable<T>
for (auto value : arr)
{
    Console::WriteLine(L"Array value: " + itow(value));
}
```

### Dictionary Enumeration

```cpp
Dictionary<WString, vint> grades;
grades.Add(L"Math", 95);
grades.Add(L"Science", 87);
grades.Add(L"History", 92);

// Dictionary implements IEnumerable<Pair<K, V>>
for (auto pair : grades)
{
    Console::WriteLine(L"Subject: " + pair.key + L", Grade: " + itow(pair.value));
}

// Enumerate keys only
for (auto subject : grades.Keys())  // Keys() returns IEnumerable<K>
{
    Console::WriteLine(L"Subject: " + subject);
}

// Enumerate values only
for (auto grade : grades.Values())  // Values() returns IEnumerable<V>
{
    Console::WriteLine(L"Grade: " + itow(grade));
}
```

### Group Enumeration

```cpp
Group<WString, WString> categories;
categories.Add(L"Fruits", L"Apple");
categories.Add(L"Fruits", L"Banana");
categories.Add(L"Vegetables", L"Carrot");

// Group implements IEnumerable<Pair<K, V>> - iterates all key-value pairs
for (auto [category, item] : categories)
{
    Console::WriteLine(category + L": " + item);
}
// Output:
// Fruits: Apple
// Fruits: Banana
// Vegetables: Carrot
```

## Lazy Evaluation and the Evaluated() Method

Some enumerators support lazy evaluation, meaning they compute values on-demand:

```cpp
// Example with a hypothetical lazy collection
auto lazyNumbers = From(someCollection)
    .Where([](vint x) { return x > 10; })
    .Select([](vint x) { return x * 2; });

auto enumerator = lazyNumbers.CreateEnumerator();

// Check if all values have been computed
if (!enumerator->Evaluated())
{
    Console::WriteLine(L"Enumerator is still lazy - values computed on demand");
}

while (enumerator->Next())
{
    // Values are computed during iteration
    auto value = enumerator->Current();
    Console::WriteLine(itow(value));
}

delete enumerator;
```

## Collection Reference Management

IEnumerable supports collection reference management for memory and lifetime control:

```cpp
// Create an enumerable
List<vint> numbers;
for (vint i = 1; i <= 3; i++)
    numbers.Add(i);

// Check if there's an associated reference
auto collectionRef = numbers.GetCollectionReference();
if (!collectionRef)
{
    Console::WriteLine(L"No collection reference associated");
}

// The collection object
auto collectionObj = numbers.GetCollectionObject();
if (collectionObj)
{
    Console::WriteLine(L"Collection object available");
}
```

## Error Handling and Safety

### Safe Current() Access

```cpp
List<vint> numbers;
numbers.Add(42);

auto enumerator = numbers.CreateEnumerator();

// Current() is undefined before first Next() call
// enumerator->Current();  // UNSAFE!

if (enumerator->Next())
{
    Console::WriteLine(itow(enumerator->Current()));  // SAFE
}

delete enumerator;
```

### Checking Bounds

```cpp
List<WString> items;
items.Add(L"Only item");

auto enumerator = items.CreateEnumerator();

// Process all items safely
while (enumerator->Next())
{
    Console::WriteLine(L"Item " + itow(enumerator->Index()) + L": " + enumerator->Current());
}

// Next() returns false when no more items
if (!enumerator->Next())
{
    Console::WriteLine(L"No more items");
}

delete enumerator;
```

## Best Practices

1. **Prefer range-based for loops**: They're safer and more readable than manual enumeration.

2. **Use indexed() for position tracking**: When you need both value and index.

3. **Always call Next() before Current()**: Current() is undefined until Next() is called.

4. **Remember to delete enumerators**: Manual enumerator creation requires manual cleanup.

5. **Check Next() return value**: It indicates whether Current() is valid.

6. **Use structured binding**: Makes code more readable, especially for Pair types.

```cpp
// Good: Range-based for loop
for (auto [key, value] : dictionary)
{
    // Process key and value
}

// Less preferred: Manual enumeration (but sometimes necessary)
auto enumerator = dictionary.CreateEnumerator();
while (enumerator->Next())
{
    auto pair = enumerator->Current();
    // Process pair.key and pair.value
}
delete enumerator;
```

The IEnumerable and IEnumerator interfaces provide a powerful, consistent way to work with collections in Vlpp, enabling both simple iteration and complex LINQ-style operations while maintaining type safety and performance.