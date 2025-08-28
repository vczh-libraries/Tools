# Using Indexed Function for Index Access

The `indexed` function provides a convenient way to iterate through collections while having access to both the index and the value.

## Basic Usage

### Converting Collections to Indexed Pairs

The `indexed` function converts any `IEnumerable<T>` to `IEnumerable<Pair<vint, T>>`:

```cpp
List<WString> fruits = {L"apple", L"banana", L"cherry"};

// Iterate with index and value using structured binding
for (auto [index, fruit] : indexed(fruits))
{
    Console::WriteLine(L"Fruit " + itow(index) + L": " + fruit);
}

// Without structured binding (access via .key and .value)
for (const auto& pair : indexed(fruits))
{
    Console::WriteLine(L"Word " + itow(pair.key) + L": " + pair.value);
}
```

## Working with Different Collection Types

### Dictionary Collections

```cpp
Dictionary<WString, vint> grades;
grades.Add(L"Alice", 95);
grades.Add(L"Bob", 87);

for (auto [position, studentGrade] : indexed(grades))
{
    Console::WriteLine(L"Entry " + itow(position) + L": " + 
        studentGrade.key + L" = " + itow(studentGrade.value));
}
```

## Combining with LINQ Operations

```cpp
List<WString> names = {L"Alice", L"Bob", L"Charlie", L"David"};

// Find names with even indices
auto evenIndexNames = From(indexed(names))
    .Where([](const auto& pair) { return pair.key % 2 == 0; })
    .Select([](const auto& pair) { return pair.value; });
```

## Practical Use Cases

### Finding Elements with Position Information

```cpp
List<WString> items = {L"header", L"content", L"footer", L"content"};

// Find all occurrences of "content" with their positions
for (auto [index, item] : indexed(items))
{
    if (item == L"content")
    {
        Console::WriteLine(L"Found 'content' at position " + itow(index));
    }
}
```

### Building Formatted Output with Line Numbers

```cpp
List<WString> codeLines = {L"#include <iostream>", L"", L"int main() {", L"    return 0;", L"}"};

for (auto [lineNum, code] : indexed(codeLines))
{
    WString lineNumber = itow(lineNum + 1);
    Console::WriteLine(lineNumber + L": " + code);
}
```

## Key Characteristics

- **Converts**: Any `IEnumerable<T>` to `IEnumerable<Pair<vint, T>>`
- **Zero-based**: Index starts from 0
- **Integration**: Works seamlessly with LINQ operations and range-based for loops
- **Use Case**: When you need both position and value during iteration