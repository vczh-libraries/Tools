# Using Nullable for Optional Values

`Nullable<T>` is Vlpp's equivalent to `std::optional<T>`, providing a way to represent values that may or may not be present. It adds `nullptr` semantics to any value type `T`, making it useful for optional parameters, optional return values, and scenarios where a value might be uninitialized.

## Basic Usage

### Creating Nullable Values

```cpp
// Create empty nullable
Nullable<vint> optionalInt;

// Create nullable with value
Nullable<vint> withValue = 42;

// Direct assignment
Nullable<WString> optionalString = L"Hello";

// Using constructor
Nullable<bool> optionalBool(true);
```

### Checking if Nullable Contains a Value

```cpp
Nullable<vint> value = 42;

// Method 1: Using operator bool
if (value)
{
    Console::WriteLine(L"Value is present");
}

// Method 2: Checking against empty state
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

// CAUTION: Calling Value() on empty Nullable is undefined behavior
// Nullable<WString> empty;
// empty.Value();  // DANGEROUS - only call if you're sure it has a value
```

### Resetting to Empty State

Use the `Reset()` method to clear a nullable value:

```cpp
Nullable<vint> number = 42;
Console::WriteLine(number ? L"Has value" : L"Empty");  // "Has value"

number.Reset();
Console::WriteLine(number ? L"Has value" : L"Empty");  // "Empty"
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
ProcessConfiguration(L"Config1");              // No timeout
ProcessConfiguration(L"Config2", 30);          // 30 second timeout
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
List<WString> names;
names.Add(L"Alice");
names.Add(L"Bob");
names.Add(L"Charlie");

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
    Console::WriteLine(L"App: " + settings.appName);
    
    if (settings.windowWidth && settings.windowHeight)
    {
        Console::WriteLine(L"Window size: " + 
                          itow(settings.windowWidth.Value()) + L"x" + 
                          itow(settings.windowHeight.Value()));
    }
    
    if (settings.fullscreen)
    {
        Console::WriteLine(settings.fullscreen.Value() ? L"Fullscreen mode" : L"Windowed mode");
    }
    
    if (settings.theme)
    {
        Console::WriteLine(L"Theme: " + settings.theme.Value());
    }
}
```

### Style Properties (Real-world Example)

From the GacUI codebase, `Nullable<T>` is extensively used for style properties:

```cpp
class DocumentStyleProperties : public Object
{
public:
    Nullable<WString>       face;           // Optional font face
    Nullable<Color>         color;          // Optional text color
    Nullable<bool>          bold;           // Optional bold flag
    Nullable<bool>          italic;         // Optional italic flag
    Nullable<bool>          underline;      // Optional underline flag
};

void ApplyStyle(DocumentStyleProperties& style)
{
    if (style.face)
    {
        SetFont(style.face.Value());
    }
    
    if (style.color)
    {
        SetTextColor(style.color.Value());
    }
    
    if (style.bold)
    {
        SetBold(style.bold.Value());
    }
    
    // etc.
}
```

## Comparisons

`Nullable<T>` supports standard comparison operations:

```cpp
Nullable<vint> a = 10;
Nullable<vint> b = 10;
Nullable<vint> c = 20;
Nullable<vint> empty;

// Equality comparison
Console::WriteLine(a == b ? L"Equal" : L"Not equal");           // "Equal"
Console::WriteLine(a == c ? L"Equal" : L"Not equal");           // "Not equal"
Console::WriteLine(a == empty ? L"Equal" : L"Not equal");       // "Not equal"

// Comparison with raw values
Console::WriteLine(a == 10 ? L"Equal" : L"Not equal");          // "Equal"

// Other comparisons
Console::WriteLine(a < c ? L"Less" : L"Not less");              // "Less"
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

### Chaining Operations

```cpp
Nullable<WString> ProcessText(Nullable<WString> input)
{
    if (!input)
    {
        return {};  // Return empty if input is empty
    }
    
    WString processed = wupper(input.Value());
    return processed.Length() > 0 ? Nullable<WString>(processed) : Nullable<WString>();
}
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

// Usage
auto result = ParseInteger(L"123");
if (result)
{
    Console::WriteLine(L"Parsed: " + itow(result.Value()));
}
else
{
    Console::WriteLine(L"Failed to parse");
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

2. **Use Reset() for Clearing**: Don't rely on assignment patterns
   ```cpp
   nullable.Reset();  // Clear and explicit
   ```

3. **Prefer Return {} for Empty**: More explicit than other empty patterns
   ```cpp
   return {};  // Clear intent - returning empty
   ```

4. **Document Nullable Parameters**: Make it clear when parameters are optional
   ```cpp
   // Process data with optional validation
   void ProcessData(const Data& data, Nullable<bool> validate = {});
   ```

5. **Consider Default Values**: Sometimes defaults are better than nullable
   ```cpp
   // Sometimes this is clearer:
   void SetTimeout(vint timeout = 30);
   
   // Instead of:
   void SetTimeout(Nullable<vint> timeout = {});
   ```

## Immutability Note

The `Value()` method returns an immutable value. You cannot modify the contained value directly, but you can assign a new value to the `Nullable<T>`:

```cpp
Nullable<vint> number = 42;

// This won't work (Value() returns immutable reference):
// number.Value()++;  // ERROR

// This works (assigns new value):
number = number.Value() + 1;  // OK
```

`Nullable<T>` provides a safe, explicit way to handle optional values in Vlpp applications, making code more robust and intentions clearer.