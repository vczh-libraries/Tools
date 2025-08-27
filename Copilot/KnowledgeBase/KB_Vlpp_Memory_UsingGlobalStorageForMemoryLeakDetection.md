# Using Global Storage for Memory Leak Detection

Global storage is essential for effective memory leak detection in Vlpp applications. This guideline explains how to properly use global storage to ensure that memory leak detection tools like `_CrtDumpMemoryLeaks()` can accurately identify real memory leaks without false positives from global variables.

## The Memory Leak Detection Problem

### Why Global Variables Cause False Negatives

```cpp
// PROBLEMATIC: Traditional global variables
Ptr<SomeResource> globalResource = Ptr(new SomeResource());  // Memory allocated
Dictionary<WString, Ptr<Data>> globalCache;                   // Memory allocated

int main(int argc, char** argv)
{
    // Application logic...
    
    // Check for memory leaks
    vl::FinalizeGlobalStorage();
#ifdef VCZH_CHECK_MEMORY_LEAKS
    _CrtDumpMemoryLeaks();  // FALSE NEGATIVE: Global variables not yet destructed
#endif
    return 0;
}
// Global variables destructed HERE - after memory leak check!
```

The problem is that global variables are destructed after `main()` exits, so the memory leak checker runs before they're cleaned up, causing false leak reports.

## The Global Storage Solution

### Memory Leak Detection Pattern

```cpp
// CORRECT: Using global storage for leak detection
BEGIN_GLOBAL_STORAGE_CLASS(ApplicationGlobals)
    Ptr<SomeResource>                   resource;
    Dictionary<WString, Ptr<Data>>      cache;

    INITIALIZE_GLOBAL_STORAGE_CLASS
        resource = Ptr(new SomeResource());
        // cache is initialized automatically

    FINALIZE_GLOBAL_STORAGE_CLASS
        resource = nullptr;
        cache.Clear();  // Explicitly clear all cached data

END_GLOBAL_STORAGE_CLASS(ApplicationGlobals)

int main(int argc, char** argv)
{
    // Application logic...
    
    // Explicitly finalize before memory leak check
    vl::FinalizeGlobalStorage();  // Cleans up global storage NOW
    
#ifdef VCZH_CHECK_MEMORY_LEAKS
    _CrtDumpMemoryLeaks();  // Accurate leak detection
#endif
    return 0;
}
```

## Complete Memory Leak Detection Setup

### Main Function Template

```cpp
#ifdef VCZH_MSVC
int wmain(int argc, wchar_t** argv)
#else
int main(int argc, char** argv)
#endif
{
    int result = 0;
    
    try
    {
        // Initialize global storage (if needed)
        // Global storage is automatically initialized on first access
        
        // Your application logic here
        result = RunApplication(argc, argv);
    }
    catch (const Exception& ex)
    {
        Console::WriteLine(L"Application error: " + ex.Message());
        result = -1;
    }
    catch (...)
    {
        Console::WriteLine(L"Unknown error occurred");
        result = -1;
    }
    
    // Critical: Finalize global storage before memory leak check
    vl::FinalizeGlobalStorage();
    
#ifdef VCZH_CHECK_MEMORY_LEAKS
    _CrtDumpMemoryLeaks();
#endif
    
    return result;
}
```

### Unit Test Integration

From the GacUI unit test framework:

```cpp
int main(int argc, char** argv)
{
    int result = unittest::UnitTest::RunAndDisposeTests(argc, argv);
    
    // Finalize global storage before leak check
    vl::FinalizeGlobalStorage();
    
#ifdef VCZH_CHECK_MEMORY_LEAKS
    _CrtDumpMemoryLeaks();
#endif
    
    return result;
}
```

## Managing Complex Global Dependencies

### Layered Global Storage

