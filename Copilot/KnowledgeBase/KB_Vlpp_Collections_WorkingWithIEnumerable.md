# Working with IEnumerable and IEnumerator

The `IEnumerable<T>` and `IEnumerator<T>` interfaces form the foundation of iteration in the Vlpp framework. All collection types implement `IEnumerable<T>`.

## IEnumerable&lt;T&gt; Interface

All Vlpp collections implement `IEnumerable<T>`, enabling range-based for loops and LINQ operations.

### Key Methods

- `CreateEnumerator()` - Creates an enumerator for iteration
- `GetCollectionObject()` - Gets the underlying collection object

## IEnumerator&lt;T&gt; Interface

Provides the mechanism to iterate through a collection element by element.

### Key Methods

- `Next()` - Advances to next element, returns false when exhausted
- `Current()` - Gets the current element (only valid after successful Next())
- `Index()` - Gets the current position index
- `Reset()` - Resets the enumerator to the beginning
- `Clone()` - Creates a copy of the enumerator at its current state

## Basic Usage

### Range-Based For Loops (Preferred)

```cpp
List<vint> numbers = {1, 2, 3, 4, 5};

// Simple iteration
for (auto number : numbers)
{
    Console::WriteLine(itow(number));
}

// With Dictionary (iterates over Pair<K, V>)
Dictionary<WString, vint> scores;
scores.Add(L"Alice", 95);
for (auto [name, score] : scores)
{
    Console::WriteLine(name + L": " + itow(score));
}
```

### Manual Enumeration

```cpp
List<WString> names = {L"Alice", L"Bob", L"Charlie"};

auto enumerator = names.CreateEnumerator();
while (enumerator->Next())
{
    Console::WriteLine(L"Name: " + enumerator->Current());
    Console::WriteLine(L"Index: " + itow(enumerator->Index()));
}
delete enumerator;
```

## Using indexed() Function

```cpp
List<WString> colors = {L"Red", L"Green", L"Blue"};

for (auto [color, index] : indexed(colors))
{
    Console::WriteLine(itow(index) + L": " + color);
}
```

## Enumerator State Management

### Cloning and Resetting

```cpp
List<vint> numbers = {1, 2, 3, 4, 5};

auto enumerator1 = numbers.CreateEnumerator();
enumerator1->Next();  // Move to first element
enumerator1->Next();  // Move to second element

// Clone at current position
auto enumerator2 = enumerator1->Clone();

// Reset to beginning
enumerator1->Reset();

delete enumerator1;
delete enumerator2;
```

## Working with Different Collections

### Dictionary Keys and Values

```cpp
Dictionary<WString, vint> grades;
grades.Add(L"Math", 95);

// Enumerate keys only
for (auto subject : grades.Keys())
{
    Console::WriteLine(L"Subject: " + subject);
}

// Enumerate values only
for (auto grade : grades.Values())
{
    Console::WriteLine(L"Grade: " + itow(grade));
}
```

## Best Practices

1. **Prefer range-based for loops** - safer and more readable
2. **Use indexed() for position tracking** - when you need both value and index
3. **Always call Next() before Current()** - Current() is undefined until Next() is called
4. **Remember to delete manual enumerators** - memory management required
5. **Use structured binding** - makes code more readable for Pair types