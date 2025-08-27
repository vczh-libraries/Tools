# Working with Interface Base Class

## Overview

`Interface` is the base class for all interface types in the Vlpp framework. All interface types must virtually inherit from `Interface` or other interface types. The `Interface` class provides the foundation for abstract contracts and polymorphic behavior without concrete implementation details.

## Why Interface is Required

All interface types must inherit from `Interface` because it:

- **Establishes contracts**: Defines abstract behavior without implementation
- **Enables multiple inheritance**: Interfaces can be combined safely
- **Supports reflection**: Enables runtime type information for scripting
- **Provides consistency**: Standard interface pattern across the framework

## Basic Interface Definition

### Simple Interface

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
    double radius;
    double posX, posY;
    
public:
    Circle(double r, double x = 0.0, double y = 0.0)
        : radius(r), posX(x), posY(y) {}
    
    // IDrawable implementation
    void Draw() const override
    {
        Console::WriteLine(L"Drawing circle at (" + ftow(posX) + L", " + ftow(posY) + 
                          L") with radius " + ftow(radius));
    }
    
    WString GetShape() const override
    {
        return L"Circle";
    }
    
    double GetArea() const override
    {
        return 3.14159 * radius * radius;
    }
    
    // IMovable implementation
    void MoveTo(double x, double y) override
    {
        posX = x;
        posY = y;
    }
    
    void MoveBy(double dx, double dy) override
    {
        posX += dx;
        posY += dy;
    }
    
    double GetX() const override { return posX; }
    double GetY() const override { return posY; }
    
    // Additional Circle-specific methods
    double GetRadius() const { return radius; }
    void SetRadius(double r) { radius = r; }
};
```

## Multiple Interface Inheritance

### Combining Multiple Interfaces

```cpp
#include "Vlpp.h"
using namespace vl;

class IReadable : public virtual Interface
{
public:
    virtual WString Read() = 0;
    virtual bool CanRead() const = 0;
    virtual vint GetAvailableBytes() const = 0;
};

class IWritable : public virtual Interface
{
public:
    virtual void Write(const WString& data) = 0;
    virtual bool CanWrite() const = 0;
    virtual void Flush() = 0;
};

class IClosable : public virtual Interface
{
public:
    virtual void Close() = 0;
    virtual bool IsClosed() const = 0;
};

// Composite interface inheriting multiple interfaces
class IStream : public virtual IReadable, public virtual IWritable, public virtual IClosable
{
public:
    virtual vint GetPosition() const = 0;
    virtual void Seek(vint position) = 0;
    virtual vint GetSize() const = 0;
};

// Implementation of composite interface
class MemoryStream : public Object, public virtual IStream
{
private:
    WString buffer;
    vint position;
    bool closed;
    
public:
    MemoryStream() : position(0), closed(false) {}
    
    // IReadable implementation
    WString Read() override
    {
        CHECK_ERROR(!closed, L"Stream is closed");
        if (position >= buffer.Length())
            return WString::Empty;
            
        WString result = buffer.Sub(position, buffer.Length() - position);
        position = buffer.Length();
        return result;
    }
    
    bool CanRead() const override { return !closed; }
    
    vint GetAvailableBytes() const override
    {
        if (closed) return 0;
        return buffer.Length() - position;
    }
    
    // IWritable implementation
    void Write(const WString& data) override
    {
        CHECK_ERROR(!closed, L"Stream is closed");
        buffer = buffer + data;
    }
    
    bool CanWrite() const override { return !closed; }
    
    void Flush() override
    {
        // Memory stream doesn't need flushing
    }
    
    // IClosable implementation
    void Close() override
    {
        closed = true;
        position = 0;
    }
    
    bool IsClosed() const override { return closed; }
    
    // IStream implementation
    vint GetPosition() const override { return position; }
    
    void Seek(vint pos) override
    {
        CHECK_ERROR(!closed, L"Stream is closed");
        CHECK_ERROR(pos >= 0 && pos <= buffer.Length(), L"Position out of range");
        position = pos;
    }
    
