# Defining Class for Reference Types

## Overview

In the Vlpp framework, `class` is used to define **reference types** - objects that are managed by reference counting and typically allocated on the heap. All reference types must inherit from `Object` or other reference types. Reference types are designed for complex objects with behavior, inheritance hierarchies, and shared ownership semantics.

## When to Use Class

Use `class` for:

- **Complex objects**: Objects with significant behavior and state
- **Objects requiring inheritance**: Base classes and derived classes
- **Resource managers**: Objects that manage files, connections, or other resources
- **Large objects**: Objects that are expensive to copy
- **Shared objects**: Objects that need to be shared between multiple owners
- **Objects with virtual functions**: Polymorphic behavior

## Basic Class Definition

### Simple Reference Type

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
    void Decrement() { value--; }
    void Reset() { value = 0; }
    
    WString ToString() const
    {
        return L"Counter(" + itow(value) + L")";
    }
};

// Usage with Ptr<T>
void UseCounter()
{
    auto counter = Ptr(new Counter(10));
    counter->Increment();
    Console::WriteLine(counter->ToString()); // Counter(11)
    
    // Share the same counter instance
    auto sharedCounter = counter;
    sharedCounter->Increment();
    Console::WriteLine(counter->ToString()); // Counter(12)
}
```

### Resource Manager Class

```cpp
#include "Vlpp.h"
using namespace vl;

class FileManager : public Object
{
private:
    WString fileName;
    bool isOpen;
    
public:
    FileManager(const WString& file) : fileName(file), isOpen(false) {}
    
    ~FileManager()
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
            // Open file logic here
            isOpen = true;
            Console::WriteLine(L"Opened file: " + fileName);
        }
        return isOpen;
    }
    
    void Close()
    {
        if (isOpen)
        {
            // Close file logic here
            isOpen = false;
            Console::WriteLine(L"Closed file: " + fileName);
        }
    }
    
    bool IsOpen() const { return isOpen; }
    const WString& GetFileName() const { return fileName; }
    
    WString ReadAllText()
    {
        CHECK_ERROR(isOpen, L"File must be open before reading");
        // Read file content
        return L"File content of " + fileName;
    }
    
    void WriteText(const WString& content)
    {
        CHECK_ERROR(isOpen, L"File must be open before writing");
        // Write file content
        Console::WriteLine(L"Writing to " + fileName + L": " + content);
    }
};
```

## Inheritance Hierarchies

### Base Class with Virtual Methods

```cpp
#include "Vlpp.h"
using namespace vl;

class Shape : public Object
{
protected:
    WString name;
    
public:
    Shape(const WString& shapeName) : name(shapeName) {}
    virtual ~Shape() = default;
    
    const WString& GetName() const { return name; }
    
    // Pure virtual methods - must be implemented by derived classes
    virtual double GetArea() const = 0;
    virtual double GetPerimeter() const = 0;
    virtual WString GetDescription() const = 0;
    
    // Virtual method with default implementation
    virtual WString ToString() const
    {
        return name + L" - Area: " + ftow(GetArea()) + L", Perimeter: " + ftow(GetPerimeter());
    }
    
    // Non-virtual utility method
    bool IsLargerThan(Shape* other) const
    {
        CHECK_ERROR(other != nullptr, L"Cannot compare with null shape");
        return GetArea() > other->GetArea();
    }
};

class Rectangle : public Shape
{
private:
    double width;
    double height;
    
public:
    Rectangle(double w, double h) 
        : Shape(L"Rectangle"), width(w), height(h) 
    {
        CHECK_ERROR(w > 0 && h > 0, L"Rectangle dimensions must be positive");
    }
    
    double GetWidth() const { return width; }
    double GetHeight() const { return height; }
    
    // Implement pure virtual methods
    double GetArea() const override
    {
        return width * height;
    }
    
    double GetPerimeter() const override
    {
        return 2.0 * (width + height);
    }
    
    WString GetDescription() const override
    {
        return L"Rectangle with width " + ftow(width) + L" and height " + ftow(height);
    }
};

class Circle : public Shape
{
private:
    double radius;
    static constexpr double PI = 3.14159265359;
    
public:
    Circle(double r) : Shape(L"Circle"), radius(r)
    {
        CHECK_ERROR(r > 0, L"Circle radius must be positive");
    }
    
    double GetRadius() const { return radius; }
    
    // Implement pure virtual methods
    double GetArea() const override
    {
        return PI * radius * radius;
    }
    
    double GetPerimeter() const override
    {
        return 2.0 * PI * radius;
    }
    
    WString GetDescription() const override
    {
        return L"Circle with radius " + ftow(radius);
    }
};
```

## Complex Object Patterns

### Observer Pattern Implementation

```cpp
#include "Vlpp.h"
using namespace vl;

class Observer : public Object
{
public:
    virtual ~Observer() = default;
    virtual void OnNotified(const WString& message) = 0;
};

