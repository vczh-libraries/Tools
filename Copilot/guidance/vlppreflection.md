# Using VlppReflection

There are 3 levels of reflection defined in C++ compiler options:
- Nothing: The code compiled with full reflection. You can register your own class, get metadata from registered types and objects, and call reflectable functions in runtime.
  - Executing a Workflow script runs in this level.
- `VCZH_DESCRIPTABLEOBJECT_WITH_METADATA`: Metadata of types are loaded from external. You can get metadata from types, but lost all runtime supports.
  - Running a Workflow or GacUI XML compiler runs in this level.
- `VCZH_DEBUG_NO_REFLECTION`: Reflection is not enabled.
  - Workflow or GacUI XML Compiler generated code should be able to run in this level.

Always prefer code that compatible with `VCZH_DEBUG_NO_REFLECTION`.

When reflection is enabled (aka `VCZH_DEBUG_NO_REFLECTION` is not defined), use `vl::reflection::description::GetTypeDescriptor<T>` to get the metadata of a type.

A reflectable class must inherits from `public vl::reflection::Description<the class itself>`.
Use `AggregatableDescription` to allow a class being inherited in a Workflow script class.
Sub types of reflectable classes or interfaces do not automatically reflectable, it must uses `Description<T>` or `AggregatableDescription<T>`.

A reflectable interface must inherits from `public vl::reflection::Description<the class itself>`.
If such interface does not implement any other interface, it must inherits from `public vl::reflection::IDescriptable`.

When accessing reflectable members or functions, `vl::reflection::description::Value` would be helpful.
It should be used as a value type.
When reflection is not enabled, `Value` could still box any value,
just like `object` in C# or Java, or `std::any` in C++.

A type is reflectable only when it is registered.

## Type Registration

There are tons of examples in the source code.
It is strongly recommended to follow those examples to register new types.

- Any registration must happen in `vl::reflection::description`.
- Type list and interface proxy must happen in `.h` files.
- Type metadata registration must happen in `.cpp` files.
- Type registration should be written in dedicated files.

The overall code struct usually are

`.h` example:
```C++
namespace vl::reflection::description
{
#ifndef VCZH_DEBUG_NO_REFLECTION

    #define MY_TYPES(F)\
        F(::my::namespaces::First)\
        F(::my::namespaces::ISecond)\

    MY_TYPES(DECL_TYPE_INFO)

#ifdef VCZH_DESCRIPTABLEOBJECT_WITH_METADATA
#pragma warning(push)
#pragma warning(disable:4250)

    BEGIN_INTERFACE_PROXY...(::my::namespaces::ISecond)
      ...
    END_INTERFACE_PROXY(::my::namespaces::ISecond)

#pragma warning(pop)
#endif
#endif

    extern bool LoadMyTypes();
}
```

`.cpp` example:
```C++
namespace vl::reflection::description
{

#ifndef VCZH_DEBUG_NO_REFLECTION

    MY_TYPES(IMPL_CPP_TYPE_INFO)

#ifdef VCZH_DESCRIPTABLEOBJECT_WITH_METADATA
#define _ ,

    BEGIN_CLASS_MEMBER(::my::namespaces::ISecond)
        CLASS_MEMEBER_METHOD(ThisFunction, NO_PARAMETER)
        CLASS_MEMBER_METHOD(ThatFunction, { L"arg1" _ L"arg2" })
        ...
    END_CLASS_MEMBER(::my::namespaces::ISecond)

    BEGIN_INTERFACE_MEMBER(::my::namespaces::ISecond)
        vint Func(vint a, vint b) override
        {
            INVOKEGET_INTERFACE_PROXY_NOPARAMS(Func, a, b);
        }
        ...
    END_INTERFACE_MEMBER(::my::namespaces::ISecond)

#undef _

    class MyTypeLoader : public Object, public virtual ITypeLoader
    {
    public:
        void Load(ITypeManager* manager) override
        {
            MY_TYPES(ADD_TYPE_INFO)
        }

        void Unload(ITypeManager* manager) override
        {
        }
    };

#endif
#endif

    bool LoadMyTypes()
    {
#ifdef VCZH_DESCRIPTABLEOBJECT_WITH_METADATA
        if (auto manager = GetGlobalTypeManager())
        {
            return manager->AddTypeLoader(Ptr(new MyTypeLoader));
        }
#endif
        return false;
    }
}
```

### Enum