    vint GetSize() const override { return buffer.Length(); }
    
    // Additional methods
    const WString& GetBuffer() const { return buffer; }
    void Clear() { buffer = WString::Empty; position = 0; }
};
```

## Interface Hierarchies

### Inheritance Among Interfaces

```cpp
#include "Vlpp.h"
using namespace vl;

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
    virtual void SaveConfiguration(const WString& configPath) = 0;
    virtual WString GetConfigurationValue(const WString& key) const = 0;
    virtual void SetConfigurationValue(const WString& key, const WString& value) = 0;
};

// Network-specific service interface
class INetworkService : public virtual IConfigurableService
{
public:
    virtual void SetPort(vint port) = 0;
    virtual vint GetPort() const = 0;
    virtual void SetAddress(const WString& address) = 0;
    virtual WString GetAddress() const = 0;
    virtual vint GetActiveConnections() const = 0;
};

// Implementation
class WebServer : public Object, public virtual INetworkService
{
private:
    bool running;
    WString serviceName;
    Dictionary<WString, WString> config;
    vint port;
    WString address;
    vint activeConnections;
    
public:
    WebServer() 
        : running(false), serviceName(L"WebServer"), port(80), 
          address(L"localhost"), activeConnections(0) {}
    
    // IService implementation
    void Start() override
    {
        if (!running)
        {
            running = true;
            Console::WriteLine(serviceName + L" started on " + address + L":" + itow(port));
        }
    }
    
    void Stop() override
    {
        if (running)
        {
            running = false;
            activeConnections = 0;
            Console::WriteLine(serviceName + L" stopped");
        }
    }
    
    bool IsRunning() const override { return running; }
    WString GetServiceName() const override { return serviceName; }
    
    // IConfigurableService implementation
    void LoadConfiguration(const WString& configPath) override
    {
        Console::WriteLine(L"Loading configuration from: " + configPath);
        // Implementation would load from file
    }
    
    void SaveConfiguration(const WString& configPath) override
    {
        Console::WriteLine(L"Saving configuration to: " + configPath);
        // Implementation would save to file
    }
    
    WString GetConfigurationValue(const WString& key) const override
    {
        if (config.Keys().Contains(key))
            return config[key];
        return WString::Empty;
    }
    
    void SetConfigurationValue(const WString& key, const WString& value) override
    {
        config.Set(key, value);
    }
    
    // INetworkService implementation
    void SetPort(vint newPort) override
    {
        CHECK_ERROR(newPort > 0 && newPort <= 65535, L"Invalid port number");
        port = newPort;
    }
    
    vint GetPort() const override { return port; }
    
    void SetAddress(const WString& newAddress) override
    {
        CHECK_ERROR(newAddress.Length() > 0, L"Address cannot be empty");
        address = newAddress;
    }
    
    WString GetAddress() const override { return address; }
    
    vint GetActiveConnections() const override { return activeConnections; }
    
    // Additional WebServer methods
    void SimulateConnection()
    {
        if (running)
        {
            activeConnections++;
            Console::WriteLine(L"New connection. Active: " + itow(activeConnections));
        }
    }
};
```

## Interface Design Patterns

### Observer Pattern with Interfaces

```cpp
#include "Vlpp.h"
using namespace vl;

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

// Observable implementation
class EventSource : public Object, public virtual IObservable
{
private:
    List<IObserver*> observers;
    WString sourceName;
    
public:
    EventSource(const WString& name) : sourceName(name) {}
    
    void Subscribe(IObserver* observer) override
    {
        CHECK_ERROR(observer != nullptr, L"Observer cannot be null");
        if (!observers.Contains(observer))
        {
            observers.Add(observer);
            Console::WriteLine(observer->GetObserverName() + L" subscribed to " + sourceName);
        }
    }
    
    void Unsubscribe(IObserver* observer) override
    {
        if (observers.Contains(observer))
        {
            observers.Remove(observer);
            Console::WriteLine(observer->GetObserverName() + L" unsubscribed from " + sourceName);
        }
    }
    