```cpp
// Layer 1: Core systems
BEGIN_GLOBAL_STORAGE_CLASS(CoreGlobals)
    Ptr<Logger>             logger;
    Ptr<MemoryManager>      memoryManager;

    INITIALIZE_GLOBAL_STORAGE_CLASS
        memoryManager = Ptr(new MemoryManager());
        logger = Ptr(new Logger(L"app.log"));

    FINALIZE_GLOBAL_STORAGE_CLASS
        logger = nullptr;
        memoryManager = nullptr;

END_GLOBAL_STORAGE_CLASS(CoreGlobals)

// Layer 2: Application systems (depends on core)
BEGIN_GLOBAL_STORAGE_CLASS(AppGlobals)
    Ptr<ConfigManager>      config;
    Ptr<ResourceManager>    resources;
    Ptr<PluginManager>      plugins;

    INITIALIZE_GLOBAL_STORAGE_CLASS
        // Ensure core is initialized first
        auto& core = GetCoreGlobals();
        
        config = Ptr(new ConfigManager(core.logger.Obj()));
        resources = Ptr(new ResourceManager(core.memoryManager.Obj()));
        plugins = Ptr(new PluginManager(config.Obj()));

    FINALIZE_GLOBAL_STORAGE_CLASS
        plugins = nullptr;
        resources = nullptr;
        config = nullptr;
        // Core globals finalized separately

END_GLOBAL_STORAGE_CLASS(AppGlobals)
```

### Cleanup Order Management

```cpp
void SafeFinalize()
{
    try
    {
        // Finalize in reverse dependency order
        Console::WriteLine(L"Finalizing application globals...");
        
        // This will trigger AppGlobals finalization
        GetAppGlobals().IsInitialized();  // Force finalization check
        
        Console::WriteLine(L"Finalizing core globals...");
        
        // This will trigger CoreGlobals finalization
        GetCoreGlobals().IsInitialized();  // Force finalization check
        
        Console::WriteLine(L"Finalizing all remaining global storage...");
        vl::FinalizeGlobalStorage();  // Clean up everything
    }
    catch (const Exception& ex)
    {
        Console::WriteLine(L"Error during finalization: " + ex.Message());
    }
}

int main(int argc, char** argv)
{
    int result = RunApplication(argc, argv);
    
    SafeFinalize();
    
#ifdef VCZH_CHECK_MEMORY_LEAKS
    _CrtDumpMemoryLeaks();
#endif
    
    return result;
}
```

## Debugging Memory Leaks with Global Storage

### Adding Debug Information

```cpp
BEGIN_GLOBAL_STORAGE_CLASS(DebugGlobals)
    Dictionary<WString, Ptr<Object>>    trackedObjects;
    vint                                allocationCount;
    bool                                debugMode;

    INITIALIZE_GLOBAL_STORAGE_CLASS
#ifdef _DEBUG
        debugMode = true;
        allocationCount = 0;
        Console::WriteLine(L"Debug tracking enabled");
#else
        debugMode = false;
#endif

    FINALIZE_GLOBAL_STORAGE_CLASS
        if (debugMode)
        {
            Console::WriteLine(L"Finalizing debug globals...");
            Console::WriteLine(L"Tracked objects: " + itow(trackedObjects.Count()));
            Console::WriteLine(L"Total allocations: " + itow(allocationCount));
            
            // Report any remaining tracked objects
            for (auto [key, obj] : trackedObjects)
            {
                Console::WriteLine(L"Leaked object: " + key);
            }
            
            trackedObjects.Clear();
        }

END_GLOBAL_STORAGE_CLASS(DebugGlobals)

// Helper functions for debugging
void TrackObject(const WString& name, Ptr<Object> obj)
{
#ifdef _DEBUG
    if (GetDebugGlobals().debugMode)
    {
        GetDebugGlobals().trackedObjects.Set(name, obj);
        GetDebugGlobals().allocationCount++;
    }
#endif
}

void UntrackObject(const WString& name)
{
#ifdef _DEBUG
    if (GetDebugGlobals().debugMode)
    {
        GetDebugGlobals().trackedObjects.Remove(name);
    }
#endif
}
```

### Leak Detection with Categories

