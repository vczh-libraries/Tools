# Using ComPtr for COM Objects

`ComPtr<T>` is designed for managing COM (Component Object Model) objects when working with Windows API. It provides automatic reference counting for COM interfaces through their `AddRef()` and `Release()` methods.

## Overview

`ComPtr<T>` is for:
- Managing COM objects and interfaces
- Windows API integration  
- Automatic COM reference counting via `IUnknown`

| Feature | `Ptr<T>` | `ComPtr<T>` |
|---------|----------|-------------|
| Purpose | General reference types | COM objects only |
| Platform | Cross-platform | Windows API only |
| Base Type | Must inherit from `Object` or `Interface` | Must implement `IUnknown` |

## Important Note

**Unlike ATL's `CComPtr`, `ComPtr<T>` cannot be used directly as `T**` or `void**`.** You must retrieve the raw pointer from COM APIs first, then construct a `ComPtr<T>` from it.

## Basic Usage

### Creating ComPtr<T>

```cpp
// Correct way: Get raw pointer first, then construct ComPtr
IMyComInterface* pInterface = nullptr;
HRESULT hr = SomeComApi(&pInterface);
if (SUCCEEDED(hr))
{
    ComPtr<IMyComInterface> comObject = pInterface;
    // pInterface is now managed by comObject
}

// Alternative: Direct construction
ComPtr<IMyComInterface> comObject = GetSomeComInterface();
```

### Checking if Empty

```cpp
ComPtr<IMyComInterface> comPtr;

// Using operator bool
if (comPtr)
{
    // comPtr contains a COM object
}

// Comparing with nullptr
if (comPtr == nullptr)
{
    // comPtr is empty
}
```

### Releasing

```cpp
comPtr = {};        // Method 1
comPtr = nullptr;   // Method 2
```

## Automatic Reference Counting

`ComPtr<T>` automatically handles `AddRef()` and `Release()` calls:

```cpp
{
    ComPtr<IMyComInterface> interface1 = GetComObject();
    ComPtr<IMyComInterface> interface2 = interface1;  // AddRef() called
    
    // Reference count is now 2
} // Both destructors call Release() automatically
```

## Windows API Integration

### DirectX Example

```cpp
ID3D11Device* pDevice = nullptr;
ID3D11DeviceContext* pContext = nullptr;

HRESULT hr = D3D11CreateDevice(
    nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr, 0,
    nullptr, 0, D3D11_SDK_VERSION,
    &pDevice, nullptr, &pContext
);

if (SUCCEEDED(hr))
{
    ComPtr<ID3D11Device> device = pDevice;
    ComPtr<ID3D11DeviceContext> context = pContext;
    // pDevice and pContext are now managed by ComPtr
}
```

### Querying Interfaces

```cpp
ComPtr<IUnknown> unknown = GetComObject();
IMySpecificInterface* pSpecific = nullptr;

HRESULT hr = unknown->QueryInterface(IID_IMySpecificInterface, 
                                   reinterpret_cast<void**>(&pSpecific));
if (SUCCEEDED(hr))
{
    ComPtr<IMySpecificInterface> specificInterface = pSpecific;
    // pSpecific is now managed by specificInterface
}
```

## Getting Raw Pointer

When you need to pass a raw pointer to APIs:

```cpp
ComPtr<IMyComInterface> comPtr = GetComObject();

// For APIs that don't transfer ownership
SomeApiThatDoesNotTakeOwnership(comPtr.Obj());

// For APIs that take ownership, manual AddRef needed
IMyComInterface* pForTransfer = comPtr.Obj();
if (pForTransfer)
{
    pForTransfer->AddRef();  // Manual AddRef for ownership transfer
    SomeApiThatTakesOwnership(pForTransfer);
}
```

## When to Use ComPtr<T>

Use `ComPtr<T>` when:
- Working with Windows COM interfaces
- Integrating with DirectX, Media Foundation, or COM-based Windows APIs
- You need automatic COM reference counting
- The object implements `IUnknown`

Use `Ptr<T>` for all other reference type management in Vlpp applications.