class Subject : public Object
{
private:
    List<Observer*> observers;
    WString state;
    
public:
    void AddObserver(Observer* observer)
    {
        CHECK_ERROR(observer != nullptr, L"Observer cannot be null");
        if (!observers.Contains(observer))
        {
            observers.Add(observer);
        }
    }
    
    void RemoveObserver(Observer* observer)
    {
        observers.Remove(observer);
    }
    
    void SetState(const WString& newState)
    {
        if (state != newState)
        {
            state = newState;
            NotifyObservers(L"State changed to: " + state);
        }
    }
    
    const WString& GetState() const { return state; }
    
private:
    void NotifyObservers(const WString& message)
    {
        for (vint i = 0; i < observers.Count(); i++)
        {
            observers[i]->OnNotified(message);
        }
    }
};

class ConcreteObserver : public Observer
{
private:
    WString name;
    
public:
    ConcreteObserver(const WString& observerName) : name(observerName) {}
    
    void OnNotified(const WString& message) override
    {
        Console::WriteLine(name + L" received: " + message);
    }
};
```

## Factory Pattern

### Abstract Factory

```cpp
#include "Vlpp.h"
using namespace vl;

class Document : public Object
{
public:
    virtual ~Document() = default;
    virtual void Open() = 0;
    virtual void Close() = 0;
    virtual WString GetType() const = 0;
};

class TextDocument : public Document
{
private:
    WString content;
    
public:
    void Open() override
    {
        Console::WriteLine(L"Opening text document");
    }
    
    void Close() override
    {
        Console::WriteLine(L"Closing text document");
    }
    
    WString GetType() const override
    {
        return L"Text Document";
    }
    
    void SetContent(const WString& text) { content = text; }
    const WString& GetContent() const { return content; }
};

class XMLDocument : public Document
{
private:
    WString xmlContent;
    
public:
    void Open() override
    {
        Console::WriteLine(L"Opening XML document");
    }
    
    void Close() override
    {
        Console::WriteLine(L"Closing XML document");
    }
    
    WString GetType() const override
    {
        return L"XML Document";
    }
    
    void SetXMLContent(const WString& xml) { xmlContent = xml; }
    const WString& GetXMLContent() const { return xmlContent; }
};

class DocumentFactory : public Object
{
public:
    enum class DocumentType
    {
        Text,
        XML
    };
    
    static Ptr<Document> CreateDocument(DocumentType type)
    {
        switch (type)
        {
        case DocumentType::Text:
            return Ptr(new TextDocument());
        case DocumentType::XML:
            return Ptr(new XMLDocument());
        default:
            CHECK_FAIL(L"Unknown document type");
        }
    }
};
```

## State Management

### Stateful Object with Lifecycle

```cpp
#include "Vlpp.h"
using namespace vl;

class Connection : public Object
{
public:
    enum class State
    {
        Disconnected,
        Connecting,
        Connected,
        Disconnecting,
        Error
    };
    
private:
    State currentState;
    WString serverAddress;
    WString lastError;
    
public:
    Connection(const WString& address) 
        : currentState(State::Disconnected), serverAddress(address) {}
    
    bool Connect()
    {
        switch (currentState)
        {
        case State::Disconnected:
            currentState = State::Connecting;
            Console::WriteLine(L"Connecting to " + serverAddress);
            
            // Simulate connection logic
            if (serverAddress.Length() > 0)
            {
                currentState = State::Connected;
                Console::WriteLine(L"Connected successfully");
                return true;
            }
            else
            {
                currentState = State::Error;
                lastError = L"Invalid server address";
                return false;
            }
            
        case State::Connected:
            return true; // Already connected
            
        case State::Connecting:
            return false; // Connection in progress
            
        case State::Disconnecting:
            return false; // Wait for disconnection
            
        case State::Error:
            return false; // Cannot connect in error state
            
        default:
            CHECK_FAIL(L"Invalid connection state");
        }
    }
    
    void Disconnect()
    {
        switch (currentState)
        {
        case State::Connected:
        case State::Connecting:
            currentState = State::Disconnecting;
            Console::WriteLine(L"Disconnecting from " + serverAddress);
            currentState = State::Disconnected;
            Console::WriteLine(L"Disconnected");
            break;
            
        case State::Disconnected:
            // Already disconnected
            break;
            
        case State::Disconnecting:
            // Disconnection in progress
            break;
            
        case State::Error:
            currentState = State::Disconnected;
            lastError = WString::Empty;
            break;
            
        default:
            CHECK_FAIL(L"Invalid connection state");
        }
    }
    
    State GetState() const { return currentState; }
    const WString& GetServerAddress() const { return serverAddress; }
    const WString& GetLastError() const { return lastError; }
    
    bool IsConnected() const { return currentState == State::Connected; }
    bool HasError() const { return currentState == State::Error; }
    