```cpp
BEGIN_GLOBAL_STORAGE_CLASS(LeakTracker)
    Group<WString, Ptr<Object>>         objectsByCategory;
    Dictionary<WString, vint>           allocationsByCategory;

    INITIALIZE_GLOBAL_STORAGE_CLASS
        // Categories initialized automatically

    FINALIZE_GLOBAL_STORAGE_CLASS
        // Report leaks by category
        for (auto category : objectsByCategory.Keys())
        {
            auto objects = objectsByCategory[category];
            if (objects.Count() > 0)
            {
                Console::WriteLine(L"Category '" + category + L"' has " + 
                                 itow(objects.Count()) + L" leaked objects");
                
                for (auto obj : objects)
                {
                    // Additional debug information if available
                }
            }
        }
        
        objectsByCategory.Clear();
        allocationsByCategory.Clear();

END_GLOBAL_STORAGE_CLASS(LeakTracker)
```

## Best Practices for Memory Leak Detection

### 1. Always Finalize Before Leak Check

```cpp
// CORRECT: Finalize global storage first
int main()
{
    RunApplication();
    vl::FinalizeGlobalStorage();  // Must come before leak check
#ifdef VCZH_CHECK_MEMORY_LEAKS
    _CrtDumpMemoryLeaks();
#endif
    return 0;
}
```

### 2. Handle Exceptions During Finalization

```cpp
int main()
{
    int result = 0;
    try
    {
        result = RunApplication();
    }
    catch (...)
    {
        result = -1;
    }
    
    // Always finalize, even if exceptions occurred
    try
    {
        vl::FinalizeGlobalStorage();
    }
    catch (const Exception& ex)
    {
        Console::WriteLine(L"Error during finalization: " + ex.Message());
    }
    
#ifdef VCZH_CHECK_MEMORY_LEAKS
    _CrtDumpMemoryLeaks();
#endif
    
    return result;
}
```

### 3. Use RAII for Global Resources

```cpp
BEGIN_GLOBAL_STORAGE_CLASS(FileGlobals)
    Ptr<LogFile>                        logFile;

    INITIALIZE_GLOBAL_STORAGE_CLASS
        logFile = Ptr(new LogFile(L"application.log"));
        if (!logFile->IsOpen())
        {
            throw Exception(L"Failed to open log file");
        }

    FINALIZE_GLOBAL_STORAGE_CLASS
        if (logFile)
        {
            logFile->Flush();
            logFile->Close();
            logFile = nullptr;
        }

END_GLOBAL_STORAGE_CLASS(FileGlobals)
```

### 4. Document Global Dependencies

```cpp
// Dependencies: This global storage depends on CoreGlobals being initialized
BEGIN_GLOBAL_STORAGE_CLASS(HighLevelGlobals)
    // Ensure CoreGlobals is mentioned in documentation
    Ptr<UISystem>                       ui;          // Depends on CoreGlobals.logger
    Ptr<NetworkSystem>                  network;     // Depends on CoreGlobals.memoryManager

    INITIALIZE_GLOBAL_STORAGE_CLASS
        // Explicit dependency check
        if (!GetCoreGlobals().IsInitialized())
        {
            throw Exception(L"CoreGlobals must be initialized before HighLevelGlobals");
        }
        
        ui = Ptr(new UISystem(GetCoreGlobals().logger.Obj()));
        network = Ptr(new NetworkSystem(GetCoreGlobals().memoryManager.Obj()));

    FINALIZE_GLOBAL_STORAGE_CLASS
        network = nullptr;
        ui = nullptr;

END_GLOBAL_STORAGE_CLASS(HighLevelGlobals)
```

## Integration with CI/CD

### Automated Leak Detection

```cpp
#ifdef AUTOMATED_TESTING
int main(int argc, char** argv)
{
    int result = RunTests(argc, argv);
    
    // Capture leak detection output
    std::ostringstream leakOutput;
    auto oldBuffer = std::cerr.rdbuf(leakOutput.rdbuf());
    
    vl::FinalizeGlobalStorage();
    
#ifdef VCZH_CHECK_MEMORY_LEAKS
    _CrtDumpMemoryLeaks();
#endif
    
    std::cerr.rdbuf(oldBuffer);
    
    // Check if any leaks were detected
    std::string leaks = leakOutput.str();
    if (!leaks.empty())
    {
        std::cerr << "MEMORY LEAKS DETECTED:\n" << leaks << std::endl;
        return -1;  // Fail the build
    }
    
    return result;
}
#endif
```

By following these patterns, you can ensure that memory leak detection works accurately and reliably in your Vlpp applications, catching real leaks while avoiding false positives from global variables.