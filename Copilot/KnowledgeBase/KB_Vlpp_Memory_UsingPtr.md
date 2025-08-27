# Using Ptr for Shared Ownership

`Ptr<T>` is the Vlpp equivalent of `std::shared_ptr<T>` and is the primary way to manage reference types. It provides automatic memory management through reference counting for objects that inherit from `Object`.

You can use `p->member` to access members of the object pointed to by `Ptr<T>`. You could also use `p.Obj()` and `*p.Obj()` to get the raw pointer or the raw reference from it.

## Basic Usage

### Creating a Ptr<T>

The preferred way to create a `Ptr<T>`:

```cpp
auto myObject = Ptr(new MyClass(constructorArgs));
```

This immediately wraps the newly allocated object in reference counting.

### Checking if Ptr<T> is Empty

```cpp
Ptr<MyClass> ptr;

// Using operator bool
if (ptr)
{
    // ptr contains an object
}

// Comparing with nullptr
if (ptr == nullptr)
{
    // ptr is empty
}
```

### Resetting a Ptr<T>

```cpp
ptr = {};        // Method 1
ptr = nullptr;   // Method 2
```

### Accessing Members

```cpp
Ptr<MyClass> ptr = Ptr(new MyClass());

// Access members
ptr->SomeMethod();

// Get raw pointer
MyClass* rawPtr = ptr.Obj();

// Get raw reference  
MyClass& rawRef = *ptr.Obj();
```

## Type Conversions

### Implicit Conversions

If `T*` can be implicitly converted to `U*` (derived to base class), then `Ptr<T>` can be converted to `Ptr<U>`:

```cpp
class Base : public Object {};
class Derived : public Base {};

Ptr<Derived> derived = Ptr(new Derived());
Ptr<Base> base = derived;  // Implicit conversion works
```

### Dynamic Casting

For dynamic casting, use the `Cast<U>()` method:

```cpp
Ptr<Base> base = Ptr(new Derived());
Ptr<Derived> derived = base.Cast<Derived>();

if (derived)
{
    // Cast was successful
}
```

## Reference Types Requirements

All reference types used with `Ptr<T>` must inherit from `Object` or `Interface`:

```cpp
class MyReferenceType : public Object
{
    // Class implementation
};

// Usage
Ptr<MyReferenceType> ptr = Ptr(new MyReferenceType());
```

## Common Patterns

### Factory Functions

```cpp
Ptr<MyClass> CreateMyObject(const WString& name)
{
    return Ptr(new MyClass(name));
}
```

### Storing in Collections

```cpp
List<Ptr<MyClass>> objects;
objects.Add(Ptr(new MyClass(L"first")));
objects.Add(Ptr(new MyClass(L"second")));
```

### Interface Implementation

```cpp
Ptr<IMyInterface> interface = Ptr(new MyImplementation());
```

## Memory Management

`Ptr<T>` uses reference counting:
- When the last `Ptr<T>` pointing to an object is destroyed, the object is automatically deleted
- No need to manually call `delete`
- Circular references should be avoided, or use raw pointers for weak references

## When to Use Raw Pointers Instead

Use raw C++ pointers only for:
- Weak reference semantics (equivalent to `std::weak_ptr`)
- Temporary access where you don't need to extend the object's lifetime
- Performance-critical code where you can guarantee the object's lifetime

However, try to avoid raw pointers and use `Ptr<T>` whenever possible.

## Key Differences from std::shared_ptr

- No equivalent to `std::weak_ptr<T>` - use raw pointers for weak references
- Casting works only with types derived from `Object` and `Interface`
- Designed specifically for the Vlpp object model