# Using Event for Multiple Callbacks

`Event<void(TArgs...)>` in Vlpp provides a mechanism for handling multiple callbacks that are executed when the event is triggered. Unlike `Func<F>` which can hold only one callable object, `Event<F>` can store multiple callable objects and invoke all of them when called. This is ideal for implementing the observer pattern and notification systems.

## Basic Declaration

`Event<F>` works with function signatures that return `void`:

```cpp
#include "Vlpp.h"
using namespace vl;

// Event with no parameters
Event<void()> onStartup;

// Event with one parameter
Event<void(WString)> onMessage;

// Event with multiple parameters
Event<void(vint, WString)> onProgress;
```

## Adding Callbacks with Add Method

`Event<F>` provides three overloads of the `Add` method to register different types of callable objects. All overloads return a handle (`Ptr<EventHandler>`) that can be used to remove the callback later:

### Add Overload 1: Lambda Expressions and Function Objects
For lambda expressions and function objects that match the event signature:

```cpp
Event<void(WString)> onMessage;

// Add lambda expression
auto handle1 = onMessage.Add([](const WString& msg) {
    Console::WriteLine(L"Handler 1: " + msg);
});

// Add function object
struct MessageHandler {
    void operator()(const WString& msg) {
        Console::WriteLine(L"Function object: " + msg);
    }
};
MessageHandler handler;
auto handle2 = onMessage.Add(handler);
```

### Add Overload 2: Function Pointers
For raw function pointers that match the event signature:

```cpp
// Function pointer
void LogMessage(const WString& msg)
{
    Console::WriteLine(L"Log: " + msg);
}

Event<void(WString)> onMessage;
auto handle3 = onMessage.Add(LogMessage);
```

### Add Overload 3: Method Pointers
For method pointers with an object instance:

```cpp
class MessageProcessor {
public:
    void ProcessMessage(const WString& msg) {
        Console::WriteLine(L"Processing: " + msg);
    }
};

Event<void(WString)> onMessage;
MessageProcessor processor;

// Add method pointer with object instance
auto handle4 = onMessage.Add(&processor, &MessageProcessor::ProcessMessage);
```

All three overloads demonstrate different ways to attach callable objects to the event:
1. **Func-compatible objects** (lambdas, function objects)
2. **Function pointers**
3. **Method pointers** with object instances

## Triggering Events

Call the event like a function to execute all registered callbacks:

```cpp
// This will execute all three handlers registered above
onMessage(L"Hello World");

// Output:
// Handler 1: Hello World
// Handler 2: Hello World  
// Log: Hello World
```

## Removing Callbacks

Use the `Remove` method with the handle returned by `Add`:

```cpp
Event<void(WString)> onMessage;
auto handle = onMessage.Add([](const WString& msg) {
    Console::WriteLine(L"Temporary handler: " + msg);
});

onMessage(L"First call"); // Handler executes

onMessage.Remove(handle); // Remove the handler

onMessage(L"Second call"); // Handler no longer executes
```

## Practical Examples

### Observer Pattern Implementation
```cpp
class DataModel
{
private:
    WString data;

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
    
    WString GetData() const
    {
        return data;
    }
};

class UIView
{
public:
    void OnDataChanged(const WString& newData)
    {
        Console::WriteLine(L"UI updated with: " + newData);
    }
};

class Logger
{
public:
    void OnDataChanged(const WString& newData)
    {
        Console::WriteLine(L"Data change logged: " + newData);
    }
};

// Usage
DataModel model;
UIView view;
Logger logger;

// Register observers
auto viewHandle = model.dataChanged.Add([&view](const WString& data) {
    view.OnDataChanged(data);
});

auto logHandle = model.dataChanged.Add([&logger](const WString& data) {
    logger.OnDataChanged(data);
});

model.SetData(L"New Value"); // Both observers are notified
```

### Application Event System
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
        
        try
        {
            // Application logic here
            Console::WriteLine(L"Application running...");
        }
        catch (const Exception& e)
        {
            onError(e.Message()); // Notify error
        }
        
        onShutdown(); // Notify shutdown
    }
};

class DatabaseService
{
public:
    void OnStartup()
    {
        Console::WriteLine(L"Database service started");
    }
    
    void OnShutdown()
    {
        Console::WriteLine(L"Database service stopped");
    }
    
    void OnError(const WString& message)
    {
        Console::WriteLine(L"Database error: " + message);
    }
};

class LoggingService
{
public:
    void OnStartup()
    {
        Console::WriteLine(L"Logging service started");
    }
    
    void OnShutdown()
    {
        Console::WriteLine(L"Logging service stopped");
    }
    
    void OnError(const WString& message)
    {
        Console::WriteLine(L"Logged error: " + message);
    }
};

