# Using Group for One-to-Many Mapping

`Group<Key, Value>` is a one-to-many map that maintains all values in the order of keys. It implements `IEnumerable<Pair<K, V>>` and allows multiple values to be associated with a single key.

## Basic Operations

### Creating a Group

```cpp
// Create an empty group mapping categories to items
Group<WString, WString> categoryItems;

// Group maintains keys in sorted order
Group<vint, WString> priorityTasks;
```

### Adding Elements

Use `Add(key, value)` or `Add(pair)` to assign one more value with a key:

```cpp
Group<WString, WString> categoryItems;

// Add multiple values to the same key
categoryItems.Add(L"Fruits", L"Apple");
categoryItems.Add(L"Fruits", L"Banana");
categoryItems.Add(L"Fruits", L"Orange");

categoryItems.Add(L"Vegetables", L"Carrot");
categoryItems.Add(L"Vegetables", L"Broccoli");

// Using Pair
categoryItems.Add(Pair(L"Meat", L"Chicken"));
categoryItems.Add(Pair(L"Meat", L"Beef"));
```

### Accessing Elements

Use `Get(key)` or `[key]` to access all values by their key:

```cpp
Group<WString, WString> categoryItems;
categoryItems.Add(L"Fruits", L"Apple");
categoryItems.Add(L"Fruits", L"Banana");
categoryItems.Add(L"Vegetables", L"Carrot");

// Get all values for a key - returns a collection
auto&& fruits = categoryItems.Get(L"Fruits");     // ["Apple", "Banana"]
auto&& vegetables = categoryItems[L"Vegetables"]; // ["Carrot"]

// Iterate through values for a specific key
for (auto fruit : fruits)
{
    Console::WriteLine(L"Fruit: " + fruit);
}
```

### Accessing by Index

Use `GetByIndex(index)` to get all values for the key at a specific index position:

```cpp
Group<WString, WString> categoryItems;
categoryItems.Add(L"Fruits", L"Apple");
categoryItems.Add(L"Fruits", L"Banana");
categoryItems.Add(L"Vegetables", L"Carrot");

// Get keys (sorted order)
auto&& keys = categoryItems.Keys();  // ["Fruits", "Vegetables"]

// GetByIndex equivalents to Get(Keys()[index])
auto&& firstGroupItems = categoryItems.GetByIndex(0);   // Same as categoryItems.Get(L"Fruits")
auto&& secondGroupItems = categoryItems.GetByIndex(1);  // Same as categoryItems.Get(L"Vegetables")
```

### Size and Contents

```cpp
Group<WString, WString> categoryItems;
categoryItems.Add(L"Fruits", L"Apple");
categoryItems.Add(L"Fruits", L"Banana");
categoryItems.Add(L"Vegetables", L"Carrot");

// Get the number of keys (not total values)
vint keyCount = categoryItems.Count();  // Returns 2 (Fruits, Vegetables)

// Get all keys (in sorted order)
auto&& keys = categoryItems.Keys();       // ["Fruits", "Vegetables"]
```

### Checking Existence

Use `Contains(key)` to determine if there is any value assigned with the key:

```cpp
Group<WString, WString> categoryItems;
categoryItems.Add(L"Fruits", L"Apple");

// Check if key exists
bool hasFruits = categoryItems.Contains(L"Fruits");      // true
bool hasMeat = categoryItems.Contains(L"Meat");          // false
```

Use `Contains(key, value)` to determine if the specific value is assigned with the key:

```cpp
Group<WString, WString> categoryItems;
categoryItems.Add(L"Fruits", L"Apple");
categoryItems.Add(L"Fruits", L"Banana");

// Check if specific key-value pair exists
bool hasApple = categoryItems.Contains(L"Fruits", L"Apple");    // true
bool hasOrange = categoryItems.Contains(L"Fruits", L"Orange");  // false
bool hasMeatApple = categoryItems.Contains(L"Meat", L"Apple");  // false
```

### Removing Elements

```cpp
Group<WString, WString> categoryItems;
categoryItems.Add(L"Fruits", L"Apple");
categoryItems.Add(L"Fruits", L"Banana");
categoryItems.Add(L"Vegetables", L"Carrot");

// Remove specific value with a key
categoryItems.Remove(L"Fruits", L"Apple");    // Only removes Apple from Fruits

// Remove all values with a key
categoryItems.Remove(L"Fruits");              // Removes all fruits

// Remove all elements
categoryItems.Clear();                        // Group becomes empty
```

