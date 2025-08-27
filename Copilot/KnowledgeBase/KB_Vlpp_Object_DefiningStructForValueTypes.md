# Defining Struct for Value Types

## Overview

In the Vlpp framework, `struct` is used to define **value types** - objects that are copied by value and do not require heap allocation or reference counting. Value types should be lightweight, immutable or semi-immutable, and typically represent data containers or mathematical concepts.

## When to Use Struct

Use `struct` for:

- **Data containers**: Simple objects that hold related data fields
- **Mathematical types**: Points, vectors, colors, rectangles
- **Configuration objects**: Settings, parameters, options
- **Small immutable objects**: Keys, identifiers, tokens
- **POD (Plain Old Data) types**: C-compatible structures
- **Types without inheritance**: Simple data aggregates

## Basic Struct Definition

### Simple Data Container

```cpp
#include "Vlpp.h"
using namespace vl;

struct Point
{
    vint x;
    vint y;
    
    Point() : x(0), y(0) {}
    Point(vint _x, vint _y) : x(_x), y(_y) {}
};

struct Rectangle
{
    Point topLeft;
    Point bottomRight;
    
    Rectangle() {}
    Rectangle(Point tl, Point br) : topLeft(tl), bottomRight(br) {}
    Rectangle(vint left, vint top, vint right, vint bottom)
        : topLeft(left, top), bottomRight(right, bottom) {}
};
```

### Configuration Struct

```cpp
#include "Vlpp.h"
using namespace vl;

struct FileOptions
{
    bool createIfNotExists;
    bool overwriteExisting;
    bool enableCompression;
    vint bufferSize;
    
    FileOptions()
        : createIfNotExists(false)
        , overwriteExisting(false)
        , enableCompression(false)
        , bufferSize(4096)
    {
    }
    
    static FileOptions Default()
    {
        return FileOptions();
    }
    
    static FileOptions CreateNew()
    {
        FileOptions options;
        options.createIfNotExists = true;
        options.overwriteExisting = true;
        return options;
    }
};
```

## Struct with Member Functions

### Mathematical Operations

```cpp
#include "Vlpp.h"
using namespace vl;

struct Vector2D
{
    double x;
    double y;
    
    Vector2D() : x(0.0), y(0.0) {}
    Vector2D(double _x, double _y) : x(_x), y(_y) {}
    
    // Mathematical operations
    Vector2D operator+(const Vector2D& other) const
    {
        return Vector2D(x + other.x, y + other.y);
    }
    
    Vector2D operator-(const Vector2D& other) const
    {
        return Vector2D(x - other.x, y - other.y);
    }
    
    Vector2D operator*(double scalar) const
    {
        return Vector2D(x * scalar, y * scalar);
    }
    
    double Length() const
    {
        return sqrt(x * x + y * y);
    }
    
    Vector2D Normalize() const
    {
        double len = Length();
        if (len > 0.0)
            return Vector2D(x / len, y / len);
        return Vector2D();
    }
    
    double DotProduct(const Vector2D& other) const
    {
        return x * other.x + y * other.y;
    }
};
```

### String Representation

```cpp
#include "Vlpp.h"
using namespace vl;

struct Color
{
    vuint8_t red;
    vuint8_t green;
    vuint8_t blue;
    vuint8_t alpha;
    
    Color() : red(0), green(0), blue(0), alpha(255) {}
    Color(vuint8_t r, vuint8_t g, vuint8_t b, vuint8_t a = 255)
        : red(r), green(g), blue(b), alpha(a) {}
    
    // Static color constants
    static Color Black() { return Color(0, 0, 0); }
    static Color White() { return Color(255, 255, 255); }
    static Color Red() { return Color(255, 0, 0); }
    static Color Green() { return Color(0, 255, 0); }
    static Color Blue() { return Color(0, 0, 255); }
    
    // String conversion
    WString ToString() const
    {
        return L"RGBA(" + itow(red) + L", " + itow(green) + L", " + itow(blue) + L", " + itow(alpha) + L")";
    }
    
    // Hex representation
    WString ToHex() const
    {
        auto toHex = [](vuint8_t value) {
            WString hex = L"0123456789ABCDEF";
            return WString() + hex[value / 16] + hex[value % 16];
        };
        return L"#" + toHex(red) + toHex(green) + toHex(blue) + toHex(alpha);
    }
    
    // Comparison operators
    bool operator==(const Color& other) const
    {
        return red == other.red && green == other.green && 
               blue == other.blue && alpha == other.alpha;
    }
    
    bool operator!=(const Color& other) const
    {
        return !(*this == other);
    }
};
```