For any `enum` that works like a list of names:
```C++
BEGIN_ENUM_ITEM(MyEnum)
    ENUM_CLASS_ITEM(FirstItem)
    ENUM_CLASS_ITEM(SecondItem)
END_ENUM_ITEM(MyEnum)
```

For any `enum` that works like a mixable flags, which usually combined using the `|` operator:
```C++
BEGIN_ENUM_ITEM_MERGABLE(MyEnum)
    ENUM_CLASS_ITEM(FirstItem)
    ENUM_CLASS_ITEM(SecondItem)
END_ENUM_ITEM(MyEnum)
```

For items in an `enum class`, use `ENUM_CLASS_ITEM` to list each member.

For items in an `enum`, use `ENUM_ITEM` to list each member.

If the `enum` (not `enum class`) is defined inside other type, use `ENUM_ITEM_NAMESPACE` to declare the type name, followed with `ENUM_NAMESPACE_ITEM` to list each member.

### Struct

Register a struct like this:
```C++
BEGIN_STRUCT_MEMBER(MyStruct)
    STRUCT_MEMBER(FirstField)
    STRUCT_MEMBER(SecondField)
END_STRUCT_MEMBER(MyStruct)
```

### Interface and Class

Register a class like this:
```C++
BEGIN_CLASS_MEMBER(MyClass)
    CLASS_MEMBER_FIELD(FirstField)
    CLASS_MEMBER_FIELD(SecondField)
END_CLASS_MEMBER(MyClass)
```

Register an interface like this:
```C++
BEGIN_INTERFACE_MEMBER(IMyInterface)
    CLASS_MEMBER_FIELD(FirstField)
    CLASS_MEMBER_FIELD(SecondField)
END_INTERFACE_MEMBER(IMyInterface)
```

Class and interface registration shares all macros mentioned below.

Using `BEGIN_INTERFACE_MEMBER` requires a proxy to EXIST in the header file, which means the interface could be inherited in Workflow script.

Using `BEGIN_INTERFACE_MEMBER_NOPROXY` requires a proxy to NOT EXIAST in the header file, which means the interface could not be inherited in Workflow script.

There is no constructor in an interface.

#### Base Class

Use `CLASS_MEMBER_BASE(name)` to declare all reflectable base classes.

#### Field

Use `CLASS_MEMBER_FIELD(name)` to declare all reflectable member fields.

#### Function Arguments

For constructors and methods, argument names are also required in the declaration.

When there is no argument, use `NO_PARAMETER` for the argument list.

When there are any argument, use `{ L"arg1" _ L"arg2" ... }` for the argument list.
Here `_` is a must have and should be defined as in the `.cpp` example.

#### Constructor and Overloading

Use `CLASS_MEMBER_CONSTRUCTOR(type, parameters)` to declare a constructor.
`type` is a function type with two choices, deciding whether the created instance by calling such constructor will be boxed in `Ptr<T>` or not:
  - `Ptr<Class>(types...)`
  - `Class*(types...)`

If we want to declare a constructor, but it is an ordinary function C++, we should use `CLASS_MEMBER_EXTERNALCTOR(type, parameters, source)`.
`source` is the name of the ordinary function.

#### Method and Overloading

Use `CLASS_MEMBER_METHOD(name, parameters)` to declare a method.

Use `CLASS_MEMBER_METHOD(new-name, name, parameters)` to declare a method and change its name in the metadata.

Use `CLASS_MEMBER_METHOD_OVERLOAD(name, parameter, function-type)` and `CLASS_MEMBER_METHOD_OVERLOAD_RENAME(new-name, name, parameter, function-type)` to declare an overloaded method.
`function-type` must be a pointer type to a member function.

Use `CLASS_MEMBER_EXTERNALMETHOD(name, parameters, function-type, source)` to declare a method but it is an ordinary function C++.
`function-type` must be a pointer type to a member function.
`source` is the name of the ordinary function.
By bringing an ordinary inside a class, the first parameter actually acts as the `this` pointer, so it should not appear in `parameters` or `function-type`.

#### Static Method and Overloading

Use `CLASS_METHOD_STATIC(name, parameters)` to declare a static method.

Use `CLASS_MEMBER_STATIC_METHOD_OVERLOAD(name, parameter, function-type)` and `CLASS_MEMBER_METHOD_OVERLOAD_RENAME(new-name, name, parameter, function-type)` to declare an overloaded method.
`function-type` must be a pointer type to an ordinary function.