## Iterating Through Group

Since `Group<K, V>` implements `IEnumerable<Pair<K, V>>`, you can iterate through all key-value pairs:

```cpp
Group<WString, WString> categoryItems;
categoryItems.Add(L"Fruits", L"Apple");
categoryItems.Add(L"Fruits", L"Banana");
categoryItems.Add(L"Vegetables", L"Carrot");
categoryItems.Add(L"Vegetables", L"Broccoli");

// Iterate through all key-value pairs
for (auto pair : categoryItems)
{
    Console::WriteLine(L"Category: " + pair.key + L", Item: " + pair.value);
}
// Output:
// Category: Fruits, Item: Apple
// Category: Fruits, Item: Banana
// Category: Vegetables, Item: Carrot
// Category: Vegetables, Item: Broccoli

// Using structured binding (C++17)
for (auto [category, item] : categoryItems)
{
    Console::WriteLine(L"Category: " + category + L", Item: " + item);
}
```

### Iterating by Groups

```cpp
Group<WString, WString> categoryItems;
categoryItems.Add(L"Fruits", L"Apple");
categoryItems.Add(L"Fruits", L"Banana");
categoryItems.Add(L"Vegetables", L"Carrot");

// Iterate through each key and its values
for (auto [key, index] : categoryItems.Keys())
{
    Console::WriteLine(L"Category: " + key);
    auto&& items = categoryItems.GetByIndex(index);
    for (auto item : items)
    {
        Console::WriteLine(L"  - " + item);
    }
}
// Output:
// Category: Fruits
//   - Apple
//   - Banana
// Category: Vegetables
//   - Carrot
```

## Key Ordering

The Group automatically keeps all keys in sorted order:

```cpp
Group<vint, WString> priorityTasks;

// Add in random order
priorityTasks.Add(3, L"Low priority task");
priorityTasks.Add(1, L"High priority task 1");
priorityTasks.Add(1, L"High priority task 2");
priorityTasks.Add(2, L"Medium priority task");

// Keys will be ordered: [1, 2, 3]
for (auto key : priorityTasks.Keys())
{
    Console::WriteLine(L"Priority " + itow(key) + L":");
    for (auto task : priorityTasks[key])
    {
        Console::WriteLine(L"  - " + task);
    }
}
// Output:
// Priority 1:
//   - High priority task 1
//   - High priority task 2
// Priority 2:
//   - Medium priority task
// Priority 3:
//   - Low priority task
```

## Practical Examples

### Grouping Students by Grade

```cpp
Group<WString, WString> gradeStudents;

gradeStudents.Add(L"A", L"Alice");
gradeStudents.Add(L"A", L"Bob");
gradeStudents.Add(L"B", L"Charlie");
gradeStudents.Add(L"A", L"David");
gradeStudents.Add(L"C", L"Eve");

// Display honor roll (A grade students)
if (gradeStudents.Contains(L"A"))
{
    Console::WriteLine(L"Honor Roll Students:");
    for (auto student : gradeStudents[L"A"])
    {
        Console::WriteLine(L"- " + student);
    }
}
```

### Event Scheduling

```cpp
Group<WString, WString> dayEvents;

dayEvents.Add(L"Monday", L"Team Meeting");
dayEvents.Add(L"Monday", L"Project Review");
dayEvents.Add(L"Tuesday", L"Client Call");
dayEvents.Add(L"Wednesday", L"Development Sprint");
dayEvents.Add(L"Wednesday", L"Code Review");

// Check if there are events on a specific day
if (dayEvents.Contains(L"Monday"))
{
    Console::WriteLine(L"Monday Events:");
    for (auto event : dayEvents[L"Monday"])
    {
        Console::WriteLine(L"- " + event);
    }
}
```

## Best Practices

1. **Use meaningful key types**: Choose key types that naturally represent categories or groupings.

2. **Check existence before access**: Always check if a key exists before accessing its values to avoid errors.
   ```cpp
   if (group.Contains(targetKey))
   {
       auto values = group[targetKey];
       // Process values safely
   }
   ```

3. **Leverage key ordering**: Since Group maintains sorted key order, you can rely on this for consistent iteration.

4. **Consider Dictionary vs Group**: Use `Dictionary<K, V>` for one-to-one mappings and `Group<K, V>` for one-to-many mappings.

5. **Use structured binding**: When available, structured binding makes iteration more readable:
   ```cpp
   for (auto [key, value] : group)
   {
       // Process each key-value pair
   }
   ```