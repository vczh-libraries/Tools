# Using LazyList for LINQ Operations

`LazyList<T>` implements LINQ for C++ just like C#. It provides a functional programming approach to collection manipulation with lazy evaluation, meaning operations are only executed when the results are actually needed.

## Creating LazyList

Use `From(collection)` to create a `LazyList<T>` from any collection objects implementing `IEnumerable<T>`:

```cpp
List<vint> numbers;
numbers.Add(1);
numbers.Add(2);
numbers.Add(3);
numbers.Add(4);
numbers.Add(5);

// Create LazyList from existing collection
auto lazyNumbers = From(numbers);

// LazyList also implements IEnumerable<T>
Array<WString> names(3);
names[0] = L"Alice";
names[1] = L"Bob";
names[2] = L"Charlie";

auto lazyNames = From(names);
```

## Basic LINQ Operations

### Where - Filtering

Filter elements based on a predicate:

```cpp
List<vint> numbers;
for (vint i = 1; i <= 10; i++)
{
    numbers.Add(i);
}

// Get even numbers
auto evenNumbers = From(numbers)
    .Where([](vint x) { return x % 2 == 0; });

// Results in: [2, 4, 6, 8, 10]
for (auto num : evenNumbers)
{
    Console::WriteLine(itow(num));
}
```

### Select - Transformation

Transform each element to a new value:

```cpp
List<vint> numbers;
for (vint i = 1; i <= 5; i++)
{
    numbers.Add(i);
}

// Square each number
auto squaredNumbers = From(numbers)
    .Select([](vint x) { return x * x; });

// Results in: [1, 4, 9, 16, 25]
for (auto num : squaredNumbers)
{
    Console::WriteLine(itow(num));
}

// Transform to strings
auto numberStrings = From(numbers)
    .Select([](vint x) { return L"Number: " + itow(x); });

// Results in: ["Number: 1", "Number: 2", "Number: 3", "Number: 4", "Number: 5"]
```

### Skip and Take

Skip elements from the beginning or take only a certain number:

```cpp
List<vint> numbers;
for (vint i = 1; i <= 10; i++)
{
    numbers.Add(i);
}

// Skip first 3 elements
auto skipped = From(numbers)
    .Skip(3);
// Results in: [4, 5, 6, 7, 8, 9, 10]

// Take first 5 elements
auto taken = From(numbers)
    .Take(5);
// Results in: [1, 2, 3, 4, 5]

// Skip 2, then take 3
auto middleElements = From(numbers)
    .Skip(2)
    .Take(3);
// Results in: [3, 4, 5]
```

### Reverse

Reverse the order of elements:

```cpp
List<WString> names;
names.Add(L"Alice");
names.Add(L"Bob");
names.Add(L"Charlie");

auto reversedNames = From(names)
    .Reverse();
// Results in: ["Charlie", "Bob", "Alice"]
```

## Chaining Operations

LINQ operations can be chained together for complex data processing:

```cpp
List<vint> numbers;
for (vint i = 1; i <= 20; i++)
{
    numbers.Add(i);
}

// Complex chain: skip first 3, take next 10, filter even numbers, square them
auto result = From(numbers)
    .Skip(3)           // Skip 1, 2, 3
    .Take(10)          // Take 4, 5, 6, 7, 8, 9, 10, 11, 12, 13
    .Where([](vint x) { return x % 2 == 0; })  // Filter: 4, 6, 8, 10, 12
    .Select([](vint x) { return x * x; });     // Square: 16, 36, 64, 100, 144

for (auto num : result)
{
    Console::WriteLine(itow(num));
}
```

## Formatting for Readability

When the expression is too long, line breaks are recommended before the `.` character:

```cpp
List<vint> data;
for (vint i = 1; i <= 100; i++)
{
    data.Add(i);
}

auto processedData = From(data)
    .Skip(10)
    .Where([](vint x) { return x % 3 == 0; })
    .Select([](vint x) { return x * 2; })
    .Take(5)
    .Reverse();

// This is much more readable than:
// auto processedData = From(data).Skip(10).Where([](vint x) { return x % 3 == 0; }).Select([](vint x) { return x * 2; }).Take(5).Reverse();
```

## Converting Results

### To Collection Types