## Collection-Compatible Structs

### Hash and Comparison

```cpp
#include "Vlpp.h"
using namespace vl;

struct Identifier
{
    WString name;
    vint id;
    
    Identifier() : id(-1) {}
    Identifier(const WString& _name, vint _id) : name(_name), id(_id) {}
    
    // Required for Dictionary key usage
    bool operator==(const Identifier& other) const
    {
        return name == other.name && id == other.id;
    }
    
    bool operator!=(const Identifier& other) const
    {
        return !(*this == other);
    }
    
    // Required for SortedList usage
    bool operator<(const Identifier& other) const
    {
        if (name != other.name)
            return name < other.name;
        return id < other.id;
    }
    
    bool operator>(const Identifier& other) const
    {
        return other < *this;
    }
    
    bool operator<=(const Identifier& other) const
    {
        return !(other < *this);
    }
    
    bool operator>=(const Identifier& other) const
    {
        return !(*this < other);
    }
    
    // Hash function for Dictionary
    vint GetHashCode() const
    {
        return name.GetHashCode() ^ id;
    }
};

// Usage in collections
void UseInCollections()
{
    // In Dictionary as key
    Dictionary<Identifier, WString> descriptions;
    descriptions.Add(Identifier(L"user", 123), L"User account");
    descriptions.Add(Identifier(L"admin", 456), L"Administrator account");
    
    // In SortedList
    SortedList<Identifier> sortedIds;
    sortedIds.Add(Identifier(L"beta", 2));
    sortedIds.Add(Identifier(L"alpha", 1));
    sortedIds.Add(Identifier(L"gamma", 3));
}
```

## Struct with Validation

### Self-Validating Struct

```cpp
#include "Vlpp.h"
using namespace vl;

struct EmailAddress
{
    WString address;
    
    EmailAddress() {}
    EmailAddress(const WString& email)
    {
        if (IsValid(email))
        {
            address = email;
        }
        else
        {
            throw ArgumentException(L"Invalid email address: " + email);
        }
    }
    
    static bool IsValid(const WString& email)
    {
        // Simple validation - contains @ and has parts before and after
        vint atPos = email.FindFirst(L"@");
        return atPos > 0 && atPos < email.Length() - 1;
    }
    
    bool IsEmpty() const
    {
        return address.Length() == 0;
    }
    
    WString GetDomain() const
    {
        vint atPos = address.FindFirst(L"@");
        if (atPos >= 0)
            return address.Sub(atPos + 1, address.Length() - atPos - 1);
        return WString::Empty;
    }
    
    WString GetLocalPart() const
    {
        vint atPos = address.FindFirst(L"@");
        if (atPos >= 0)
            return address.Sub(0, atPos);
        return address;
    }
    
    WString ToString() const
    {
        return address;
    }
};
```

## Immutable Struct Pattern

### Copy-On-Modify Pattern

```cpp
#include "Vlpp.h"
using namespace vl;

struct ImmutablePoint
{
    const vint x;
    const vint y;
    
    ImmutablePoint(vint _x = 0, vint _y = 0) : x(_x), y(_y) {}
    
    // Factory methods that return new instances
    ImmutablePoint WithX(vint newX) const
    {
        return ImmutablePoint(newX, y);
    }
    
    ImmutablePoint WithY(vint newY) const
    {
        return ImmutablePoint(x, newY);
    }
    
    ImmutablePoint Offset(vint dx, vint dy) const
    {
        return ImmutablePoint(x + dx, y + dy);
    }
    
    ImmutablePoint Scale(double factor) const
    {
        return ImmutablePoint(
            static_cast<vint>(x * factor),
            static_cast<vint>(y * factor)
        );
    }
    
    double DistanceTo(const ImmutablePoint& other) const
    {
        vint dx = x - other.x;
        vint dy = y - other.y;
        return sqrt(static_cast<double>(dx * dx + dy * dy));
    }
    
    WString ToString() const
    {
        return L"(" + itow(x) + L", " + itow(y) + L")";
    }
};
```

## Advanced Struct Patterns

### Struct with Resource Management

