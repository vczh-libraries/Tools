# Using Event for Multiple Callbacks

`Event<void(TArgs...)>` provides a mechanism for multiple callbacks that are executed when the event is triggered. Unlike `Func<F>` which holds one callable object, `Event<F>` can store multiple callable objects and invoke all of them when called.

## Basic Declaration

`Event<F>` works with function signatures that return `void`:

```cpp
#include "Vlpp.h"
using namespace vl;

// Event with no parameters
Event<void()> onStartup;

// Event with parameters
Event<void(WString)> onMessage;
Event<void(vint, WString)> onProgress;
```

## Adding Callbacks

`Event<F>` provides three ways to add callbacks, all returning a handle for later removal:

```cpp
Event<void(WString)> onMessage;

// 1. Lambda expressions and function objects
auto handle1 = onMessage.Add([](const WString& msg) {
    Console::WriteLine(L"Handler: " + msg);
});

// 2. Function pointers
void LogMessage(const WString& msg) {
    Console::WriteLine(L"Log: " + msg);
}
auto handle2 = onMessage.Add(LogMessage);

// 3. Method pointers with object instance
class MessageProcessor {
public:
    void ProcessMessage(const WString& msg) {
        Console::WriteLine(L"Processing: " + msg);
    }
};

MessageProcessor processor;
auto handle3 = onMessage.Add(&processor, &MessageProcessor::ProcessMessage);
```

## Triggering Events

Call the event like a function to execute all registered callbacks:

```cpp
// Executes all registered handlers
onMessage(L"Hello World");
```

## Removing Callbacks

Use the `Remove` method with the handle returned by `Add`:

```cpp
Event<void(WString)> onMessage;
auto handle = onMessage.Add([](const WString& msg) {
    Console::WriteLine(L"Temporary: " + msg);
});

onMessage(L"First call"); // Handler executes
onMessage.Remove(handle); // Remove the handler
onMessage(L"Second call"); // Handler no longer executes
```

## Basic Usage Examples

### Observer Pattern
```cpp
class DataModel
{
public:
    Event<void(const WString&)> dataChanged;
    
    void SetData(const WString& newData)
    {
        if (data != newData)
        {
            data = newData;
            dataChanged(data); // Notify all observers
        }
    }
    
private:
    WString data;
};

// Register observers
DataModel model;
auto handle1 = model.dataChanged.Add([](const WString& data) {
    Console::WriteLine(L"UI updated: " + data);
});
auto handle2 = model.dataChanged.Add([](const WString& data) {
    Console::WriteLine(L"Logged: " + data);
});

model.SetData(L"New Value"); // Both observers notified
```

### Application Events
```cpp
class Application
{
public:
    Event<void()> onStartup;
    Event<void()> onShutdown;
    Event<void(WString)> onError;
    
    void Run()
    {
        onStartup(); // Notify startup
        // ... application logic ...
        onShutdown(); // Notify shutdown
    }
};

Application app;
app.onStartup.Add([]() { Console::WriteLine(L"Service started"); });
app.onShutdown.Add([]() { Console::WriteLine(L"Service stopped"); });
app.onError.Add([](const WString& msg) { Console::WriteLine(L"Error: " + msg); });
```

## Best Practices

### Handle Management
```cpp
class EventSubscriber
{
private:
    collections::List<EventHandler> handles;
    
public:
    void SubscribeToEvents(Application& app)
    {
        handles.Add(app.onStartup.Add([this]() { OnStartup(); }));
        handles.Add(app.onShutdown.Add([this]() { OnShutdown(); }));
    }
    
    // Handles are automatically cleaned up when destroyed
};
```

### Error Handling
```cpp
onMessage.Add([](const WString& data) {
    try
    {
        ProcessData(data);
    }
    catch (const Exception& e)
    {
        Console::WriteLine(L"Error: " + e.Message());
    }
});
```

### Thread Safety
Events are not thread-safe by default. Use synchronization when accessing from multiple threads:

```cpp
class ThreadSafeEventPublisher
{
private:
    Event<void(WString)> onMessage;
    CriticalSection cs;
    
public:
    EventHandler Subscribe(Func<void(WString)> handler)
    {
        CS_LOCK(cs) { return onMessage.Add(handler); }
    }
    
    void Publish(const WString& message)
    {
        CS_LOCK(cs) { onMessage(message); }
    }
};
```