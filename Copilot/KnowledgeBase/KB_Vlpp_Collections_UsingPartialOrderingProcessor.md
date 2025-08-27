# Using PartialOrderingProcessor

PartialOrderingProcessor is a specialized algorithm for sorting objects that have partial ordering relationships between them. It uses Kosaraju's Algorithm for strongly connected components to identify circular dependencies and group objects into sorted components.

## When to Use PartialOrderingProcessor

Use PartialOrderingProcessor instead of regular sort functions when:
- Objects have dependency relationships (A depends on B means B should come before A)
- Not all objects can be compared directly with each other (partial ordering)
- Circular dependencies might exist that need to be detected and grouped
- You need topological sorting with cycle detection

## Basic Usage with Group

Initialize with a list of objects and a Group containing dependency relationships:

```cpp
PartialOrderingProcessor pop;

// Objects to sort
List<WString> items;
items.Add(L"elephant");
items.Add(L"fish");
items.Add(L"ball");
items.Add(L"cat");
items.Add(L"dog");
items.Add(L"apple");

// Define dependencies: key depends on value
Group<WString, WString> depGroup;
depGroup.Add(L"ball", L"apple");      // ball depends on apple
depGroup.Add(L"cat", L"ball");        // cat depends on ball
depGroup.Add(L"ball", L"dog");        // ball depends on dog
depGroup.Add(L"dog", L"cat");         // dog depends on cat (creates cycle)
depGroup.Add(L"elephant", L"cat");    // elephant depends on cat
depGroup.Add(L"fish", L"dog");        // fish depends on dog

// Initialize and sort
pop.InitWithGroup(items, depGroup);
pop.Sort();

// Process results
for (vint i = 0; i < pop.components.Count(); i++)
{
    auto& component = pop.components[i];
    Console::WriteLine(L"Component " + itow(i) + L":");
    for (vint j = 0; j < component.nodeCount; j++)
    {
        vint nodeIndex = component.firstNode[j];
        Console::WriteLine(L"  " + items[nodeIndex]);
    }
}
```

## Basic Usage with Function

Initialize with a list of objects and a function that defines dependencies:

```cpp
PartialOrderingProcessor pop;

List<WString> items;
items.Add(L"elephant");
items.Add(L"fish");
items.Add(L"ball");
items.Add(L"cat");
items.Add(L"dog");
items.Add(L"apple");

// Define dependency function: returns true if first depends on second
auto depFunc = [](const WString& a, const WString& b)
{
    return
        (a == L"ball" && b == L"apple") ||
        (a == L"cat" && b == L"ball") ||
        (a == L"ball" && b == L"dog") ||
        (a == L"dog" && b == L"cat") ||
        (a == L"elephant" && b == L"cat") ||
        (a == L"fish" && b == L"dog");
};

pop.InitWithFunc(items, depFunc);
pop.Sort();
```

## Advanced Usage with Sub-Classing

Use sub-classing when you want to group objects into classes and sort by class relationships:

```cpp
PartialOrderingProcessor pop;

// Objects with duplicates for each class
List<WString> items;
for (vint i = 1; i <= 2; i++)
{
    items.Add(L"apple_" + itow(i));
    items.Add(L"ball_" + itow(i));
    items.Add(L"cat_" + itow(i));
    items.Add(L"dog_" + itow(i));
    items.Add(L"elephant_" + itow(i));
    items.Add(L"fish_" + itow(i));
}

// Dependencies between individual objects
Group<WString, WString> depGroup;
depGroup.Add(L"ball_2", L"apple_1");  // Cross-class dependency
depGroup.Add(L"cat_2", L"ball_1");
depGroup.Add(L"ball_2", L"dog_1");
depGroup.Add(L"dog_2", L"cat_1");
depGroup.Add(L"elephant_2", L"cat_1");
depGroup.Add(L"fish_2", L"dog_1");

// Group objects into classes
Dictionary<WString, vint> subClass;
for (vint i = 1; i <= 2; i++)
{
    subClass.Add(L"apple_" + itow(i), 1);
    subClass.Add(L"ball_" + itow(i), 2);
    subClass.Add(L"cat_" + itow(i), 3);
    subClass.Add(L"dog_" + itow(i), 4);
    subClass.Add(L"elephant_" + itow(i), 5);
    subClass.Add(L"fish_" + itow(i), 6);
}

pop.InitWithSubClass(items, depGroup, subClass);
pop.Sort();

// Process sub-class results
for (vint i = 0; i < pop.nodes.Count(); i++)
{
    auto& node = pop.nodes[i];
    Console::WriteLine(L"Sub class " + itow(i) + L":");
    
    // Show items in this sub-class
    for (vint j = 0; j < node.subClassItemCount; j++)
    {
        vint itemIndex = node.firstSubClassItem[j];
        Console::WriteLine(L"  " + items[itemIndex]);
    }
}
```

