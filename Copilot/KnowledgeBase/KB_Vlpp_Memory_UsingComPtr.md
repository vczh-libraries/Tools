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

## Basic Usage

### Creating a ComPtr<T>

```cpp
// Assuming you have a COM interface
ComPtr<IMyComInterface> comObject;

// Get COM object from factory or API
if (SUCCEEDED(SomeComApi(&comObject)))
{
    // Use the COM object
}
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
}
```

## Integration with Windows API

### Working with DirectX

```cpp
ComPtr<ID3D11Device> device;
ComPtr<ID3D11DeviceContext> context;

HRESULT hr = D3D11CreateDevice(
    nullptr,
    D3D_DRIVER_TYPE_HARDWARE,
    nullptr,
    0,
    nullptr,
    0,
    D3D11_SDK_VERSION,
    &device,
    nullptr,
    &context
);

if (SUCCEEDED(hr))
{
    // Use DirectX device and context
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
        HRESULT hr = CreateMyComObject(&m_interface);
        if (FAILED(hr))
        {
            throw Exception(L"Failed to create COM object");
        }
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
    ComPtr<IMyComInterface> result;
    HRESULT hr = SomeApiCall(&result);
    
    if (FAILED(hr))
    {
        throw Exception(L"COM object creation failed: " + itow(hr));
    }
    
    return result;
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