    void NotifyObservers(const WString& eventName, const WString& data) override
    {
        Console::WriteLine(L"Event '" + eventName + L"' triggered by " + sourceName);
        for (vint i = 0; i < observers.Count(); i++)
        {
            observers[i]->OnNotify(eventName, data);
        }
    }
    
    void TriggerEvent(const WString& eventName, const WString& data)
    {
        NotifyObservers(eventName, data);
    }
    
    const WString& GetSourceName() const { return sourceName; }
};

// Observer implementation
class EventLogger : public Object, public virtual IObserver
{
private:
    WString loggerName;
    List<WString> logEntries;
    
public:
    EventLogger(const WString& name) : loggerName(name) {}
    
    void OnNotify(const WString& eventName, const WString& data) override
    {
        WString logEntry = L"[" + loggerName + L"] Event: " + eventName + L", Data: " + data;
        logEntries.Add(logEntry);
        Console::WriteLine(logEntry);
    }
    
    WString GetObserverName() const override { return loggerName; }
    
    const List<WString>& GetLogEntries() const { return logEntries; }
    void ClearLog() { logEntries.Clear(); }
};
```

## Factory Pattern with Interfaces

### Abstract Factory

```cpp
#include "Vlpp.h"
using namespace vl;

class IProcessor : public virtual Interface
{
public:
    virtual void Process(const WString& input) = 0;
    virtual WString GetProcessorType() const = 0;
    virtual bool CanProcess(const WString& input) const = 0;
};

class IValidator : public virtual Interface
{
public:
    virtual bool Validate(const WString& input) = 0;
    virtual WString GetValidationError() const = 0;
    virtual WString GetValidatorType() const = 0;
};

class IFactory : public virtual Interface
{
public:
    virtual Ptr<IProcessor> CreateProcessor() = 0;
    virtual Ptr<IValidator> CreateValidator() = 0;
    virtual WString GetFactoryType() const = 0;
};

// Concrete implementations
class TextProcessor : public Object, public virtual IProcessor
{
public:
    void Process(const WString& input) override
    {
        Console::WriteLine(L"Processing text: " + input);
    }
    
    WString GetProcessorType() const override { return L"Text Processor"; }
    
    bool CanProcess(const WString& input) const override
    {
        return input.Length() > 0;
    }
};

class TextValidator : public Object, public virtual IValidator
{
private:
    WString lastError;
    
public:
    bool Validate(const WString& input) override
    {
        if (input.Length() == 0)
        {
            lastError = L"Input cannot be empty";
            return false;
        }
        if (input.Length() > 1000)
        {
            lastError = L"Input too long (max 1000 characters)";
            return false;
        }
        lastError = WString::Empty;
        return true;
    }
    
    WString GetValidationError() const override { return lastError; }
    WString GetValidatorType() const override { return L"Text Validator"; }
};

class TextProcessingFactory : public Object, public virtual IFactory
{
public:
    Ptr<IProcessor> CreateProcessor() override
    {
        return Ptr(new TextProcessor());
    }
    
    Ptr<IValidator> CreateValidator() override
    {
        return Ptr(new TextValidator());
    }
    
    WString GetFactoryType() const override { return L"Text Processing Factory"; }
};

// Usage
void DemonstrateFactory()
{
    auto factory = Ptr(new TextProcessingFactory());
    auto processor = factory->CreateProcessor();
    auto validator = factory->CreateValidator();
    
    WString input = L"Hello, World!";
    
    if (validator->Validate(input))
    {
        processor->Process(input);
    }
    else
    {
        Console::WriteLine(L"Validation failed: " + validator->GetValidationError());
    }
}
```

## Interface Composition and Delegation

### Decorator Pattern

```cpp
#include "Vlpp.h"
using namespace vl;

class ITextProcessor : public virtual Interface
{
public:
    virtual WString ProcessText(const WString& input) = 0;
    virtual WString GetProcessorDescription() const = 0;
};

