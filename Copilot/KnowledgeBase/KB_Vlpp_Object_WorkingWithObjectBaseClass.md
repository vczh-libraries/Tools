# Working with Object Base Class

## Overview

`Object` is the fundamental base class for all reference types in the Vlpp framework. Every class that represents a reference type must inherit from `Object`, either directly or indirectly. The `Object` class provides essential functionality for memory management, type information, and debugging support.

## Why Object is Required

All reference types must inherit from `Object` because it provides:

- **Reference counting support**: Enables `Ptr<T>` to work correctly
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
    void Reset() { count = 0; }
    
    // Override Object's virtual methods if needed
    WString ToString() const
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
    virtual double GetMaxSpeed() const = 0;
    
    WString ToString() const override
    {
        return GetVehicleType() + L" - " + brand + L" (" + itow(year) + L")";
    }
};

// Derived class - automatically inherits from Object through Vehicle
class Car : public Vehicle
{
private:
    vint numberOfDoors;
    
public:
    Car(const WString& brand, vint year, vint doors)
        : Vehicle(brand, year), numberOfDoors(doors) {}
    
    WString GetVehicleType() const override { return L"Car"; }
    double GetMaxSpeed() const override { return 200.0; }
    
    vint GetNumberOfDoors() const { return numberOfDoors; }
};

// Further derived class - still inherits from Object
class SportsCar : public Car
{
private:
    bool hasTurbo;
    
public:
    SportsCar(const WString& brand, vint year, bool turbo)
        : Car(brand, year, 2), hasTurbo(turbo) {}
    
    double GetMaxSpeed() const override { return 300.0; }
    bool HasTurbo() const { return hasTurbo; }
    
    WString ToString() const override
    {
        return L"Sports " + Car::ToString() + (hasTurbo ? L" (Turbo)" : L"");
    }
};
```

## Object Methods and Functionality

### Virtual Methods You Can Override

```cpp
#include "Vlpp.h"
using namespace vl;

class CustomObject : public Object
{
private:
    WString name;
    vint id;
    
public:
    CustomObject(const WString& objectName, vint objectId)
        : name(objectName), id(objectId) {}
    
    // Override ToString for meaningful string representation
    WString ToString() const override
    {
        return L"CustomObject{name=" + name + L", id=" + itow(id) + L"}";
    }
    
    const WString& GetName() const { return name; }
    vint GetId() const { return id; }
    
    void SetName(const WString& newName) { name = newName; }
};

// Usage demonstrating Object functionality
void DemonstrateObjectMethods()
{
    auto obj = Ptr(new CustomObject(L"TestObject", 123));
    
    // ToString() - overridden method
    Console::WriteLine(obj->ToString());
    
    // Reference counting is handled automatically by Ptr<T>
    auto sharedObj = obj; // Reference count increases
    
    // Objects are automatically destroyed when last Ptr<T> goes out of scope
}
```

## Working with Object Collections

### Storing Objects in Collections

```cpp
#include "Vlpp.h"
using namespace vl;

class Task : public Object
{
private:
    WString description;
    bool completed;
    DateTime createdTime;
    
public:
    Task(const WString& desc) 
        : description(desc), completed(false), createdTime(DateTime::LocalTime()) {}
    
    const WString& GetDescription() const { return description; }
    bool IsCompleted() const { return completed; }
    const DateTime& GetCreatedTime() const { return createdTime; }
    
    void Complete() { completed = true; }
    
    WString ToString() const override
    {
        return (completed ? L"[DONE] " : L"[TODO] ") + description;
    }
};

class TaskManager : public Object
{
private:
    List<Ptr<Task>> tasks;
    
public:
    void AddTask(const WString& description)
    {
        auto task = Ptr(new Task(description));
        tasks.Add(task);
    }
    
    void CompleteTask(vint index)
    {
        CHECK_ERROR(index >= 0 && index < tasks.Count(), L"Task index out of range");
        tasks[index]->Complete();
    }
    
    Ptr<Task> GetTask(vint index) const
    {
        CHECK_ERROR(index >= 0 && index < tasks.Count(), L"Task index out of range");
        return tasks[index];
    }
    
    vint GetTaskCount() const { return tasks.Count(); }
    
