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

## Important Notes

- **Recursive Parameter**: `Create(true)` creates all intermediate directories, `Create(false)` only creates the final directory
- **Asynchronous Behavior**: Directory creation may not be immediately visible after the function returns
- **Cross-Platform**: Path separators are handled automatically across Windows, Linux, and macOS
- **Permissions**: Directory creation may fail due to insufficient permissions
- **Return Values**: Always check the boolean return value to verify successful creation
- **Thread Safety**: Directory operations are not inherently thread-safe