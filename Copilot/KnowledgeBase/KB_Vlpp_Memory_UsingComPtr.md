# Using ComPtr for COM Objects

`ComPtr<T>` is similar to `Ptr<T>` but specifically designed for managing COM (Component Object Model) objects when working with Windows API. It provides automatic reference counting for COM interfaces through their `AddRef()` and `Release()` methods.

## Overview

`ComPtr<T>` serves the same purpose as `Ptr<T>` but is specifically designed for:
- Managing COM objects and interfaces
- Windows API integration
- Automatic COM reference counting via `IUnknown`

## Key Differences from Ptr<T>

| Feature | `Ptr<T>` | `ComPtr<T>` |
|---------|----------|-------------|
| Purpose | General reference types | COM objects only |
| Platform | Cross-platform | Windows API only |
| Base Type | Must inherit from `Object` or `Interface` | Must implement `IUnknown` |
| Memory Management | Reference counting | COM reference counting |

## Important Usage Notes

**Unlike ATL's `CComPtr`, `ComPtr<T>` cannot be used directly as `T**` or `void**`.** You must retrieve the raw pointer from COM APIs first, then construct a `ComPtr<T>` from it.

## Basic Usage

### Creating a ComPtr<T>

```cpp
// Correct way: Get raw pointer first, then construct ComPtr
IMyComInterface* pInterface = nullptr;
HRESULT hr = SomeComApi(&pInterface);
if (SUCCEEDED(hr))
{
    ComPtr<IMyComInterface> comObject = pInterface;
    // Use the COM object
    // pInterface is now managed by comObject, don't call Release() manually
}

// Alternative: Direct construction from function that returns raw pointer
ComPtr<IMyComInterface> comObject = GetSomeComInterface();
```

### Checking if ComPtr<T> is Empty

Similar to `Ptr<T>`, you can check if a `ComPtr<T>` is empty:

```cpp
ComPtr<IMyComInterface> comPtr;

// Method 1: Using operator bool
if (comPtr)
{
    // comPtr contains a COM object
}

// Method 2: Comparing with nullptr
if (comPtr == nullptr)
{
    // comPtr is empty
}
```

### Releasing a ComPtr<T>

To release a `ComPtr<T>`:

```cpp
comPtr = {};        // Method 1
comPtr = nullptr;   // Method 2
```

## COM Interface Management

### Automatic Reference Counting

`ComPtr<T>` automatically handles `AddRef()` and `Release()` calls:

```cpp
{
    ComPtr<IMyComInterface> interface1 = GetComObject();
    ComPtr<IMyComInterface> interface2 = interface1;  // AddRef() called automatically
    
    // Both interface1 and interface2 point to the same COM object
    // Reference count is now 2
} // Both destructors call Release() automatically
```

### Querying Interfaces

```cpp
ComPtr<IUnknown> unknown = GetComObject();
IMySpecificInterface* pSpecific = nullptr;

// Query for a specific interface
HRESULT hr = unknown->QueryInterface(IID_IMySpecificInterface, 
                                   reinterpret_cast<void**>(&pSpecific));
if (SUCCEEDED(hr))
{
    ComPtr<IMySpecificInterface> specificInterface = pSpecific;
    // Use the specific interface
    // pSpecific is now managed by specificInterface, don't call Release() manually
}
```

## Integration with Windows API

### Working with DirectX

```cpp
// Correct way: Get raw pointers first, then construct ComPtr
ID3D11Device* pDevice = nullptr;
ID3D11DeviceContext* pContext = nullptr;

HRESULT hr = D3D11CreateDevice(
    nullptr,
    D3D_DRIVER_TYPE_HARDWARE,
    nullptr,
    0,
    nullptr,
    0,
    D3D11_SDK_VERSION,
    &pDevice,
    nullptr,
    &pContext
);

if (SUCCEEDED(hr))
{
    ComPtr<ID3D11Device> device = pDevice;
    ComPtr<ID3D11DeviceContext> context = pContext;
    // Use DirectX device and context
    // pDevice and pContext are now managed by ComPtr, don't call Release() manually
}
```

## Best Practices

### RAII Pattern

```cpp
class MyComWrapper
{
private:
    ComPtr<IMyComInterface> m_interface;
    
public:
    MyComWrapper()
    {
        IMyComInterface* pInterface = nullptr;
        HRESULT hr = CreateMyComObject(&pInterface);
        if (FAILED(hr))
        {
            throw Exception(L"Failed to create COM object");
        }
        m_interface = pInterface;
    }
    
    // Destructor automatically releases COM object
    ~MyComWrapper() = default;
    
    void DoSomething()
    {
        if (m_interface)
        {
            m_interface->SomeMethod();
        }
    }
};
```

### Error Handling

```cpp
ComPtr<IMyComInterface> CreateComObject()
{
    IMyComInterface* pInterface = nullptr;
    HRESULT hr = SomeApiCall(&pInterface);
    
    if (FAILED(hr))
    {
        throw Exception(L"COM object creation failed: " + itow(hr));
    }
    
    return ComPtr<IMyComInterface>(pInterface);
}
```

### Getting Raw Pointer from ComPtr<T>

When you need to pass a raw pointer to APIs that don't transfer ownership:

```cpp
ComPtr<IMyComInterface> comPtr = GetComObject();

// Get raw pointer for APIs that don't transfer ownership
SomeApiThatDoesNotTakeOwnership(comPtr.Obj());

// For APIs that do take ownership, you need to AddRef manually
IMyComInterface* pForTransfer = comPtr.Obj();
if (pForTransfer)
{
    pForTransfer->AddRef();  // Manual AddRef since ownership is being transferred
    SomeApiThatTakesOwnership(pForTransfer);
}
```

## Platform Considerations

- `ComPtr<T>` is only available on Windows
- It's designed specifically for Windows API integration
- For cross-platform code, use `Ptr<T>` with appropriate platform abstractions

## When to Use ComPtr<T>

Use `ComPtr<T>` when:
- Working with Windows COM interfaces
- Integrating with DirectX, Media Foundation, or other COM-based Windows APIs
- You need automatic COM reference counting
- The object implements `IUnknown`

Use `Ptr<T>` for all other reference type management in Vlpp applications.