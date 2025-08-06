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

A reflectable class or interface must inherits from `public vl::reflection::Description<the class itself>`.
Use `AggregatableDescription` to allow a class being inherited in a Workflow script class.
Sub types of reflectable classes or interfaces do not automatically reflectable, it must uses `Description<T>` or `AggregatableDescription<T>`.

A type is reflectable only when it is registered.

## Type Registration

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

    BEGIN_INTERFACE_PROXY...(::my::namespaces::ISecond)
      ...
    END_INTERFACE_PROXY(::my::namespaces::ISecond)

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

### Struct

### Interface Proxy

### Interface and Class
