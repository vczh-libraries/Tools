# Working with Raw Pointers as Weak References

While `Ptr<T>` provides shared ownership with reference counting, there are scenarios where you need weak reference semantics - accessing an object without extending its lifetime. Since Vlpp doesn't provide an equivalent to `std::weak_ptr<T>`, raw C++ pointers are used for weak references, though this should be done carefully.

## When to Use Raw Pointers as Weak References

Use raw pointers as weak references when:
- You need to observe an object without affecting its lifetime
- You want to avoid circular reference problems with `Ptr<T>`
- You need temporary access where shared ownership is not required
- Performance is critical and you can guarantee the object's lifetime through other means

## Basic Weak Reference Pattern

### Observer Pattern Example

```cpp
class Subject : public Object
{
private:
    List<Observer*> observers;  // Weak references to observers
    
public:
    void AddObserver(Observer* observer)
    {
        if (observer && !observers.Contains(observer))
        {
            observers.Add(observer);
        }
    }
    
    void RemoveObserver(Observer* observer)
    {
        observers.Remove(observer);
    }
    
    void NotifyObservers()
    {
        // Use copies in case observers modify the list during notification
        List<Observer*> observersCopy;
        CopyFrom(observersCopy, observers);
        
        for (auto observer : observersCopy)
        {
            if (observers.Contains(observer))  // Check if still registered
            {
                observer->OnNotify();
            }
        }
    }
};

class Observer : public Object
{
private:
    Subject* subject;  // Weak reference to subject
    
public:
    Observer(Subject* _subject) : subject(_subject)
    {
        if (subject)
        {
            subject->AddObserver(this);
        }
    }
    
    ~Observer()
    {
        if (subject)
        {
            subject->RemoveObserver(this);
        }
    }
    
    void OnNotify()
    {
        // Handle notification
        if (subject)  // Always check validity
        {
            // Process notification from subject
        }
    }
};
```

## Avoiding Circular References

### Problem: Circular Reference with Ptr<T>

```cpp
// PROBLEMATIC: Creates circular reference
class Parent : public Object
{
public:
    List<Ptr<Child>> children;
};

class Child : public Object
{
public:
    Ptr<Parent> parent;  // This creates a cycle!
};

// Memory leak: Neither Parent nor Child will be destroyed
auto parent = Ptr(new Parent());
auto child = Ptr(new Child());
parent->children.Add(child);
child->parent = parent;  // Circular reference!
```

### Solution: Use Raw Pointer for Back-Reference

```cpp
// CORRECT: Break cycle with weak reference
class Parent : public Object
{
public:
    List<Ptr<Child>> children;
    
    ~Parent()
    {
        // Notify children that parent is being destroyed
        for (auto child : children)
        {
            child->parent = nullptr;
        }
    }
};

class Child : public Object
{
public:
    Parent* parent = nullptr;  // Weak reference to break cycle
    
    void DoSomething()
    {
        if (parent)  // Always check validity
        {
            // Use parent safely
        }
    }
};
```

## Safety Guidelines

### 1. Always Check for Nullptr

```cpp
class WeakReferenceHolder : public Object
{
private:
    SomeObject* weakRef = nullptr;
    
public:
    void SetWeakReference(SomeObject* obj)
    {
        weakRef = obj;
    }
    
    void UseWeakReference()
    {
        if (weakRef)  // Always check before use
        {
            weakRef->DoSomething();
        }
    }
    
    void ClearWeakReference()
    {
        weakRef = nullptr;
    }
};
```

### 2. Explicit Lifetime Management

```cpp
class Container : public Object
{
private:
    Ptr<Resource> resource;
    List<Observer*> observers;  // Observers hold weak references
    
public:
    void RegisterObserver(Observer* observer)
    {
        if (observer)
        {
            observers.Add(observer);
        }
    }
    
    void UnregisterObserver(Observer* observer)
    {
        observers.Remove(observer);
    }
    
    ~Container()
    {
        // Notify all observers before destruction
        for (auto observer : observers)
        {
            observer->OnContainerDestroyed();
        }
    }
};
```

### 3. RAII for Automatic Cleanup

```cpp
class WeakObserver : public Object
{
private:
    Subject* subject;
    
public:
    WeakObserver(Subject* _subject) : subject(_subject)
    {
        if (subject)
        {
            subject->AddObserver(this);
        }
    }
    
    ~WeakObserver()
    {
        // Automatic cleanup on destruction
        if (subject)
        {
            subject->RemoveObserver(this);
            subject = nullptr;
        }
    }
    
    // Disable copy to prevent issues with automatic cleanup
    WeakObserver(const WeakObserver&) = delete;
    WeakObserver& operator=(const WeakObserver&) = delete;
};
```

## Common Patterns

### Temporary Access Pattern

```cpp
void ProcessWithTemporaryAccess(Ptr<SomeObject> sharedObj)
{
    SomeObject* tempPtr = sharedObj.Obj();  // Get raw pointer for temporary use
    
    // Use tempPtr for quick operations within this scope
    if (tempPtr)
    {
        tempPtr->QuickOperation();
    }
    
    // tempPtr automatically becomes invalid when function exits
    // The shared object is still managed by sharedObj
}
```

### Cache Pattern with Weak References

```cpp
class CacheManager : public Object
{
private:
    Dictionary<WString, Ptr<ExpensiveResource>> strongCache;
    Dictionary<WString, ExpensiveResource*> weakCache;
    
public:
    Ptr<ExpensiveResource> GetResource(const WString& key)
    {
        // First check strong cache
        if (strongCache.Keys().Contains(key))
        {
            return strongCache[key];
        }
        
        // Then check weak cache
        if (weakCache.Keys().Contains(key))
        {
            auto weakPtr = weakCache[key];
            if (IsStillValid(weakPtr))  // Custom validation
            {
                auto strongPtr = Ptr(weakPtr);  // Convert back to strong reference
                strongCache.Set(key, strongPtr);
                return strongPtr;
            }
            else
            {
                weakCache.Remove(key);  // Clean up invalid weak reference
            }
        }
        
        // Create new resource
        auto newResource = Ptr(new ExpensiveResource(key));
        strongCache.Set(key, newResource);
        return newResource;
    }
};
```

## Important Warnings

1. **No Automatic Validation**: Unlike `std::weak_ptr`, raw pointers don't automatically detect when the pointed object is destroyed.

2. **Manual Lifetime Management**: You must manually ensure the weak reference is cleared when the target object is destroyed.

3. **Use Sparingly**: Prefer `Ptr<T>` for most scenarios. Only use raw pointers when weak reference semantics are specifically needed.

4. **Document Intent**: Make it clear in code and documentation when a raw pointer is intentionally used as a weak reference.

## Best Practices Summary

- Always check raw pointers for nullptr before use
- Use RAII to ensure proper cleanup of weak references
- Prefer composition over inheritance to avoid circular references
- Document lifetime dependencies clearly
- Consider redesigning if you have many weak references (might indicate design issues)
- Use raw pointers only when `Ptr<T>` would create problems (cycles, performance, etc.)