// Base implementation
class SimpleTextProcessor : public Object, public virtual ITextProcessor
{
public:
    WString ProcessText(const WString& input) override
    {
        return input; // No processing
    }
    
    WString GetProcessorDescription() const override
    {
        return L"Simple Text Processor";
    }
};

// Decorator base
class TextProcessorDecorator : public Object, public virtual ITextProcessor
{
protected:
    Ptr<ITextProcessor> wrappedProcessor;
    
public:
    TextProcessorDecorator(Ptr<ITextProcessor> processor)
        : wrappedProcessor(processor)
    {
        CHECK_ERROR(processor, L"Wrapped processor cannot be null");
    }
    
    WString ProcessText(const WString& input) override
    {
        return wrappedProcessor->ProcessText(input);
    }
    
    WString GetProcessorDescription() const override
    {
        return wrappedProcessor->GetProcessorDescription();
    }
};

// Concrete decorators
class UpperCaseDecorator : public TextProcessorDecorator
{
public:
    UpperCaseDecorator(Ptr<ITextProcessor> processor)
        : TextProcessorDecorator(processor) {}
    
    WString ProcessText(const WString& input) override
    {
        WString processed = wrappedProcessor->ProcessText(input);
        return processed.ToUpper();
    }
    
    WString GetProcessorDescription() const override
    {
        return L"UpperCase(" + wrappedProcessor->GetProcessorDescription() + L")";
    }
};

class TrimDecorator : public TextProcessorDecorator
{
public:
    TrimDecorator(Ptr<ITextProcessor> processor)
        : TextProcessorDecorator(processor) {}
    
    WString ProcessText(const WString& input) override
    {
        WString processed = wrappedProcessor->ProcessText(input);
        // Simple trim implementation
        vint start = 0, end = processed.Length();
        while (start < end && processed[start] == L' ') start++;
        while (end > start && processed[end - 1] == L' ') end--;
        return processed.Sub(start, end - start);
    }
    
    WString GetProcessorDescription() const override
    {
        return L"Trim(" + wrappedProcessor->GetProcessorDescription() + L")";
    }
};

void DemonstrateDecorator()
{
    // Build a processing pipeline
    auto processor = Ptr(new SimpleTextProcessor());
    processor = Ptr(new TrimDecorator(processor));
    processor = Ptr(new UpperCaseDecorator(processor));
    
    WString input = L"  hello world  ";
    WString result = processor->ProcessText(input);
    
    Console::WriteLine(L"Input: '" + input + L"'");
    Console::WriteLine(L"Output: '" + result + L"'");
    Console::WriteLine(L"Pipeline: " + processor->GetProcessorDescription());
}
```

## Best Practices for Interface

### DO:

- **Use virtual inheritance** from Interface
- **Define pure virtual methods** for interface contracts
- **Keep interfaces focused** on single responsibilities
- **Use meaningful interface names** starting with 'I'
- **Document interface contracts** clearly

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

// Good: Composition over inheritance
class IRepository : public virtual Interface
{
public:
    virtual void Save(const WString& key, const WString& value) = 0;
    virtual WString Load(const WString& key) = 0;
    virtual bool Exists(const WString& key) const = 0;
    virtual void Delete(const WString& key) = 0;
};

// Avoid: Interface that's too large (violates ISP)
class IBadInterface : public virtual Interface
{
public:
    // Too many unrelated responsibilities
    virtual void Draw() = 0;
    virtual void Save() = 0;
    virtual void Network() = 0;
    virtual void Process() = 0;
    // ... many more unrelated methods
};
```

## Summary

- **Purpose**: `Interface` is the base class for all interface types in Vlpp
- **Inheritance**: Use virtual inheritance from `Interface`
- **Design**: Keep interfaces focused on single responsibilities
- **Methods**: Define only pure virtual methods in interfaces
- **Implementation**: Classes implement interfaces and inherit from `Object`
- **Patterns**: Supports Observer, Factory, Decorator, and other design patterns
- **Best Practice**: Favor composition and small, focused interfaces