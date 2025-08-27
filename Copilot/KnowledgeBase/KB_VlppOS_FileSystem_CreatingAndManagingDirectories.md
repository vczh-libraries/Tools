# Creating and Managing Directories

The `Folder` class in VlppOS provides comprehensive directory management capabilities including creation, deletion, and basic operations. Directory creation can be done recursively to create entire directory paths.

## Creating Directories

### Basic Directory Creation

Use the `Create()` method to create a directory:

```cpp
using namespace vl::filesystem;

Folder folder(L"/path/to/new/directory");

// Create directory (non-recursive - parent must exist)
bool success = folder.Create(false);
if (success)
{
    Console::WriteLine(L"Directory created successfully");
}
else
{
    Console::WriteLine(L"Failed to create directory - parent may not exist");
}
```

### Recursive Directory Creation

Create directories recursively, including all intermediate directories:

```cpp
Folder folder(L"/path/to/deeply/nested/directory");

// Create all necessary parent directories
bool success = folder.Create(true);
if (success)
{
    Console::WriteLine(L"Directory path created successfully");
}
else
{
    Console::WriteLine(L"Failed to create directory path");
}
```

## Safe Directory Operations

Always check if directories exist before creating them:

```cpp
void SafeCreateDirectory(const WString& path, bool recursive = true)
{
    Folder folder(path);
    
    if (folder.Exists())
    {
        Console::WriteLine(L"Directory already exists: " + path);
        return;
    }
    
    if (folder.Create(recursive))
    {
        Console::WriteLine(L"Successfully created directory: " + path);
    }
    else
    {
        if (recursive)
        {
            Console::WriteLine(L"Failed to create directory path: " + path);
        }
        else
        {
            Console::WriteLine(L"Failed to create directory (parent may not exist): " + path);
        }
    }
}
```

## Directory Management Patterns

### Ensure Directory Exists

A common pattern to ensure a directory exists before using it:

```cpp
Folder EnsureDirectory(const WString& path)
{
    Folder folder(path);
    
    if (!folder.Exists())
    {
        if (!folder.Create(true))
        {
            Console::WriteLine(L"Warning: Could not create directory " + path);
        }
    }
    
    return folder;
}

// Usage
Folder outputDir = EnsureDirectory(L"/tmp/application/output");
if (outputDir.Exists())
{
    // Safe to use the directory
    Console::WriteLine(L"Output directory ready: " + outputDir.GetFilePath().GetFullPath());
}
```

### Temporary Directory Creation

Create temporary directories with cleanup:

```cpp
class TemporaryDirectory : public Object
{
private:
    Folder tempFolder;
    bool shouldCleanup;

public:
    TemporaryDirectory(const WString& basePath, const WString& name)
        : shouldCleanup(false)
    {
        FilePath tempPath = FilePath(basePath) / name;
        tempFolder = Folder(tempPath);
        
        if (tempFolder.Create(true))
        {
            shouldCleanup = true;
            Console::WriteLine(L"Created temporary directory: " + tempPath.GetFullPath());
        }
    }
    
    ~TemporaryDirectory()
    {
        if (shouldCleanup && tempFolder.Exists())
        {
            if (tempFolder.Delete(true))
            {
                Console::WriteLine(L"Cleaned up temporary directory");
            }
        }
    }
    
    const Folder& GetFolder() const
    {
        return tempFolder;
    }
    
    bool IsValid() const
    {
        return shouldCleanup && tempFolder.Exists();
    }
};

// Usage
{
    TemporaryDirectory tempDir(L"/tmp", L"myapp_temp");
    if (tempDir.IsValid())
    {
        // Use temporary directory
        Folder workDir = tempDir.GetFolder();
        // ... do work ...
    }
} // Automatic cleanup when goes out of scope
```

## Working with Directory Hierarchies

### Create Directory Structure

Create a predefined directory structure:

```cpp
void CreateApplicationDirectories(const WString& appBasePath)
{
    WString dirs[] = {
        L"config",
        L"data",
        L"logs",
        L"temp",
        L"output",
        L"cache"
    };
    
    for (vint i = 0; i < sizeof(dirs) / sizeof(dirs[0]); i++)
    {
        FilePath dirPath = FilePath(appBasePath) / dirs[i];
        Folder dir(dirPath);
        
        if (!dir.Exists())
        {
            if (dir.Create(true))
            {
                Console::WriteLine(L"Created: " + dirPath.GetFullPath());
            }
            else
            {
                Console::WriteLine(L"Failed to create: " + dirPath.GetFullPath());
            }
        }
    }
}
```

