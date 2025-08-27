# Defining Global Storage Classes

Global storage in Vlpp provides a mechanism to manage global variables with explicit initialization and finalization to prevent memory leaks that would otherwise be undetected by memory leak detection tools. Global storage is particularly important when working with reference-counted objects that need to be cleaned up before the memory leak checker runs.

## Why Global Storage is Needed

Traditional global variables are destructed after `main()` exits, which causes `_CrtDumpMemoryLeaks()` to report false negatives for memory leaks. Global storage provides explicit control over initialization and finalization timing.

## Basic Global Storage Definition

### Simple Global Storage

```cpp
BEGIN_GLOBAL_STORAGE_CLASS(MyGlobalStorage)
    Ptr<SomeResource>       resource;
    WString                 configPath;
    vint                    maxConnections;

    INITIALIZE_GLOBAL_STORAGE_CLASS
        resource = Ptr(new SomeResource());
        configPath = L"config.xml";
        maxConnections = 100;

    FINALIZE_GLOBAL_STORAGE_CLASS
        resource = nullptr;
        configPath = WString::Empty;
        maxConnections = 0;

END_GLOBAL_STORAGE_CLASS(MyGlobalStorage)
```

### Accessing Global Storage

The macro automatically generates a `GetMyGlobalStorage()` function:

```cpp
void UseGlobalResource()
{
    // Check if initialized
    if (GetMyGlobalStorage().IsInitialized())
    {
        auto resource = GetMyGlobalStorage().resource;
        WString path = GetMyGlobalStorage().configPath;
        vint connections = GetMyGlobalStorage().maxConnections;
        
        // Use the global resources
    }
}
```

## Real-world Example

From the GacUI codebase, here's how global storage is used for workflow globals:

```cpp
BEGIN_GLOBAL_STORAGE_CLASS(vl_workflow_global_GuiUnitTestSnapshotViewer)
    vl_workflow_global::GuiUnitTestSnapshotViewer instance;
    
    INITIALIZE_GLOBAL_STORAGE_CLASS
        instance.__vwsn_ls_UnitTestSnapshotViewerStrings = 
            ::vl::reflection::description::IValueDictionary::Create();
        
        // Initialize localized strings
        ([]()
        {
            ::gaclib_controls::UnitTestSnapshotViewerStrings::Install(
                ::vl::__vwsn::Parse<::vl::Locale>(::vl::WString::Unmanaged(L"en-US")), 
                ::gaclib_controls::UnitTestSnapshotViewerStrings::__vwsn_ls_en_US_BuildStrings(
                    ::vl::__vwsn::Parse<::vl::Locale>(::vl::WString::Unmanaged(L"en-US"))));
        })();

    FINALIZE_GLOBAL_STORAGE_CLASS
        instance.__vwsn_ls_UnitTestSnapshotViewerStrings = nullptr;

END_GLOBAL_STORAGE_CLASS(vl_workflow_global_GuiUnitTestSnapshotViewer)
```

## Complex Initialization

### Multiple Resources

```cpp
BEGIN_GLOBAL_STORAGE_CLASS(ApplicationGlobals)
    Ptr<Logger>             logger;
    Ptr<ConfigManager>      config;
    Ptr<ResourceCache>      cache;
    List<Ptr<Plugin>>       plugins;

    INITIALIZE_GLOBAL_STORAGE_CLASS
        // Initialize in dependency order
        logger = Ptr(new Logger(L"application.log"));
        config = Ptr(new ConfigManager());
        config->Load(L"app.config");
        
        cache = Ptr(new ResourceCache(config->GetCacheSize()));
        
        // Load plugins
        auto pluginDir = config->GetPluginDirectory();
        auto pluginFiles = LoadPluginList(pluginDir);
        for (auto file : pluginFiles)
        {
            auto plugin = Ptr(new Plugin(file));
            if (plugin->Initialize())
            {
                plugins.Add(plugin);
            }
        }

    FINALIZE_GLOBAL_STORAGE_CLASS
        // Finalize in reverse dependency order
        for (auto plugin : plugins)
        {
            plugin->Shutdown();
        }
        plugins.Clear();
        
        cache = nullptr;
        config = nullptr;
        logger = nullptr;

END_GLOBAL_STORAGE_CLASS(ApplicationGlobals)
```

### Conditional Initialization

```cpp
BEGIN_GLOBAL_STORAGE_CLASS(DebugGlobals)
    Ptr<DebugRenderer>      renderer;
    Ptr<PerformanceCounter> perfCounter;
    bool                    debugMode;

    INITIALIZE_GLOBAL_STORAGE_CLASS
        debugMode = false;
        
#ifdef _DEBUG
        debugMode = true;
        renderer = Ptr(new DebugRenderer());
        perfCounter = Ptr(new PerformanceCounter());
        
        Console::WriteLine(L"Debug globals initialized");
#endif

    FINALIZE_GLOBAL_STORAGE_CLASS
#ifdef _DEBUG
        if (debugMode)
        {
            Console::WriteLine(L"Debug globals finalizing");
            renderer = nullptr;
            perfCounter = nullptr;
        }
#endif
        debugMode = false;

END_GLOBAL_STORAGE_CLASS(DebugGlobals)
```

