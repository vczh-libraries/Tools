# Using Dictionary for Key-Value Mapping

`Dictionary<Key, Value>` is a one-to-one map that maintains all values in the order of keys. It implements `IEnumerable<Pair<K, V>>`.

## Basic Operations

### Creating and Populating

```cpp
Dictionary<WString, vint> scores;

// Add new key-value pairs (crashes if key exists)
scores.Add(L"Alice", 95);
scores.Add(Pair(L"Bob", 87));

// Set key-value pairs (safe, updates existing or adds new)
scores.Set(L"Alice", 100);  // Updates existing
scores.Set(L"Charlie", 92); // Adds new
```

### Accessing Elements

```cpp
// Access by key
vint aliceScore = scores.Get(L"Alice");  // or scores[L"Alice"]

// Get size and collections
vint count = scores.Count();
auto&& keys = scores.Keys();      // Immutable collection of keys
auto&& values = scores.Values();  // Immutable collection of values
```

### Removing Elements

```cpp
scores.Remove(L"Bob");  // Remove specific key
scores.Clear();         // Remove all elements
```

## Iteration

```cpp
// Iterate through key-value pairs
for (auto [name, score] : scores)
{
    // Process each pair
}

// Keys are automatically sorted
for (auto key : scores.Keys())
{
    vint score = scores[key];
    // Process in sorted key order
}
```

## Key Requirements

When using custom types as keys, they must be comparable:

```cpp
struct CustomKey
{
    std::strong_ordering operator<=>(const CustomKey& other) const;
    bool operator==(const CustomKey& other) const;
};
```

## Key Characteristics

- **Ordering**: Automatically maintains sorted order by key
- **Performance**: O(log n) for add/remove/access operations
- **Memory**: Efficient storage for key-value associations
- **Use Case**: When you need fast lookup by key with sorted iteration