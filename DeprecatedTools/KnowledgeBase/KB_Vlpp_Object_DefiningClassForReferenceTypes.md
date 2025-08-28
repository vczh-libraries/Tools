# Defining Class for Reference Types

## Overview

In the Vlpp framework, `class` is used to define **reference types** - objects that are managed by reference counting and typically allocated on the heap. All reference types must inherit from `Object` or other reference types.

## When to Use Class

Use `class` for:
- **Complex objects**: Objects with significant behavior and state
- **Objects requiring inheritance**: Base classes and derived classes
- **Resource managers**: Objects that manage files, connections, or other resources
- **Large objects**: Objects that are expensive to copy
- **Shared objects**: Objects that need to be shared between multiple owners
- **Objects with virtual functions**: Polymorphic behavior

## Basic Class Definition

```cpp
#include "Vlpp.h"
using namespace vl;

class Counter : public Object
{
private:
    vint value;
    
public:
    Counter() : value(0) {}
    Counter(vint initialValue) : value(initialValue) {}
    
    vint GetValue() const { return value; }
    void SetValue(vint newValue) { value = newValue; }
    void Increment() { value++; }
};

// Usage with Ptr<T>
void UseCounter()
{
    auto counter = Ptr(new Counter(10));
    counter->Increment();
    
    // Share the same counter instance
    auto sharedCounter = counter;
    sharedCounter->Increment(); // Both counters refer to same object
}
```

## Inheritance

```cpp
class Shape : public Object
{
public:
    virtual ~Shape() = default;
    virtual double GetArea() const = 0;
    virtual WString GetDescription() const = 0;
};

class Rectangle : public Shape
{
private:
    double width, height;
    
public:
    Rectangle(double w, double h) : width(w), height(h) {}
    
    double GetArea() const override { return width * height; }
    WString GetDescription() const override 
    { 
        return L"Rectangle " + ftow(width) + L"x" + ftow(height); 
    }
};
```

## Best Practices

### Memory Management
```cpp
// Good: Use Ptr<T> for shared ownership
auto shape = Ptr(new Rectangle(10.0, 20.0));
auto sharedShape = shape; // Safe sharing

// Good: Use raw pointers only for non-owning references
class ShapeContainer : public Object
{
private:
    List<Ptr<Shape>> ownedShapes;
    List<Shape*> references; // Non-owning references
};
```

### Virtual Destructors
```cpp
// Good: Virtual destructor in base class
class Resource : public Object
{
public:
    virtual ~Resource() = default;
    virtual void Cleanup() = 0;
};
```

## Summary

- **Purpose**: Use `class` for reference types with complex behavior and inheritance
- **Inheritance**: All reference types must inherit from `Object`
- **Memory**: Use `Ptr<T>` for shared ownership and automatic memory management
- **Virtual Functions**: Use virtual destructors and methods for polymorphic behavior
- **Key Principle**: If it needs inheritance, complex behavior, or shared ownership, use `class`