## Lifecycle Management

### Checking Initialization State

```cpp
void SafeUseGlobals()
{
    if (!GetMyGlobalStorage().IsInitialized())
    {
        Console::WriteLine(L"Global storage not initialized");
        return;
    }
    
    // Safe to use global resources
    auto resource = GetMyGlobalStorage().resource;
    // ...
}
```

### Integration with Main Function

```cpp
int main(int argc, char** argv)
{
    try
    {
        // Your application logic here
        
        // Explicitly finalize global storage before memory leak check
        vl::FinalizeGlobalStorage();
        
#ifdef VCZH_CHECK_MEMORY_LEAKS
        _CrtDumpMemoryLeaks();
#endif
        return 0;
    }
    catch (const Exception& ex)
    {
        Console::WriteLine(L"Error: " + ex.Message());
        vl::FinalizeGlobalStorage();
        return -1;
    }
}
```

## Singleton Pattern Integration

### Global Storage as Singleton Container

```cpp
BEGIN_GLOBAL_STORAGE_CLASS(SingletonContainer)
    Ptr<DatabaseManager>    dbManager;
    Ptr<NetworkManager>     netManager;
    Ptr<UIManager>          uiManager;

    INITIALIZE_GLOBAL_STORAGE_CLASS
        dbManager = Ptr(new DatabaseManager());
        netManager = Ptr(new NetworkManager());
        uiManager = Ptr(new UIManager());

    FINALIZE_GLOBAL_STORAGE_CLASS
        uiManager = nullptr;
        netManager = nullptr;
        dbManager = nullptr;

END_GLOBAL_STORAGE_CLASS(SingletonContainer)

// Convenience functions
DatabaseManager& GetDatabaseManager()
{
    return *GetSingletonContainer().dbManager.Obj();
}

NetworkManager& GetNetworkManager()
{
    return *GetSingletonContainer().netManager.Obj();
}

UIManager& GetUIManager()
{
    return *GetSingletonContainer().uiManager.Obj();
}
```

## Best Practices

### 1. Initialization Order

```cpp
BEGIN_GLOBAL_STORAGE_CLASS(OrderedGlobals)
    Ptr<Foundation>     foundation;     // Initialize first
    Ptr<Service>        service;        // Depends on foundation
    Ptr<Application>    application;    // Depends on service

    INITIALIZE_GLOBAL_STORAGE_CLASS
        // Initialize in dependency order
        foundation = Ptr(new Foundation());
        service = Ptr(new Service(foundation.Obj()));
        application = Ptr(new Application(service.Obj()));

    FINALIZE_GLOBAL_STORAGE_CLASS
        // Finalize in reverse order
        application = nullptr;
        service = nullptr;
        foundation = nullptr;

END_GLOBAL_STORAGE_CLASS(OrderedGlobals)
```

### 2. Error Handling in Initialization

```cpp
BEGIN_GLOBAL_STORAGE_CLASS(SafeGlobals)
    Ptr<CriticalResource>   resource;
    bool                    initSuccess;

    INITIALIZE_GLOBAL_STORAGE_CLASS
        initSuccess = false;
        try
        {
            resource = Ptr(new CriticalResource());
            resource->Initialize();
            initSuccess = true;
        }
        catch (const Exception& ex)
        {
            Console::WriteLine(L"Failed to initialize global resource: " + ex.Message());
            resource = nullptr;
        }

    FINALIZE_GLOBAL_STORAGE_CLASS
        if (resource)
        {
            resource->Cleanup();
            resource = nullptr;
        }
        initSuccess = false;

END_GLOBAL_STORAGE_CLASS(SafeGlobals)
```

### 3. Thread Safety Considerations

```cpp
BEGIN_GLOBAL_STORAGE_CLASS(ThreadSafeGlobals)
    CriticalSection         lock;
    Ptr<SharedResource>     resource;

    INITIALIZE_GLOBAL_STORAGE_CLASS
        // CriticalSection is initialized automatically
        resource = Ptr(new SharedResource());

    FINALIZE_GLOBAL_STORAGE_CLASS
        CS_LOCK(lock)
        {
            resource = nullptr;
        }
        // CriticalSection is finalized automatically

END_GLOBAL_STORAGE_CLASS(ThreadSafeGlobals)

// Thread-safe access
void UseSharedResource()
{
    if (!GetThreadSafeGlobals().IsInitialized()) return;
    
    CS_LOCK(GetThreadSafeGlobals().lock)
    {
        if (GetThreadSafeGlobals().resource)
        {
            GetThreadSafeGlobals().resource->DoSomething();
        }
    }
}
```

## Important Notes

- **Not Recommended**: Global storage should be used sparingly and only when necessary
- **Explicit Cleanup**: Always call `vl::FinalizeGlobalStorage()` before memory leak checking
- **Dependency Order**: Initialize in dependency order, finalize in reverse order
- **Error Handling**: Consider initialization failures and provide appropriate error handling
- **Thread Safety**: Add synchronization if the global storage will be accessed from multiple threads

Global storage provides a controlled way to manage global state while maintaining proper memory management and leak detection capabilities.