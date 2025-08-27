# Using Indexed Function for Index Access

The `indexed` function in Vlpp provides a convenient way to iterate through collections while having access to both the index and the value. This is particularly useful when you need the position information during iteration with range-based for loops.

## Basic Usage

### Converting Collections to Indexed Pairs

The `indexed` function converts any `IEnumerable<T>` to `IEnumerable<Pair<vint, T>>`:

```cpp
List<WString> fruits;
fruits.Add(L"apple");
fruits.Add(L"banana");
fruits.Add(L"cherry");

// Iterate with index and value
for (auto [index, fruit] : indexed(fruits))
{
    Console::WriteLine(L"Fruit " + itow(index) + L": " + fruit);
}
// Output:
// Fruit 0: apple
// Fruit 1: banana
// Fruit 2: cherry
```

### With Structured Binding

The `indexed` function works perfectly with C++17 structured binding syntax:

```cpp
Array<vint> numbers(5);
for (vint i = 0; i < 5; i++)
{
    numbers[i] = (i + 1) * 10;
}

for (auto [i, num] : indexed(numbers))
{
    Console::WriteLine(L"numbers[" + itow(i) + L"] = " + itow(num));
}
// Output:
// numbers[0] = 10
// numbers[1] = 20
// numbers[2] = 30
// numbers[3] = 40
// numbers[4] = 50
```

### Without Structured Binding

If you're not using C++17 structured binding, you can access the `key` and `value` fields of the pair:

```cpp
SortedList<WString> words;
words.Add(L"zebra");
words.Add(L"apple");
words.Add(L"banana");

for (const auto& pair : indexed(words))
{
    Console::WriteLine(L"Word " + itow(pair.key) + L": " + pair.value);
}
// Output (sorted order):
// Word 0: apple
// Word 1: banana
// Word 2: zebra
```

## Working with Different Collection Types

### Dictionary Collections

When used with dictionaries, `indexed` provides position numbers for key-value pairs:

```cpp
Dictionary<WString, vint> grades;
grades.Add(L"Alice", 95);
grades.Add(L"Bob", 87);
grades.Add(L"Charlie", 92);

for (auto [position, studentGrade] : indexed(grades))
{
    Console::WriteLine(L"Entry " + itow(position) + L": " + 
        studentGrade.key + L" = " + itow(studentGrade.value));
}
// Output:
// Entry 0: Alice = 95
// Entry 1: Bob = 87
// Entry 2: Charlie = 92
```

### Group Collections

With group collections, each key-value pair gets its own index:

```cpp
Group<WString, vint> subjectGrades;
subjectGrades.Add(L"Math", 95);
subjectGrades.Add(L"Math", 87);
subjectGrades.Add(L"Science", 92);
subjectGrades.Add(L"Science", 89);

for (auto [idx, entry] : indexed(subjectGrades))
{
    Console::WriteLine(L"Entry " + itow(idx) + L": " + 
        entry.key + L" = " + itow(entry.value));
}
// Output:
// Entry 0: Math = 95
// Entry 1: Math = 87
// Entry 2: Science = 92
// Entry 3: Science = 89
```

## Combining with LINQ Operations

The `indexed` function works seamlessly with LINQ operations:

```cpp
List<WString> names;
names.Add(L"Alice");
names.Add(L"Bob");
names.Add(L"Charlie");
names.Add(L"David");

// Find names with even indices
auto evenIndexNames = From(indexed(names))
    .Where([](const auto& pair) { return pair.key % 2 == 0; })
    .Select([](const auto& pair) { return pair.value; })
    .ToList();

for (const auto& name : evenIndexNames)
{
    Console::WriteLine(L"Even index name: " + name);
}
// Output:
// Even index name: Alice
// Even index name: Charlie
```

### Complex LINQ with Indexed

```cpp
List<vint> numbers;
for (vint i = 1; i <= 10; i++)
{
    numbers.Add(i);
}

// Get squares of numbers at odd indices
for (auto [originalIndex, square] : indexed(
    From(indexed(numbers))
        .Where([](const auto& pair) { return pair.key % 2 == 1; })
        .Select([](const auto& pair) { return pair.value * pair.value; })))
{
    Console::WriteLine(L"Square " + itow(originalIndex) + L": " + itow(square));
}
// Output:
// Square 0: 4    (2^2, originally at index 1)
// Square 1: 16   (4^2, originally at index 3)
// Square 2: 36   (6^2, originally at index 5)
// Square 3: 64   (8^2, originally at index 7)
// Square 4: 100  (10^2, originally at index 9)
```