    WString GetStateString() const
    {
        switch (currentState)
        {
        case State::Disconnected: return L"Disconnected";
        case State::Connecting: return L"Connecting";
        case State::Connected: return L"Connected";
        case State::Disconnecting: return L"Disconnecting";
        case State::Error: return L"Error";
        default: return L"Unknown";
        }
    }
};
```

## Collection Manager Classes

### Container with Custom Logic

```cpp
#include "Vlpp.h"
using namespace vl;

class UniqueStringCollection : public Object
{
private:
    SortedList<WString> items;
    Dictionary<WString, vint> itemCounts;
    
public:
    bool Add(const WString& item)
    {
        if (item.Length() == 0)
            return false;
            
        if (!items.Contains(item))
        {
            items.Add(item);
            itemCounts.Add(item, 1);
            return true;
        }
        else
        {
            itemCounts[item]++;
            return false; // Already existed
        }
    }
    
    bool Remove(const WString& item)
    {
        if (items.Contains(item))
        {
            vint count = itemCounts[item];
            if (count > 1)
            {
                itemCounts[item] = count - 1;
            }
            else
            {
                items.Remove(item);
                itemCounts.Remove(item);
            }
            return true;
        }
        return false;
    }
    
    bool Contains(const WString& item) const
    {
        return items.Contains(item);
    }
    
    vint GetCount(const WString& item) const
    {
        if (itemCounts.Keys().Contains(item))
            return itemCounts[item];
        return 0;
    }
    
    vint GetUniqueCount() const
    {
        return items.Count();
    }
    
    vint GetTotalCount() const
    {
        vint total = 0;
        for (vint i = 0; i < itemCounts.Count(); i++)
        {
            total += itemCounts.Values()[i];
        }
        return total;
    }
    
    const SortedList<WString>& GetItems() const
    {
        return items;
    }
    
    void Clear()
    {
        items.Clear();
        itemCounts.Clear();
    }
    
    WString ToString() const
    {
        WString result = L"UniqueStringCollection [";
        for (vint i = 0; i < items.Count(); i++)
        {
            if (i > 0) result += L", ";
            result += items[i] + L"(" + itow(itemCounts[items[i]]) + L")";
        }
        result += L"]";
        return result;
    }
};
```

## Best Practices for Class

### DO Use Class For:

- **Complex behavior**: Objects with significant logic and state management
- **Inheritance hierarchies**: Base classes and polymorphic objects
- **Resource management**: Files, connections, system resources
- **Large objects**: Objects that are expensive to copy
- **Shared ownership**: Objects used by multiple components
- **Event handling**: Objects that respond to events

### DON'T Use Class For:

- **Simple data holders**: Use `struct` for plain data containers
- **Mathematical types**: Use `struct` for points, vectors, etc.
- **Small immutable objects**: Use `struct` for lightweight data
- **Configuration objects**: Use `struct` for settings and options

### Inheritance Guidelines

```cpp
// Good: Proper inheritance hierarchy
class Animal : public Object
{
public:
    virtual ~Animal() = default;
    virtual WString MakeSound() const = 0;
    virtual WString GetSpecies() const = 0;
};

class Dog : public Animal
{
public:
    WString MakeSound() const override { return L"Woof!"; }
    WString GetSpecies() const override { return L"Canis lupus"; }
};

// Good: Virtual destructor in base class
class Resource : public Object
{
public:
    virtual ~Resource() { /* cleanup code */ }
    virtual void Cleanup() = 0;
};

// Avoid: Non-virtual destructor in base class
class BadBase : public Object
{
public:
    ~BadBase() { /* This should be virtual! */ }
};
```

### Memory Management

```cpp
// Good: Use Ptr<T> for shared ownership
void GoodMemoryManagement()
{
    auto shape = Ptr(new Rectangle(10.0, 20.0));
    auto sharedShape = shape; // Safe sharing
    
    // Objects automatically cleaned up when last Ptr goes out of scope
}

// Avoid: Raw pointers for owned objects
void AvoidRawPointers()
{
    Shape* shape = new Rectangle(10.0, 20.0); // Don't do this
    // Memory leak if exception occurs before delete
    delete shape; // Manual memory management
}

// Good: Use raw pointers only for non-owning references
class ShapeContainer : public Object
{
private:
    List<Ptr<Shape>> ownedShapes;
    List<Shape*> references; // Non-owning references
    
public:
    void AddOwnedShape(Ptr<Shape> shape)
    {
        ownedShapes.Add(shape);
    }
    
    void AddReference(Shape* shape)
    {
        CHECK_ERROR(shape != nullptr, L"Shape reference cannot be null");
        references.Add(shape);
    }
};
```

## Summary

- **Purpose**: Use `class` for reference types with complex behavior and inheritance
- **Inheritance**: All reference types must inherit from `Object`
- **Memory**: Use `Ptr<T>` for shared ownership and automatic memory management
- **Virtual Functions**: Use virtual destructors and methods for polymorphic behavior
- **Best For**: Resource managers, complex objects, inheritance hierarchies
- **Key Principle**: If it needs inheritance, complex behavior, or shared ownership, use `class`