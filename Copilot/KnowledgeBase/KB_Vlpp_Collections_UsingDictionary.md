# Using Dictionary for Key-Value Mapping

`Dictionary<Key, Value>` is a one-to-one map that maintains all values in the order of keys. It implements `IEnumerable<Pair<K, V>>`.

## Basic Operations

### Creating a Dictionary

```cpp
// Create an empty dictionary mapping strings to integers
Dictionary<WString, vint> dict;

// Dictionary sorts keys automatically and maintains that order
Dictionary<vint, WString> idToName;
```

### Adding Elements

Use `Add(key, value)` or `Add(pair)` to assign a value with a key. Note that it crashes if the key already exists:

```cpp
Dictionary<WString, vint> scores;

// Method 1: Add key-value pair directly
scores.Add(L"Alice", 95);
scores.Add(L"Bob", 87);

// Method 2: Add using Pair
scores.Add(Pair(L"Charlie", 92));

// This would crash because "Alice" already exists
// scores.Add(L"Alice", 100); // Don't do this!
```

### Setting Elements

Use `Set(key, value)` or `Set(pair)` to assign a value with a key. This overrides the old value if the key exists:

```cpp
Dictionary<WString, vint> scores;
scores.Add(L"Alice", 95);

// Safe to use Set - it will update existing value
scores.Set(L"Alice", 100);  // Updates Alice's score to 100
scores.Set(L"David", 88);   // Adds David with score 88
```

### Accessing Elements

Use `Get(key)` or `[key]` to access a value by its key:

```cpp
Dictionary<WString, vint> scores;
scores.Add(L"Alice", 95);
scores.Add(L"Bob", 87);

// Method 1: Using Get()
vint aliceScore = scores.Get(L"Alice");  // Returns 95

// Method 2: Using [] operator
vint bobScore = scores[L"Bob"];          // Returns 87

// Note: Accessing non-existent key will throw an error
// vint unknownScore = scores[L"Unknown"];  // This will crash!
```

### Size and Contents

```cpp
Dictionary<WString, vint> scores;
scores.Add(L"Alice", 95);
scores.Add(L"Bob", 87);
scores.Add(L"Charlie", 92);

// Get the number of key-value pairs
vint count = scores.Count();  // Returns 3

// Get all keys (in sorted order)
auto&& keys = scores.Keys();    // Returns immutable collection: ["Alice", "Bob", "Charlie"]

// Get all values (in the order of keys)
auto&& values = scores.Values(); // Returns immutable collection: [95, 87, 92]
```

### Removing Elements

```cpp
Dictionary<WString, vint> scores;
scores.Add(L"Alice", 95);
scores.Add(L"Bob", 87);
scores.Add(L"Charlie", 92);

// Remove a specific key-value pair
scores.Remove(L"Bob");      // Removes Bob's entry

// Remove all elements
scores.Clear();             // Dictionary becomes empty
```

## Iterating Through Dictionary

Since `Dictionary<K, V>` implements `IEnumerable<Pair<K, V>>`, you can iterate through it:

```cpp
Dictionary<WString, vint> scores;
scores.Add(L"Alice", 95);
scores.Add(L"Bob", 87);
scores.Add(L"Charlie", 92);

// Iterate through key-value pairs
for (auto pair : scores)
{
    Console::WriteLine(L"Student: " + pair.key + L", Score: " + itow(pair.value));
}

// Using structured binding (C++17)
for (auto [name, score] : scores)
{
    Console::WriteLine(L"Student: " + name + L", Score: " + itow(score));
}

// Iterate through keys only
for (auto key : scores.Keys())
{
    vint score = scores[key];
    Console::WriteLine(L"Student: " + key + L", Score: " + itow(score));
}
```

## Key Ordering

The Dictionary automatically keeps all values in the order of keys:

```cpp
Dictionary<vint, WString> idToName;

// Add in random order
idToName.Add(30, L"Charlie");
idToName.Add(10, L"Alice");
idToName.Add(20, L"Bob");

// Keys will be ordered: [10, 20, 30]
// Values will be ordered: ["Alice", "Bob", "Charlie"]

for (auto [id, name] : idToName)
{
    // Will print in key order: 10->Alice, 20->Bob, 30->Charlie
    Console::WriteLine(itow(id) + L" -> " + name);
}
```

## Working with Complex Keys

When using custom types as keys, ensure they are comparable:

```cpp
struct Student
{
    WString name;
    vint id;
    
    // Comparison operator for Dictionary ordering
    std::strong_ordering operator<=>(const Student& other) const
    {
        auto cmp = id <=> other.id;
        if (cmp == std::strong_ordering::equal)
            return name <=> other.name;
        return cmp;
    }
    
    bool operator==(const Student& other) const
    {
        return id == other.id && name == other.name;
    }
};

Dictionary<Student, vint> studentScores;
studentScores.Add({L"Alice", 1001}, 95);
studentScores.Add({L"Bob", 1002}, 87);
```

## Best Practices

1. **Use `Set()` when unsure**: If you're not sure whether a key exists, use `Set()` instead of `Add()` to avoid crashes.

2. **Check existence before accessing**: If accessing potentially non-existent keys, consider checking first:
   ```cpp
   // Safe access pattern
   auto keys = dict.Keys();
   if (keys.Contains(targetKey))
   {
       auto value = dict[targetKey];
       // Use value safely
   }
   ```

3. **Leverage key ordering**: Since Dictionary maintains sorted order, you can rely on this for consistent iteration.

4. **Use structured binding**: When available, structured binding makes iteration more readable:
   ```cpp
   for (auto [key, value] : dictionary)
   {
       // Process key and value
   }
   ```