```cpp
#include "Vlpp.h"
using namespace vl;

struct SafeBuffer
{
    vuint8_t* data;
    vint size;
    
    SafeBuffer() : data(nullptr), size(0) {}
    
    SafeBuffer(vint bufferSize) : size(bufferSize)
    {
        CHECK_ERROR(bufferSize > 0, L"Buffer size must be positive");
        data = new vuint8_t[bufferSize];
        memset(data, 0, bufferSize);
    }
    
    // Copy constructor
    SafeBuffer(const SafeBuffer& other) : size(other.size)
    {
        if (other.data && other.size > 0)
        {
            data = new vuint8_t[size];
            memcpy(data, other.data, size);
        }
        else
        {
            data = nullptr;
        }
    }
    
    // Move constructor
    SafeBuffer(SafeBuffer&& other) : data(other.data), size(other.size)
    {
        other.data = nullptr;
        other.size = 0;
    }
    
    // Copy assignment
    SafeBuffer& operator=(const SafeBuffer& other)
    {
        if (this != &other)
        {
            delete[] data;
            size = other.size;
            
            if (other.data && other.size > 0)
            {
                data = new vuint8_t[size];
                memcpy(data, other.data, size);
            }
            else
            {
                data = nullptr;
            }
        }
        return *this;
    }
    
    // Move assignment
    SafeBuffer& operator=(SafeBuffer&& other)
    {
        if (this != &other)
        {
            delete[] data;
            data = other.data;
            size = other.size;
            other.data = nullptr;
            other.size = 0;
        }
        return *this;
    }
    
    ~SafeBuffer()
    {
        delete[] data;
    }
    
    vuint8_t& operator[](vint index)
    {
        CHECK_ERROR(index >= 0 && index < size, L"Buffer index out of bounds");
        return data[index];
    }
    
    const vuint8_t& operator[](vint index) const
    {
        CHECK_ERROR(index >= 0 && index < size, L"Buffer index out of bounds");
        return data[index];
    }
    
    bool IsValid() const
    {
        return data != nullptr && size > 0;
    }
};
```

## Best Practices for Struct

### DO Use Struct For:

- **Simple data holders**: Collections of related fields
- **Value semantics**: Objects that should be copied, not shared
- **Mathematical types**: Points, vectors, matrices, etc.
- **Configuration objects**: Settings and options
- **Small objects**: Typically < 64 bytes total size
- **POD types**: When C compatibility is needed

### DON'T Use Struct For:

- **Complex objects**: Use `class` for objects with complex behavior
- **Objects requiring inheritance**: Use `class` for polymorphic types
- **Large objects**: Use `class` with `Ptr<T>` for large data structures
- **Objects with virtual functions**: Use `class` for virtual inheritance
- **Resource managers**: Use `class` for RAII patterns (unless small like SafeBuffer)

### Design Guidelines

```cpp
// Good: Simple, focused struct
struct Size
{
    vint width;
    vint height;
    
    Size(vint w = 0, vint h = 0) : width(w), height(h) {}
    vint Area() const { return width * height; }
};

// Good: Immutable struct with factory methods
struct DateRange
{
    const DateTime start;
    const DateTime end;
    
    DateRange(DateTime s, DateTime e) : start(s), end(e) {}
    
    bool Contains(DateTime date) const
    {
        return date >= start && date <= end;
    }
    
    DateRange ExtendBy(vint days) const
    {
        return DateRange(start, end.Forward(days));
    }
};

// Avoid: Complex struct that should be a class
struct ComplexProcessor  // Should be a class
{
    // Too many fields, complex behavior
    // Should use class instead
};
```

### Memory Layout Considerations

```cpp
// Good: Efficient memory layout
struct OptimizedStruct
{
    vint64_t bigValue;      // 8 bytes
    vint32_t mediumValue;   // 4 bytes  
    vint16_t smallValue;    // 2 bytes
    bool flag;              // 1 byte + 1 byte padding
    // Total: 16 bytes (properly aligned)
};

// Less efficient: Poor memory layout
struct UnoptimizedStruct
{
    bool flag;              // 1 byte + 7 bytes padding
    vint64_t bigValue;      // 8 bytes
    vint16_t smallValue;    // 2 bytes + 2 bytes padding
    vint32_t mediumValue;   // 4 bytes
    // Total: 24 bytes (wasted padding)
};
```

## Summary

- **Purpose**: Use `struct` for value types that represent data containers
- **Characteristics**: Lightweight, copyable, often immutable
- **Best For**: Mathematical types, configuration objects, simple data holders
- **Avoid**: Complex behavior, inheritance, large objects, resource management
- **Key Principle**: If it's primarily data with simple operations, use `struct`; if it's primarily behavior or needs inheritance, use `class`