# Working with Interface Base Class

## Overview

`Interface` is the base class for all interface types in the Vlpp framework. All interface types must virtually inherit from `Interface` or other interface types. The `Interface` class provides the foundation for abstract contracts and polymorphic behavior without concrete implementation details.

## Why Interface is Required

All interface types must inherit from `Interface` because it:
- **Virtual destructor**: Enables `Ptr<T>` to work correctly
- **Establishes contracts**: Defines abstract behavior without implementation
- **Enables multiple inheritance**: Interfaces can be combined safely
- **Supports reflection**: Enables runtime type information for scripting
- **Provides consistency**: Standard interface pattern across the framework

## Basic Interface Definition

```cpp
#include "Vlpp.h"
using namespace vl;

class IDrawable : public virtual Interface
{
public:
    virtual void Draw() const = 0;
    virtual WString GetShape() const = 0;
    virtual double GetArea() const = 0;
};

class IMovable : public virtual Interface
{
public:
    virtual void MoveTo(double x, double y) = 0;
    virtual void MoveBy(double dx, double dy) = 0;
    virtual double GetX() const = 0;
    virtual double GetY() const = 0;
};

// Class implementing interfaces
class Circle : public Object, public virtual IDrawable, public virtual IMovable
{
private:
    double radius, posX, posY;
    
public:
    Circle(double r, double x = 0.0, double y = 0.0)
        : radius(r), posX(x), posY(y) {}
    
    // IDrawable implementation
    void Draw() const override
    {
        Console::WriteLine(L"Drawing circle at (" + ftow(posX) + L", " + ftow(posY) + L")");
    }
    
    WString GetShape() const override { return L"Circle"; }
    double GetArea() const override { return 3.14159 * radius * radius; }
    
    // IMovable implementation
    void MoveTo(double x, double y) override { posX = x; posY = y; }
    void MoveBy(double dx, double dy) override { posX += dx; posY += dy; }
    double GetX() const override { return posX; }
    double GetY() const override { return posY; }
};
```

## Multiple Interface Inheritance

```cpp
class IReadable : public virtual Interface
{
public:
    virtual WString Read() = 0;
    virtual bool CanRead() const = 0;
};

class IWritable : public virtual Interface
{
public:
    virtual void Write(const WString& data) = 0;
    virtual bool CanWrite() const = 0;
};

// Composite interface inheriting multiple interfaces
class IStream : public virtual IReadable, public virtual IWritable
{
public:
    virtual vint GetPosition() const = 0;
    virtual void Seek(vint position) = 0;
};
```

## Interface Hierarchies

```cpp
// Base service interface
class IService : public virtual Interface
{
public:
    virtual void Start() = 0;
    virtual void Stop() = 0;
    virtual bool IsRunning() const = 0;
    virtual WString GetServiceName() const = 0;
};

// Extended service interface
class IConfigurableService : public virtual IService
{
public:
    virtual void LoadConfiguration(const WString& configPath) = 0;
    virtual WString GetConfigurationValue(const WString& key) const = 0;
    virtual void SetConfigurationValue(const WString& key, const WString& value) = 0;
};
```

## Observer Pattern with Interfaces

```cpp
class IObserver : public virtual Interface
{
public:
    virtual void OnNotify(const WString& eventName, const WString& data) = 0;
    virtual WString GetObserverName() const = 0;
};

class IObservable : public virtual Interface
{
public:
    virtual void Subscribe(IObserver* observer) = 0;
    virtual void Unsubscribe(IObserver* observer) = 0;
    virtual void NotifyObservers(const WString& eventName, const WString& data) = 0;
};
```

## Factory Pattern with Interfaces

```cpp
class IProcessor : public virtual Interface
{
public:
    virtual void Process(const WString& input) = 0;
    virtual WString GetProcessorType() const = 0;
    virtual bool CanProcess(const WString& input) const = 0;
};

class IFactory : public virtual Interface
{
public:
    virtual Ptr<IProcessor> CreateProcessor() = 0;
    virtual WString GetFactoryType() const = 0;
};
```

## Best Practices for Interface

### DO:
- **Use virtual inheritance** from Interface
- **Define pure virtual methods** for interface contracts
- **Keep interfaces focused** on single responsibilities
- **Use meaningful interface names** starting with 'I'

### DON'T:
- **Add data members** to interfaces
- **Provide implementations** in interfaces (except for convenience methods)
- **Make interfaces too large** (Interface Segregation Principle)
- **Use interface inheritance** for code reuse (use composition instead)

### Design Guidelines
```cpp
// Good: Focused interface with single responsibility
class ILogger : public virtual Interface
{
public:
    virtual void Log(const WString& message) = 0;
    virtual void LogError(const WString& error) = 0;
    virtual void LogWarning(const WString& warning) = 0;
};

// Avoid: Interface that's too large (violates ISP)
class IBadInterface : public virtual Interface
{
public:
    // Too many unrelated responsibilities
    virtual void Draw() = 0;
    virtual void Save() = 0;
    virtual void Network() = 0;
    // ... many more unrelated methods
};
```

## Summary

- **Purpose**: `Interface` is the base class for all interface types in Vlpp
- **Inheritance**: Use virtual inheritance from `Interface`
- **Design**: Keep interfaces focused on single responsibilities
- **Methods**: Define only pure virtual methods in interfaces
- **Implementation**: Classes implement interfaces and inherit from `Object`
- **Best Practice**: Favor composition and small, focused interfaces