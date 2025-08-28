# Using Nullable for Optional Values

`Nullable<T>` is Vlpp's equivalent to `std::optional<T>`, providing a way to represent values that may or may not be present. It adds `nullptr` semantics to any value type `T`.

## Basic Usage

### Creating Nullable Values

```cpp
// Create empty nullable
Nullable<vint> optionalInt;

// Create nullable with value
Nullable<vint> withValue = 42;
Nullable<WString> optionalString = L"Hello";
Nullable<bool> optionalBool(true);
```

### Checking if Nullable Contains a Value

```cpp
Nullable<vint> value = 42;

// Using operator bool
if (value)
{
    Console::WriteLine(L"Value is present");
}

if (!value)
{
    Console::WriteLine(L"Value is empty");
}
```

### Accessing the Value

Use the `Value()` method to access the contained value:

```cpp
Nullable<WString> text = L"Hello, World!";

if (text)
{
    WString content = text.Value();
    Console::WriteLine(L"Text: " + content);
}

// CAUTION: Only call Value() if you're sure it has a value
```

### Resetting to Empty State

```cpp
Nullable<vint> number = 42;
number.Reset();  // Now empty
```

## Common Use Cases

### Optional Function Parameters

```cpp
void ProcessConfiguration(const WString& name, Nullable<vint> timeout = {})
{
    Console::WriteLine(L"Processing: " + name);
    
    if (timeout)
    {
        Console::WriteLine(L"Timeout: " + itow(timeout.Value()) + L" seconds");
    }
    else
    {
        Console::WriteLine(L"No timeout specified");
    }
}

// Usage
ProcessConfiguration(L"Config1");      // No timeout
ProcessConfiguration(L"Config2", 30);  // 30 second timeout
```

### Optional Return Values

```cpp
Nullable<vint> FindIndex(const List<WString>& list, const WString& item)
{
    for (vint i = 0; i < list.Count(); i++)
    {
        if (list[i] == item)
        {
            return i;  // Found - return index
        }
    }
    return {};  // Not found - return empty
}

// Usage
auto index = FindIndex(names, L"Bob");
if (index)
{
    Console::WriteLine(L"Found at index: " + itow(index.Value()));
}
else
{
    Console::WriteLine(L"Not found");
}
```

### Configuration Settings

```cpp
struct AppSettings
{
    WString                 appName;
    Nullable<vint>         windowWidth;
    Nullable<vint>         windowHeight;
    Nullable<bool>         fullscreen;
    Nullable<WString>      theme;
};

void ApplySettings(const AppSettings& settings)
{
    if (settings.windowWidth && settings.windowHeight)
    {
        // Apply window size
    }
    
    if (settings.fullscreen)
    {
        // Apply fullscreen setting
    }
    
    if (settings.theme)
    {
        // Apply theme
    }
}
```

## Comparisons

```cpp
Nullable<vint> a = 10;
Nullable<vint> b = 10;
Nullable<vint> empty;

// Equality comparison
Console::WriteLine(a == b ? L"Equal" : L"Not equal");           // "Equal"
Console::WriteLine(a == empty ? L"Equal" : L"Not equal");       // "Not equal"

// Comparison with raw values
Console::WriteLine(a == 10 ? L"Equal" : L"Not equal");          // "Equal"
```

## Helper Patterns

### Value or Default

```cpp
vint GetConfigValue(Nullable<vint> config, vint defaultValue)
{
    return config ? config.Value() : defaultValue;
}

// Usage
Nullable<vint> userTimeout;  // Empty
vint timeout = GetConfigValue(userTimeout, 30);  // Returns 30
```

### Validation Pattern

```cpp
Nullable<vint> ParseInteger(const WString& text)
{
    try
    {
        vint value = wtoi(text);
        return value;
    }
    catch (...)
    {
        return {};  // Return empty on parse failure
    }
}
```

## Best Practices

1. **Always Check Before Access**: Use `operator bool` before calling `Value()`
   ```cpp
   if (nullable)
   {
       auto value = nullable.Value();  // Safe
   }
   ```

2. **Use Reset() for Clearing**: Clear and explicit
   ```cpp
   nullable.Reset();
   ```

3. **Prefer Return {} for Empty**: Clear intent
   ```cpp
   return {};  // Returning empty
   ```

4. **Document Nullable Parameters**: Make optional parameters clear
   ```cpp
   void ProcessData(const Data& data, Nullable<bool> validate = {});
   ```

## Immutability Note

The `Value()` method returns an immutable value. You cannot modify the contained value directly:

```cpp
Nullable<vint> number = 42;

// This works (assigns new value):
number = number.Value() + 1;  // OK