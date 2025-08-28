# Using Group for One-to-Many Mapping

`Group<Key, Value>` is a one-to-many map that maintains all values in the order of keys. It implements `IEnumerable<Pair<K, V>>` and allows multiple values to be associated with a single key.

## Basic Operations

### Creating and Adding Elements

```cpp
Group<WString, WString> categoryItems;

// Add multiple values to the same key
categoryItems.Add(L"Fruits", L"Apple");
categoryItems.Add(L"Fruits", L"Banana");
categoryItems.Add(L"Vegetables", L"Carrot");

// Using Pair
categoryItems.Add(Pair(L"Meat", L"Chicken"));
```

### Accessing Elements

```cpp
// Get all values for a key
auto&& fruits = categoryItems.Get(L"Fruits");     // or categoryItems[L"Fruits"]
auto&& vegetables = categoryItems.GetByIndex(0);  // Values for first key

// Get metadata
vint keyCount = categoryItems.Count();            // Number of keys (not total values)
auto&& keys = categoryItems.Keys();               // All keys in sorted order
```

### Checking Existence

```cpp
// Check if key exists
bool hasFruits = categoryItems.Contains(L"Fruits");

// Check if specific key-value pair exists
bool hasApple = categoryItems.Contains(L"Fruits", L"Apple");
```

### Removing Elements

```cpp
categoryItems.Remove(L"Fruits", L"Apple");  // Remove specific value from key
categoryItems.Remove(L"Fruits");            // Remove all values for key
categoryItems.Clear();                      // Remove everything
```

## Iteration

```cpp
// Iterate through all key-value pairs
for (auto [category, item] : categoryItems)
{
    Console::WriteLine(L"Category: " + category + L", Item: " + item);
}

// Iterate by groups
for (auto key : categoryItems.Keys())
{
    Console::WriteLine(L"Category: " + key);
    for (auto item : categoryItems[key])
    {
        Console::WriteLine(L"  - " + item);
    }
}
```

## Key Characteristics

- **Ordering**: Keys are automatically maintained in sorted order
- **One-to-Many**: Multiple values can be associated with the same key
- **Performance**: O(log n) for key operations, O(k) for value operations where k is values per key
- **Use Case**: When you need to group multiple items under categories or classifications

## Example: Event Scheduling

```cpp
Group<WString, WString> dayEvents;

dayEvents.Add(L"Monday", L"Team Meeting");
dayEvents.Add(L"Monday", L"Project Review");
dayEvents.Add(L"Tuesday", L"Client Call");

// Check events for a specific day
if (dayEvents.Contains(L"Monday"))
{
    for (auto event : dayEvents[L"Monday"])
    {
        Console::WriteLine(L"- " + event);
    }
}
```