### Directory Tree Creation

Create complex directory trees:

```cpp
void CreateProjectStructure(const WString& projectPath, const WString& projectName)
{
    // Create base project directory
    Folder projectDir(FilePath(projectPath) / projectName);
    if (!projectDir.Create(true))
    {
        Console::WriteLine(L"Failed to create project directory");
        return;
    }
    
    // Create subdirectories
    WString subdirs[] = {
        L"src",
        L"include", 
        L"tests",
        L"docs",
        L"build/debug",
        L"build/release",
        L"external/libs",
        L"external/tools"
    };
    
    for (vint i = 0; i < sizeof(subdirs) / sizeof(subdirs[0]); i++)
    {
        FilePath subPath = projectDir.GetFilePath() / subdirs[i];
        Folder subDir(subPath);
        
        if (subDir.Create(true))
        {
            Console::WriteLine(L"? " + subdirs[i]);
        }
        else
        {
            Console::WriteLine(L"? " + subdirs[i]);
        }
    }
}
```

## Error Handling and Validation

### Comprehensive Directory Creation with Error Handling

```cpp
enum class CreateDirectoryResult
{
    Success,
    AlreadyExists,
    ParentNotFound,
    PermissionDenied,
    UnknownError
};

CreateDirectoryResult CreateDirectoryWithResult(const WString& path, bool recursive)
{
    Folder folder(path);
    
    // Check if already exists
    if (folder.Exists())
    {
        return CreateDirectoryResult::AlreadyExists;
    }
    
    // Check parent exists for non-recursive creation
    if (!recursive)
    {
        Folder parent(folder.GetFilePath().GetFolder());
        if (!parent.Exists())
        {
            return CreateDirectoryResult::ParentNotFound;
        }
    }
    
    // Attempt creation
    if (folder.Create(recursive))
    {
        return CreateDirectoryResult::Success;
    }
    
    return CreateDirectoryResult::UnknownError;
}

void HandleDirectoryCreation(const WString& path, bool recursive = true)
{
    auto result = CreateDirectoryWithResult(path, recursive);
    
    switch (result)
    {
    case CreateDirectoryResult::Success:
        Console::WriteLine(L"Directory created: " + path);
        break;
    case CreateDirectoryResult::AlreadyExists:
        Console::WriteLine(L"Directory already exists: " + path);
        break;
    case CreateDirectoryResult::ParentNotFound:
        Console::WriteLine(L"Parent directory not found: " + path);
        break;
    case CreateDirectoryResult::PermissionDenied:
        Console::WriteLine(L"Permission denied: " + path);
        break;
    case CreateDirectoryResult::UnknownError:
        Console::WriteLine(L"Unknown error creating: " + path);
        break;
    }
}
```

## Best Practices

### Directory Path Construction

Use `FilePath` for proper path construction:

```cpp
// Recommended: Use FilePath for path operations
FilePath basePath(L"/home/user/projects");
FilePath projectPath = basePath / L"myproject" / L"src";
Folder srcDir(projectPath);

// Avoid: Manual string concatenation
// WString wrongPath = L"/home/user/projects" + L"/" + L"myproject" + L"/" + L"src";
```

### Validation Before Creation

```cpp
bool IsValidDirectoryName(const WString& name)
{
    // Basic validation - extend as needed
    if (name.Length() == 0) return false;
    if (name.Contains(L"\\") || name.Contains(L"/")) return false;
    if (name == L"." || name == L"..") return false;
    return true;
}

bool CreateValidatedDirectory(const WString& basePath, const WString& dirName)
{
    if (!IsValidDirectoryName(dirName))
    {
        Console::WriteLine(L"Invalid directory name: " + dirName);
        return false;
    }
    
    FilePath fullPath = FilePath(basePath) / dirName;
    Folder folder(fullPath);
    
    return folder.Create(true);
}
```

## Important Notes

- **Recursive Parameter**: `Create(true)` creates all intermediate directories, `Create(false)` only creates the final directory
- **Asynchronous Behavior**: Directory creation may not be immediately visible after the function returns
- **Cross-Platform**: Path separators are handled automatically across Windows, Linux, and macOS
- **Permissions**: Directory creation may fail due to insufficient permissions
- **Return Values**: Always check the boolean return value to verify successful creation
- **Thread Safety**: Directory operations are not inherently thread-safe