    List<Ptr<Task>> GetIncompleteTasks() const
    {
        List<Ptr<Task>> incomplete;
        for (vint i = 0; i < tasks.Count(); i++)
        {
            if (!tasks[i]->IsCompleted())
            {
                incomplete.Add(tasks[i]);
            }
        }
        return incomplete;
    }
    
    WString ToString() const override
    {
        WString result = L"TaskManager with " + itow(tasks.Count()) + L" tasks:\n";
        for (vint i = 0; i < tasks.Count(); i++)
        {
            result += L"  " + itow(i) + L". " + tasks[i]->ToString() + L"\n";
        }
        return result;
    }
};
```

## Polymorphism with Object

### Virtual Method Dispatch

```cpp
#include "Vlpp.h"
using namespace vl;

class Drawable : public Object
{
public:
    virtual ~Drawable() = default;
    virtual void Draw() const = 0;
    virtual WString GetDrawableType() const = 0;
    
    // Non-virtual method using virtual methods
    void DrawWithLabel() const
    {
        Console::WriteLine(L"Drawing " + GetDrawableType() + L":");
        Draw();
        Console::WriteLine(L"Finished drawing " + GetDrawableType());
    }
};

class Circle : public Drawable
{
private:
    double radius;
    
public:
    Circle(double r) : radius(r) {}
    
    void Draw() const override
    {
        Console::WriteLine(L"  Drawing circle with radius " + ftow(radius));
    }
    
    WString GetDrawableType() const override
    {
        return L"Circle";
    }
    
    double GetRadius() const { return radius; }
};

class Rectangle : public Drawable
{
private:
    double width, height;
    
public:
    Rectangle(double w, double h) : width(w), height(h) {}
    
    void Draw() const override
    {
        Console::WriteLine(L"  Drawing rectangle " + ftow(width) + L"x" + ftow(height));
    }
    
    WString GetDrawableType() const override
    {
        return L"Rectangle";
    }
    
    double GetWidth() const { return width; }
    double GetHeight() const { return height; }
};

// Function working with any Drawable object
void DrawShape(Ptr<Drawable> shape)
{
    CHECK_ERROR(shape, L"Shape cannot be null");
    shape->DrawWithLabel(); // Polymorphic dispatch
}

void DemonstratePolymorphism()
{
    List<Ptr<Drawable>> shapes;
    shapes.Add(Ptr(new Circle(5.0)));
    shapes.Add(Ptr(new Rectangle(10.0, 20.0)));
    shapes.Add(Ptr(new Circle(3.0)));
    
    // Draw all shapes polymorphically
    for (vint i = 0; i < shapes.Count(); i++)
    {
        DrawShape(shapes[i]);
    }
}
```

## Object Lifetime and Memory Management

### RAII Pattern with Object

```cpp
#include "Vlpp.h"
using namespace vl;

class FileResource : public Object
{
private:
    WString fileName;
    bool isOpen;
    
public:
    FileResource(const WString& file) : fileName(file), isOpen(false)
    {
        Console::WriteLine(L"Creating FileResource for: " + fileName);
    }
    
    ~FileResource()
    {
        Console::WriteLine(L"Destroying FileResource for: " + fileName);
        if (isOpen)
        {
            Close();
        }
    }
    
    bool Open()
    {
        if (!isOpen)
        {
            Console::WriteLine(L"Opening file: " + fileName);
            isOpen = true;
        }
        return isOpen;
    }
    
    void Close()
    {
        if (isOpen)
        {
            Console::WriteLine(L"Closing file: " + fileName);
            isOpen = false;
        }
    }
    
    bool IsOpen() const { return isOpen; }
    
    WString ToString() const override
    {
        return L"FileResource{" + fileName + L", " + (isOpen ? L"open" : L"closed") + L"}";
    }
};

void DemonstrateLifetime()
{
    Console::WriteLine(L"Creating file resource...");
    {
        auto file = Ptr(new FileResource(L"test.txt"));
        file->Open();
        
        // Create a shared reference
        auto sharedFile = file;
        Console::WriteLine(L"File is shared: " + file->ToString());
        
        // First Ptr goes out of scope here, but object remains alive
    }
    Console::WriteLine(L"First scope ended, but file may still be alive");
    
    // Object is destroyed when last Ptr (sharedFile) goes out of scope
    Console::WriteLine(L"Function ending - all resources cleaned up");
}
```

## Object Factory Patterns

### Abstract Factory with Object

```cpp
#include "Vlpp.h"
using namespace vl;

