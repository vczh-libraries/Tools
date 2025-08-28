# Working with Object Base Class

## Overview

`Object` is the fundamental base class for all reference types in the Vlpp framework. Every class that represents a reference type must inherit from `Object`, either directly or indirectly. The `Object` class provides essential functionality for memory management, type information, and debugging support.

## Why Object is Required

All reference types must inherit from `Object` because it provides:

- **Virtual destructor**: Enables `Ptr<T>` to work correctly
- **Type safety**: Ensures proper memory management
- **Debugging information**: Provides object lifetime tracking
- **Consistent interface**: Standard methods available on all objects

## Basic Object Inheritance

### Direct Inheritance

```cpp
#include "Vlpp.h"
using namespace vl;

class SimpleCounter : public Object
{
private:
    vint count;
    
public:
    SimpleCounter() : count(0) {}
    SimpleCounter(vint initialCount) : count(initialCount) {}
    
    vint GetCount() const { return count; }
    void Increment() { count++; }
    
    // Override Object's virtual methods if needed
    WString ToString() const override
    {
        return L"SimpleCounter(" + itow(count) + L")";
    }
};

// Usage
void UseSimpleCounter()
{
    auto counter = Ptr(new SimpleCounter(5));
    counter->Increment();
    Console::WriteLine(counter->ToString()); // SimpleCounter(6)
}
```

### Indirect Inheritance Through Other Classes

```cpp
#include "Vlpp.h"
using namespace vl;

// Base class inheriting from Object
class Vehicle : public Object
{
protected:
    WString brand;
    vint year;
    
public:
    Vehicle(const WString& vehicleBrand, vint manufacturingYear)
        : brand(vehicleBrand), year(manufacturingYear) {}
    
    virtual ~Vehicle() = default;
    
    const WString& GetBrand() const { return brand; }
    vint GetYear() const { return year; }
    
    virtual WString GetVehicleType() const = 0;
    
    WString ToString() const override
    {
        return GetVehicleType() + L" - " + brand + L" (" + itow(year) + L")";
    }
};

// Derived class - automatically inherits from Object through Vehicle
class Car : public Vehicle
{
public:
    Car(const WString& brand, vint year)
        : Vehicle(brand, year) {}
    
    WString GetVehicleType() const override { return L"Car"; }
};
```

## Polymorphism with Object

```cpp
class Drawable : public Object
{
public:
    virtual ~Drawable() = default;
    virtual void Draw() const = 0;
    virtual WString GetDrawableType() const = 0;
};

class Circle : public Drawable
{
private:
    double radius;
    
public:
    Circle(double r) : radius(r) {}
    
    void Draw() const override
    {
        Console::WriteLine(L"Drawing circle with radius " + ftow(radius));
    }
    
    WString GetDrawableType() const override { return L"Circle"; }
};

// Function working with any Drawable object
void DrawShape(Ptr<Drawable> shape)
{
    CHECK_ERROR(shape, L"Shape cannot be null");
    shape->Draw(); // Polymorphic dispatch
}
```

## Object Lifetime and Memory Management

```cpp
class FileResource : public Object
{
private:
    WString fileName;
    bool isOpen;
    
public:
    FileResource(const WString& file) : fileName(file), isOpen(false) {}
    
    ~FileResource()
    {
        if (isOpen)
        {
            Close();
        }
    }
    
    bool Open()
    {
        if (!isOpen)
        {
            isOpen = true;
        }
        return isOpen;
    }
    
    void Close()
    {
        if (isOpen)
        {
            isOpen = false;
        }
    }
    
    WString ToString() const override
    {
        return L"FileResource{" + fileName + L", " + (isOpen ? L"open" : L"closed") + L"}";
    }
};
```

## Collections and Objects

```cpp
class TaskManager : public Object
{
private:
    List<Ptr<Task>> tasks;
    
public:
    void AddTask(Ptr<Task> task)
    {
        tasks.Add(task);
    }
    
    Ptr<Task> GetTask(vint index) const
    {
        CHECK_ERROR(index >= 0 && index < tasks.Count(), L"Task index out of range");
        return tasks[index];
    }
    
    vint GetTaskCount() const { return tasks.Count(); }
};
```

## Best Practices for Object

### DO:

- **Always inherit from Object** for reference types
- **Use virtual destructors** when creating base classes
- **Override ToString()** for meaningful string representation
- **Use Ptr<T>** for object ownership and sharing
- **Design for polymorphism** when appropriate

### DON'T:

- **Use raw pointers** for object ownership
- **Forget virtual destructors** in base classes
- **Mix value and reference semantics** inappropriately
- **Create unnecessary inheritance hierarchies**

### Design Guidelines

```cpp
// Good: Clean Object inheritance
class Service : public Object
{
public:
    virtual ~Service() = default;
    virtual void Start() = 0;
    virtual void Stop() = 0;
    virtual bool IsRunning() const = 0;
};

// Good: Proper use of virtual methods
class NetworkService : public Service
{
private:
    bool running;
    
public:
    NetworkService() : running(false) {}
    
    void Start() override { running = true; }
    void Stop() override { running = false; }
    bool IsRunning() const override { return running; }
    
    WString ToString() const override
    {
        return L"NetworkService(" + (running ? L"running" : L"stopped") + L")";
    }
};
```

## Summary

- **Purpose**: `Object` is the base class for all reference types in Vlpp
- **Requirement**: All classes must inherit from `Object` directly or indirectly
- **Benefits**: Provides reference counting, type safety, and debugging support
- **Usage**: Use `Ptr<T>` for automatic memory management of Object-derived classes
- **Override**: Implement `ToString()` for meaningful string representation
- **Virtual Methods**: Use virtual destructors and methods for polymorphic behavior