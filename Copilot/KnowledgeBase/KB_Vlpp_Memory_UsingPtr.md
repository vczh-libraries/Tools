# Using Ptr for Shared Ownership

`Ptr<T>` is the Vlpp equivalent of `std::shared_ptr<T>` and is the primary way to manage reference types in the Vlpp framework. It provides automatic memory management through reference counting for objects that inherit from `Object`.

You can use `p->member` to access members of the object pointed to by `Ptr<T>`. You could also use `p.Obj()` and `*p.Obj()` to get the raw pointer or the raw reference from it.

## Basic Usage

### Creating a Ptr<T>

The preferred way to create a `Ptr<T>` is using the constructor directly with `new`:

```cpp
auto myObject = Ptr(new MyClass(constructorArgs));
```

This pattern immediately wraps the newly allocated object in reference counting, preventing memory leaks.

### Checking if Ptr<T> is Empty

A `Ptr<T>` can be empty (pointing to nothing). You can check this in two ways:

```cpp
Ptr<MyClass> ptr;

// Method 1: Using operator bool
if (ptr)
{
    // ptr contains an object
}

// Method 2: Comparing with nullptr
if (ptr == nullptr)
{
    // ptr is empty
}
```

### Resetting a Ptr<T>

To reset a `Ptr<T>` to empty state:

```cpp
ptr = {};        // Method 1
ptr = nullptr;   // Method 2
```

## Type Conversions

### Implicit Conversions

If `T*` can be implicitly converted to `U*` (such as derived to base class), then `Ptr<T>` can be converted to `Ptr<U>`:

```cpp
class Base : public Object {};
class Derived : public Base {};

Ptr<Derived> derived = Ptr(new Derived());
Ptr<Base> base = derived;  // Implicit conversion works
```

### Dynamic Casting

For dynamic casting (equivalent to `dynamic_cast`), use the `Cast<U>()` method:

```cpp
Ptr<Base> base = Ptr(new Derived());
Ptr<Derived> derived = base.Cast<Derived>();

if (derived)
{
    // Cast was successful
}
```

## Reference Types Requirements

All reference types used with `Ptr<T>` must inherit from `Object` or `Interface` because they declared virtual destructors:

```cpp
class MyReferenceType : public Object
{
    // Class implementation
};

// Usage
Ptr<MyReferenceType> ptr = Ptr(new MyReferenceType());
```

You can use `Ptr<T>` with other types only when there is no derived-to-base or base-to-derived casting involved.

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
- Circular references should be avoided, or when you must maintain a circular reference, use raw pointers for weak references.

## When to Use Raw Pointers Instead

The framework recommends using raw C++ pointers only in these cases:
- When you need weak reference semantics (equivalent to `std::weak_ptr`)
- For temporary access where you don't need to extend the object's lifetime
- When performance is critical and you can guarantee the object's lifetime

However, you should try your best to avoid raw pointers and use `Ptr<T>` whenever possible.

## Comparison with std::shared_ptr

Key differences from `std::shared_ptr<T>`:
- No equivalent to `std::weak_ptr<T>` - use raw pointers for weak references
- Casting works only with types derived from `Object` and `Interface`
- Designed specifically for the Vlpp object model
- Uses the same reference counting principles