class Logger : public Object
{
public:
    virtual ~Logger() = default;
    virtual void Log(const WString& message) = 0;
    virtual WString GetLoggerType() const = 0;
};

class ConsoleLogger : public Logger
{
public:
    void Log(const WString& message) override
    {
        Console::WriteLine(L"[CONSOLE] " + message);
    }
    
    WString GetLoggerType() const override
    {
        return L"Console Logger";
    }
};

class FileLogger : public Logger
{
private:
    WString fileName;
    
public:
    FileLogger(const WString& file) : fileName(file) {}
    
    void Log(const WString& message) override
    {
        Console::WriteLine(L"[FILE:" + fileName + L"] " + message);
    }
    
    WString GetLoggerType() const override
    {
        return L"File Logger (" + fileName + L")";
    }
};

class LoggerFactory : public Object
{
public:
    enum class LoggerType
    {
        Console,
        File
    };
    
    static Ptr<Logger> CreateLogger(LoggerType type, const WString& parameter = WString::Empty)
    {
        switch (type)
        {
        case LoggerType::Console:
            return Ptr(new ConsoleLogger());
        case LoggerType::File:
            CHECK_ERROR(parameter.Length() > 0, L"File name required for file logger");
            return Ptr(new FileLogger(parameter));
        default:
            CHECK_FAIL(L"Unknown logger type");
        }
    }
};

void DemonstrateFactory()
{
    // Create different logger types
    auto consoleLogger = LoggerFactory::CreateLogger(LoggerFactory::LoggerType::Console);
    auto fileLogger = LoggerFactory::CreateLogger(LoggerFactory::LoggerType::File, L"app.log");
    
    // Use polymorphically
    List<Ptr<Logger>> loggers;
    loggers.Add(consoleLogger);
    loggers.Add(fileLogger);
    
    for (vint i = 0; i < loggers.Count(); i++)
    {
        loggers[i]->Log(L"Test message " + itow(i + 1));
    }
}
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
    
    void Start() override
    {
        if (!running)
        {
            running = true;
            Console::WriteLine(L"Network service started");
        }
    }
    
    void Stop() override
    {
        if (running)
        {
            running = false;
            Console::WriteLine(L"Network service stopped");
        }
    }
    
    bool IsRunning() const override { return running; }
    
    WString ToString() const override
    {
        return L"NetworkService(" + (running ? L"running" : L"stopped") + L")";
    }
};

// Usage with proper memory management
void UseServices()
{
    List<Ptr<Service>> services;
    services.Add(Ptr(new NetworkService()));
    
    // Start all services
    for (auto service : services)
    {
        service->Start();
    }
    
    // Services automatically cleaned up when Ptr goes out of scope
}
```

## Common Patterns

### Singleton Pattern with Object

```cpp
#include "Vlpp.h"
using namespace vl;

class ApplicationSettings : public Object
{
private:
    static Ptr<ApplicationSettings> instance;
    Dictionary<WString, WString> settings;
    
    ApplicationSettings() {} // Private constructor
    
public:
    static Ptr<ApplicationSettings> GetInstance()
    {
        if (!instance)
        {
            instance = Ptr(new ApplicationSettings());
        }
        return instance;
    }
    
    void SetSetting(const WString& key, const WString& value)
    {
        settings.Set(key, value);
    }
    
    WString GetSetting(const WString& key, const WString& defaultValue = WString::Empty) const
    {
        if (settings.Keys().Contains(key))
            return settings[key];
        return defaultValue;
    }
    
    WString ToString() const override
    {
        return L"ApplicationSettings with " + itow(settings.Count()) + L" settings";
    }
};

// Static member definition (required)
Ptr<ApplicationSettings> ApplicationSettings::instance;
```

## Summary

- **Purpose**: `Object` is the base class for all reference types in Vlpp
- **Requirement**: All classes must inherit from `Object` directly or indirectly
- **Benefits**: Provides reference counting, type safety, and debugging support
- **Usage**: Use `Ptr<T>` for automatic memory management of Object-derived classes
- **Override**: Implement `ToString()` for meaningful string representation
- **Virtual Methods**: Use virtual destructors and methods for polymorphic behavior