Use `CLASS_MEMBER_STATIC_EXTERNALMETHOD(name, parameters, function-type, source)` to declare a method but it is an ordinary function C++.
`function-type` must be a pointer type to a member function.
`source` is the name of the ordinary function.

#### Event

There is no event in C++. But we could still register events for Workflow script.
An event is a member field of type `Event<T>`, offered in the `Vlpp` project.
Such field works as an event and we should not register it with `CLASS_MEMBER_FIELD`.

An event could be used to notify a property value changing,
in this case we can declare such fact in the property registration.

Use `CLASS_MEMBER_EVENT(name)` to register an event.

#### Property

There is no property in C++. But we could still register properties for Workflow script, and redirect its reading and writing to other members.

Use `CLASS_MEMBER_PROPERTY_READONLY(name, getter)` to register a readonly property.
`getter` should be the name of a registered method without parameter, to return the value of the property.

Use `CLASS_MEMBER_PROPERTY(name, getter, setter)` to register a readonly property.
`getter` should be the name of a registered method without parameter, to return the value of the property.
`getter` should be the name of a registered method one parameter, to change the value of the property.

If the getter is `GetX` and the property name is `X`,
we could replace one `CLASS_MEMBER_METHOD` and one `CLASS_MEMBER_PROPERTY_READONLY` with one single call: `CLASS_MEMBER_PROPERTY_READONLY_FAST(X)`.

If the getter is `GetX`, the setter is `SetX` and the property name is `X`,
we could replace two `CLASS_MEMBER_METHOD` and one `CLASS_MEMBER_PROPERTY_READONLY` with one single call: `CLASS_MEMBER_PROPERTY_FAST(X)`.

#### Property with Event

If the getter is `GetX`, the triggering event is `XChanged`, and the property name is `X`,
we could replace one `CLASS_MEMBER_METHOD` and one `CLASS_MEMBER_PROPERTY_READONLY` with one single call: `CLASS_MEMBER_PROPERTY_EVENT_READONLY_FAST(X)`.

If the getter is `GetX`, the setter is `SetX`, the triggering event is `XChanged` and the property name is `X`,
we could replace two `CLASS_MEMBER_METHOD` and one `CLASS_MEMBER_PROPERTY_READONLY` with one single call: `CLASS_MEMBER_PROPERTY_EVENT_FAST(X)`.

We should still call `CLASS_MEMBER_EVENT` before using `CLASS_MEMBER_PROPERTY_EVENT_READONLY_FAST` or `CLASS_MEMBER_PROPERTY_EVENT_FAST`.

### Interface Proxy

An interface proxy begins with the following macros and ends with `END_INTERFACE_PROXY(name)`:
  - `BEGIN_INTERFACE_PROXY_NOPARENT_RAWPTR(name)`: The interface does not implement other interface (`IDescriptable` doesn't count). When implementing such interface, it will be a raw C++ pointer.
  - `BEGIN_INTERFACE_PROXY_NOPARENT_SHAREDPTR(name)`: The interface does not implement other interface (`IDescriptable` doesn't count). When implementing such interface, it will be created and boxed in a `Ptr<T>`.
  - `BEGIN_INTERFACE_PROXY_RAWPTR(name, base-interfaces...)`: All reflectable base interfaces must be listed (`IDescriptable` doesn't count). When implementing such interface, it will be a raw C++ pointer.
  - `BEGIN_INTERFACE_PROXY_SHAREDPTR(name, base-interfaces...)`: All reflectable base interfaces must be listed (`IDescriptable` doesn't count). When implementing such interface, it will be created and boxed in a `Ptr<T>`.

Inside the proxy, there are functions that implements this interface. In each function implementation there will be only one line of code, from one of the following:
  - `INVOKE_INTERFACE_PROXY_NOPARAMS(function);`: The function returns void without argument.
  - `INVOKEGET_INTERFACE_PROXY_NOPARAMS(function);`: The function returns a value without argument.
  - `INVOKE_INTERFACE_PROXY(function, arguments...);`: The function returns void without argument.
  - `INVOKEGET_INTERFACE_PROXY(function, arguments...);`: The function returns a value without argument.

The `return` keyword is not necessary as `INVOKEGET_INTERFACE_PROXY_NOPARAMS` or `INVOKEGET_INTERFACE_PROXY` already take care of it.