```cpp
List<vint> numbers;
for (vint i = 1; i <= 5; i++)
{
    numbers.Add(i);
}

auto evenNumbers = From(numbers)
    .Where([](vint x) { return x % 2 == 0; });

// Convert to List
List<vint> evenList;
for (auto num : evenNumbers)
{
    evenList.Add(num);
}

// Or collect results manually
Array<vint> evenArray(2);  // We know there are 2 even numbers
vint index = 0;
for (auto num : evenNumbers)
{
    evenArray[index++] = num;
}
```

### Direct Iteration

Since `LazyList<T>` implements `IEnumerable<T>`, you can use it directly in range-based for loops:

```cpp
List<WString> words;
words.Add(L"apple");
words.Add(L"banana");
words.Add(L"cherry");
words.Add(L"date");

// Direct iteration without converting to collection
for (auto word : From(words).Where([](const WString& w) { return w.Length() > 5; }))
{
    Console::WriteLine(L"Long word: " + word);
}
```

## Working with Complex Data

### Processing Objects

```cpp
struct Person
{
    WString name;
    vint age;
    WString city;
};

List<Person> people;
people.Add({L"Alice", 25, L"New York"});
people.Add({L"Bob", 30, L"Boston"});
people.Add({L"Charlie", 22, L"Chicago"});
people.Add({L"David", 35, L"Denver"});

// Find adult names from specific cities
auto adultNamesFromBigCities = From(people)
    .Where([](const Person& p) { return p.age >= 25; })
    .Where([](const Person& p) { return p.city == L"New York" || p.city == L"Boston"; })
    .Select([](const Person& p) { return p.name; });

for (auto name : adultNamesFromBigCities)
{
    Console::WriteLine(L"Adult from big city: " + name);
}
```

### Transforming Data Structures

```cpp
Dictionary<WString, vint> scores;
scores.Add(L"Alice", 95);
scores.Add(L"Bob", 87);
scores.Add(L"Charlie", 92);

// Convert to list of formatted strings
auto formattedScores = From(scores)
    .Where([](const Pair<WString, vint>& p) { return p.value >= 90; })
    .Select([](const Pair<WString, vint>& p) { 
        return p.key + L": " + itow(p.value) + L"%"; 
    });

for (auto formatted : formattedScores)
{
    Console::WriteLine(L"High score - " + formatted);
}
```

## Lazy Evaluation Benefits

LazyList uses lazy evaluation, which means:

1. **Performance**: Operations are only executed when results are needed
2. **Memory Efficient**: Intermediate collections are not created
3. **Composable**: Operations can be combined without performance penalty

```cpp
List<vint> largeDataset;
for (vint i = 1; i <= 1000000; i++)
{
    largeDataset.Add(i);
}

// This doesn't immediately process all million numbers
auto expensiveQuery = From(largeDataset)
    .Where([](vint x) { return x % 1000 == 0; })  // Filter to every 1000th number
    .Select([](vint x) { return x * x; });        // Square them

// Only when we iterate do the operations actually execute
vint count = 0;
for (auto result : expensiveQuery)
{
    Console::WriteLine(itow(result));
    if (++count >= 5) break;  // Only process first 5 results
}
// This only processes the first ~5000 numbers instead of all million
```

## Best Practices

1. **Use meaningful lambda parameters**: Make your code self-documenting
   ```cpp
   // Good
   .Where([](const Person& person) { return person.age >= 18; })
   
   // Less clear
   .Where([](auto p) { return p.age >= 18; })
   ```

2. **Break long chains for readability**: Use line breaks before dots
   ```cpp
   auto result = From(collection)
       .Where(condition1)
       .Where(condition2)
       .Select(transformation)
       .Take(limit);
   ```

3. **Combine filters when possible**: Multiple `Where` calls can sometimes be combined
   ```cpp
   // Can be combined
   .Where([](vint x) { return x > 0; })
   .Where([](vint x) { return x < 100; })
   
   // Into single filter
   .Where([](vint x) { return x > 0 && x < 100; })
   ```

4. **Use auto for type inference**: Let the compiler deduce complex lambda types
   ```cpp
   auto processedData = From(collection)
       .Select([](auto item) { /* process item */ return item.value; });
   ```