## Practical Use Cases

### Finding Elements with Position Information

```cpp
List<WString> items;
items.Add(L"header");
items.Add(L"content");
items.Add(L"footer");
items.Add(L"content");

// Find all occurrences of "content" with their positions
for (auto [index, item] : indexed(items))
{
    if (item == L"content")
    {
        Console::WriteLine(L"Found 'content' at position " + itow(index));
    }
}
// Output:
// Found 'content' at position 1
// Found 'content' at position 3
```

### Building Formatted Output with Line Numbers

```cpp
List<WString> codeLines;
codeLines.Add(L"#include <iostream>");
codeLines.Add(L"");
codeLines.Add(L"int main() {");
codeLines.Add(L"    return 0;");
codeLines.Add(L"}");

for (auto [lineNum, code] : indexed(codeLines))
{
    WString lineNumber = itow(lineNum + 1);
    // Pad line number to 3 characters
    while (lineNumber.Length() < 3)
    {
        lineNumber = L" " + lineNumber;
    }
    Console::WriteLine(lineNumber + L": " + code);
}
// Output:
//   1: #include <iostream>
//   2: 
//   3: int main() {
//   4:     return 0;
//   5: }
```

### Processing with Neighbor Awareness

```cpp
List<vint> temperatures;
temperatures.Add(20);
temperatures.Add(25);
temperatures.Add(30);
temperatures.Add(28);
temperatures.Add(22);

for (auto [day, temp] : indexed(temperatures))
{
    WString message = L"Day " + itow(day + 1) + L": " + itow(temp) + L"°C";
    
    if (day > 0)
    {
        vint yesterday = temperatures[day - 1];
        vint change = temp - yesterday;
        if (change > 0)
        {
            message += L" (+" + itow(change) + L"°C)";
        }
        else if (change < 0)
        {
            message += L" (" + itow(change) + L"°C)";
        }
        else
        {
            message += L" (no change)";
        }
    }
    
    Console::WriteLine(message);
}
// Output:
// Day 1: 20°C
// Day 2: 25°C (+5°C)
// Day 3: 30°C (+5°C)
// Day 4: 28°C (-2°C)
// Day 5: 22°C (-6°C)
```

## Comparison with Traditional Approaches

### Before: Manual Index Management

```cpp
List<WString> items;
items.Add(L"first");
items.Add(L"second");
items.Add(L"third");

// Traditional approach
for (vint i = 0; i < items.Count(); i++)
{
    Console::WriteLine(L"Item " + itow(i) + L": " + items[i]);
}
```

### After: Using indexed Function

```cpp
// Modern approach with indexed
for (auto [i, item] : indexed(items))
{
    Console::WriteLine(L"Item " + itow(i) + L": " + item);
}
```

## Best Practices

### Use Meaningful Variable Names

```cpp
List<WString> usernames;
usernames.Add(L"alice");
usernames.Add(L"bob");
usernames.Add(L"charlie");

// Good: descriptive names
for (auto [userIndex, username] : indexed(usernames))
{
    Console::WriteLine(L"User " + itow(userIndex) + L": " + username);
}

// Less clear: generic names
for (auto [i, x] : indexed(usernames))
{
    Console::WriteLine(L"User " + itow(i) + L": " + x);
}
```

### Consider Performance for Large Collections

For very large collections where you only need some elements, consider filtering first:

```cpp
List<WString> largeList;
// ... populate with many items

// Efficient: filter first, then index
for (auto [idx, item] : indexed(
    From(largeList).Where([](const WString& s) { return s.Length() > 5; })))
{
    Console::WriteLine(L"Long item " + itow(idx) + L": " + item);
}
```

### Combine with const auto& for Large Objects

```cpp
List<ComplexObject> objects;
// ... populate list

// Good: avoid copying large objects
for (auto [i, obj] : indexed(objects))
{
    // 'obj' is copied here - might be expensive
}

// Better: use const reference if supported by the collection
for (const auto& [i, obj] : indexed(objects))
{
    // This might still copy depending on implementation
}
```

The `indexed` function provides a clean and expressive way to iterate with position information, making code more readable and less error-prone compared to manual index management.