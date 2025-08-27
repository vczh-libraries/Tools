# Working with Utf and Ansi String Types

The Vlpp library provides a comprehensive string system based on the `ObjectString<T>` template class, with type aliases for different character encodings. The project prefers `wchar_t` and provides immutable string types for various UTF encodings and ANSI.

## Available String Types

### Primary String Types
- **`WString`**: Wide string, alias for `ObjectString<wchar_t>`. This is the preferred string type in the project
- **`AString`**: ASCII/ANSI string, alias for `ObjectString<char>`
- **`U8String`**: UTF-8 string, alias for `ObjectString<char8_t>`
- **`U16String`**: UTF-16 string, alias for `ObjectString<char16_t>`
- **`U32String`**: UTF-32 string, alias for `ObjectString<char32_t>`

### Platform-Specific Behavior
- **Windows**: `wchar_t` is UTF-16 (16-bit)
- **Linux/macOS**: `wchar_t` is UTF-32 (32-bit)

The library automatically handles these differences through compile-time configuration.

## Creating String Instances

### Using String Literals
```cpp
// Preferred approach using WString
WString text = WString::Unmanaged(L"Hello World");

// For other string types
AString ascii = AString::Unmanaged("Hello");
U8String utf8 = U8String::Unmanaged(u8"Hello ??");
U16String utf16 = U16String::Unmanaged(u"Hello ??");
U32String utf32 = U32String::Unmanaged(U"Hello ??");
```

### Copying from C-style Strings
```cpp
// Copy from null-terminated C-style strings
WString text1(L"Hello World");
AString text2("Hello");

// Copy with explicit length
const wchar_t* source = L"Hello World";
WString text3 = WString::CopyFrom(source, wcslen(source));
```

### Taking Ownership of Dynamic Memory
```cpp
// Take ownership of dynamically allocated string
wchar_t* buffer = new wchar_t[100];
wcscpy_s(buffer, 100, L"Hello World");
WString text = WString::TakeOver(buffer, wcslen(buffer));
// buffer is now owned by text, will be automatically deleted
```

## String Characteristics

### Immutability
All `ObjectString<T>` types are immutable. Once created, their content cannot be modified. Any operation that appears to modify a string actually returns a new string instance.

```cpp
WString original = WString::Unmanaged(L"Hello");
WString modified = original + WString::Unmanaged(L" World");
// original still contains "Hello"
// modified contains "Hello World"
```

### Empty String Handling
```cpp
// Check if string is empty
WString text = WString::Unmanaged(L"");
if (text.Length() == 0) { /* empty */ }

// Get empty string
WString empty; // Creates empty string
```

## Common Operations

### String Concatenation
```cpp
WString first = WString::Unmanaged(L"Hello");
WString second = WString::Unmanaged(L" World");
WString result = first + second; // "Hello World"
```

### Accessing String Content
```cpp
WString text = WString::Unmanaged(L"Hello");

// Get length
vint length = text.Length(); // 5

// Get buffer (null-terminated)
const wchar_t* buffer = text.Buffer();

// Access individual characters
wchar_t ch = text[0]; // 'H'
```

### String Comparison
```cpp
WString text1 = WString::Unmanaged(L"Hello");
WString text2 = WString::Unmanaged(L"World");

bool equal = (text1 == text2); // false
auto ordering = text1 <=> text2; // comparison result
```

## Cross-Platform Considerations

The library handles platform differences automatically:
- Use `WString` for general-purpose text handling
- The underlying `wchar_t` encoding (UTF-16 vs UTF-32) is handled transparently
- Conversion functions are available for explicit encoding transformations when needed

## Best Practices

1. **Prefer `WString`** for general-purpose string handling
2. **Use `Unmanaged()` for string literals** to avoid unnecessary copying
3. **Use `CopyFrom()` when working with dynamic C-style strings**
4. **Use `TakeOver()` when transferring ownership of allocated memory**
5. **Remember strings are immutable** - operations return new instances

## Example Usage
```cpp
// Typical string usage pattern
void ProcessText(const WString& input)
{
    if (input.Length() == 0) return;
    
    WString processed = input + WString::Unmanaged(L" [processed]");
    
    // Use the string buffer if needed for C APIs
    const wchar_t* cstr = processed.Buffer();
    
    // String automatically cleans up when going out of scope
}

int main()
{
    WString greeting = WString::Unmanaged(L"Hello");
    WString target = WString::Unmanaged(L"World");
    WString message = greeting + WString::Unmanaged(L", ") + target + WString::Unmanaged(L"!");
    
    ProcessText(message);
    return 0;
}
```