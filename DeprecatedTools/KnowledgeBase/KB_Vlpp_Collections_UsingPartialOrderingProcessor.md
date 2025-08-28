# Using PartialOrderingProcessor

PartialOrderingProcessor sorts objects with partial ordering relationships using topological sorting with cycle detection.

## When to Use

Use PartialOrderingProcessor when:
- Objects have dependency relationships (A depends on B means B should come before A)
- Not all objects can be compared directly (partial ordering)
- Circular dependencies might exist that need detection and grouping
- You need topological sorting with cycle detection

## Basic Usage

### With Group (Explicit Dependencies)

```cpp
PartialOrderingProcessor pop;

List<WString> items = {L"elephant", L"fish", L"ball", L"cat", L"dog", L"apple"};

// Define dependencies: key depends on value
Group<WString, WString> depGroup;
depGroup.Add(L"ball", L"apple");      // ball depends on apple
depGroup.Add(L"cat", L"ball");        // cat depends on ball
depGroup.Add(L"dog", L"cat");         // dog depends on cat (creates cycle)
depGroup.Add(L"ball", L"dog");        // ball depends on dog

pop.InitWithGroup(items, depGroup);
pop.Sort();
```

### With Function (Computed Dependencies)

```cpp
// Define dependency function: returns true if first depends on second
auto depFunc = [](const WString& a, const WString& b)
{
    return (a == L"ball" && b == L"apple") ||
           (a == L"cat" && b == L"ball");
};

pop.InitWithFunc(items, depFunc);
pop.Sort();
```

## Processing Results

```cpp
// Results are in dependency order
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

## Detecting Circular Dependencies

```cpp
for (auto& component : pop.components)
{
    if (component.nodeCount > 1)
    {
        Console::WriteLine(L"Circular dependency detected!");
        // Handle circular dependency
    }
}
```

## Common Use Cases

### Build System Dependencies
```cpp
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

## Key Characteristics

- **Algorithm**: Uses Kosaraju's Algorithm for strongly connected components
- **Cycle Detection**: Components with multiple nodes indicate circular dependencies
- **One-time Use**: Sort() can only be called once per instance
- **Memory Management**: Automatically manages internal buffers