## Understanding Results

After calling `Sort()`, results are available in:

### Components
- `pop.components` contains sorted components in dependency order
- Each component represents a strongly connected group
- Components with single nodes indicate no circular dependencies
- Components with multiple nodes indicate circular dependencies

### Nodes
- `pop.nodes` contains node information for each object (or sub-class)
- Each node contains dependency information
- For sub-class mode, nodes represent sub-classes instead of individual objects

### Component Structure
```cpp
// Access component information
for (auto& component : pop.components)
{
    Console::WriteLine(L"Component size: " + itow(component.nodeCount));
    
    // Access nodes in this component
    for (vint i = 0; i < component.nodeCount; i++)
    {
        vint nodeIndex = component.firstNode[i];
        auto& node = pop.nodes[nodeIndex];
        
        // Check dependencies
        if (node.outs->Count() > 0)
        {
            Console::WriteLine(L"Node has dependencies");
        }
    }
}
```

## Detecting Circular Dependencies

Components with more than one node indicate circular dependencies:

```cpp
for (vint i = 0; i < pop.components.Count(); i++)
{
    auto& component = pop.components[i];
    if (component.nodeCount > 1)
    {
        Console::WriteLine(L"Circular dependency detected in component " + itow(i));
        for (vint j = 0; j < component.nodeCount; j++)
        {
            vint nodeIndex = component.firstNode[j];
            Console::WriteLine(L"  Involved: " + items[nodeIndex]);
        }
    }
}
```

## Best Practices

1. **Call Sort() only once**: The Sort() method can only be called once per instance. Create a new PartialOrderingProcessor for each sorting operation.

2. **Check for cycles**: Always check component sizes to detect circular dependencies in your data.

3. **Use appropriate initialization method**:
   - `InitWithGroup()` for explicit dependency lists
   - `InitWithFunc()` for computed dependencies  
   - `InitWithSubClass()` for grouping and class-level sorting

4. **Handle empty dependencies**: Objects without dependencies will appear in early components.

5. **Memory management**: The processor manages internal buffers automatically, no manual cleanup needed.

## Common Patterns

### Build System Dependencies
```cpp
// Sort source files by include dependencies
List<WString> sourceFiles;
Group<WString, WString> includes; // file -> included file

pop.InitWithGroup(sourceFiles, includes);
pop.Sort();

// Compile in dependency order
for (auto& component : pop.components)
{
    // Files in same component can be compiled in parallel
    for (vint i = 0; i < component.nodeCount; i++)
    {
        vint fileIndex = component.firstNode[i];
        CompileFile(sourceFiles[fileIndex]);
    }
}
```

### Task Scheduling
```cpp
// Sort tasks by prerequisites
List<WString> tasks;
Group<WString, WString> prerequisites; // task -> prerequisite

pop.InitWithGroup(tasks, prerequisites);
pop.Sort();

// Execute tasks in dependency order
for (auto& component : pop.components)
{
    for (vint i = 0; i < component.nodeCount; i++)
    {
        vint taskIndex = component.firstNode[i];
        ExecuteTask(tasks[taskIndex]);
    }
}
```