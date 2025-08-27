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
    vint bufferSize;
    
    FileOptions()
        : createIfNotExists(false)
        , overwriteExisting(false)
        , bufferSize(4096)
    {
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

## Struct with Operations

```cpp
struct Vector2D
{
    double x, y;
    
    Vector2D() : x(0.0), y(0.0) {}
    Vector2D(double _x, double _y) : x(_x), y(_y) {}
    
    Vector2D operator+(const Vector2D& other) const
    {
        return Vector2D(x + other.x, y + other.y);
    }
    
    double Length() const
    {
        return sqrt(x * x + y * y);
    }
};
```

## Collection-Compatible Structs

```cpp
struct Identifier
{
    WString name;
    vint id;
    
    Identifier(const WString& _name, vint _id) : name(_name), id(_id) {}
    
    // Required for Dictionary key usage
    bool operator==(const Identifier& other) const
    {
        return name == other.name && id == other.id;
    }
    
    // Required for SortedList usage
    bool operator<(const Identifier& other) const
    {
        if (name != other.name)
            return name < other.name;
        return id < other.id;
    }
    
    // Hash function for Dictionary
    vint GetHashCode() const
    {
        return name.GetHashCode() ^ id;
    }
};
```

## Immutable Pattern

```cpp
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
    
    ImmutablePoint Offset(vint dx, vint dy) const
    {
        return ImmutablePoint(x + dx, y + dy);
    }
};
```

## Best Practices

### DO Use Struct For:

- **Simple data holders**: Collections of related fields
- **Value semantics**: Objects that should be copied, not shared
- **Mathematical types**: Points, vectors, matrices, etc.
- **Configuration objects**: Settings and options
- **Small objects**: Typically < 64 bytes total size

### DON'T Use Struct For:

- **Complex objects**: Use `class` for objects with complex behavior
- **Objects requiring inheritance**: Use `class` for polymorphic types
- **Large objects**: Use `class` with `Ptr<T>` for large data structures
- **Objects with virtual functions**: Use `class` for virtual inheritance

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
```

## Summary

- **Purpose**: Use `struct` for value types that represent data containers
- **Characteristics**: Lightweight, copyable, often immutable
- **Best For**: Mathematical types, configuration objects, simple data holders
- **Key Principle**: If it's primarily data with simple operations, use `struct`; if it's primarily behavior or needs inheritance, use `class`