// Usage
Application app;
DatabaseService dbService;
LoggingService logService;

// Register services for startup
app.onStartup.Add([&dbService]() { dbService.OnStartup(); });
app.onStartup.Add([&logService]() { logService.OnStartup(); });

// Register services for shutdown
app.onShutdown.Add([&dbService]() { dbService.OnShutdown(); });
app.onShutdown.Add([&logService]() { logService.OnShutdown(); });

// Register services for error handling
app.onError.Add([&dbService](const WString& msg) { dbService.OnError(msg); });
app.onError.Add([&logService](const WString& msg) { logService.OnError(msg); });

app.Run();
```

### Progress Reporting
```cpp
class ProgressReporter
{
public:
    Event<void(vint, WString)> onProgress; // percentage, status message
    
    void SimulateWork()
    {
        for (vint i = 0; i <= 100; i += 20)
        {
            WString status = L"Processing step " + itow(i / 20 + 1);
            onProgress(i, status);
            
            // Simulate work
            Thread::Sleep(500);
        }
    }
};

class ProgressBar
{
public:
    void UpdateProgress(vint percentage, const WString& status)
    {
        Console::WriteLine(L"Progress: " + itow(percentage) + L"% - " + status);
    }
};

class StatusDisplay
{
public:
    void ShowStatus(vint percentage, const WString& status)
    {
        if (percentage == 100)
        {
            Console::WriteLine(L"Status: Completed!");
        }
        else
        {
            Console::WriteLine(L"Status: " + status);
        }
    }
};

// Usage
ProgressReporter reporter;
ProgressBar progressBar;
StatusDisplay statusDisplay;

reporter.onProgress.Add([&progressBar](vint pct, const WString& status) {
    progressBar.UpdateProgress(pct, status);
});

reporter.onProgress.Add([&statusDisplay](vint pct, const WString& status) {
    statusDisplay.ShowStatus(pct, status);
});

reporter.SimulateWork();
```

## Event Handler Management

### Automatic Cleanup Pattern
```cpp
class EventSubscriber
{
private:
    collections::List<EventHandler> handles;
    
public:
    void SubscribeToEvents(Application& app)
    {
        handles.Add(app.onStartup.Add([this]() {
            this->OnStartup();
        }));
        
        handles.Add(app.onShutdown.Add([this]() {
            this->OnShutdown();
        }));
    }
    
    ~EventSubscriber()
    {
        // Handles are automatically cleaned up when the list is destroyed
        // This ensures no dangling references
    }
    
private:
    void OnStartup() { Console::WriteLine(L"Subscriber started"); }
    void OnShutdown() { Console::WriteLine(L"Subscriber stopped"); }
};
```

### Conditional Event Handling
```cpp
class ConditionalHandler
{
private:
    bool enabled = true;
    
public:
    void SetEnabled(bool value) { enabled = value; }
    
    void RegisterHandler(Event<void(WString)>& event)
    {
        event.Add([this](const WString& message) {
            if (this->enabled)
            {
                Console::WriteLine(L"Handling: " + message);
            }
        });
    }
};
```

## Best Practices

### Use References for Captured Objects
```cpp
class EventPublisher
{
public:
    Event<void(vint)> onValueChanged;
};

class EventConsumer
{
public:
    void SubscribeToPublisher(EventPublisher& publisher)
    {
        // Capture this by reference to avoid copying
        publisher.onValueChanged.Add([this](vint value) {
            this->HandleValueChange(value);
        });
    }
    
private:
    void HandleValueChange(vint value)
    {
        Console::WriteLine(L"Value changed to: " + itow(value));
    }
};
```

### Error Handling in Event Callbacks
```cpp
Event<void(WString)> onProcessData;

onProcessData.Add([](const WString& data) {
    try
    {
        // Process data that might throw
        if (data.IsEmpty())
        {
            throw Exception(L"Empty data");
        }
        Console::WriteLine(L"Processed: " + data);
    }
    catch (const Exception& e)
    {
        Console::WriteLine(L"Error processing data: " + e.Message());
    }
});
```

### Thread Safety Considerations
```cpp
// Events are not thread-safe by default
// Use synchronization when accessing from multiple threads
class ThreadSafeEventPublisher
{
private:
    Event<void(WString)> onMessage;
    CriticalSection cs;
    
public:
    EventHandler Subscribe(Func<void(WString)> handler)
    {
        CS_LOCK(cs)
        {
            return onMessage.Add(handler);
        }
    }
    
    void Publish(const WString& message)
    {
        CS_LOCK(cs)
        {
            onMessage(message);
        }
    }
};
```

`Event<F>` provides a powerful mechanism for implementing decoupled, notification-based architectures where multiple components need to respond to the same events. It's essential for building maintainable and extensible applications following the observer pattern.