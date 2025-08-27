# Working with Root Directories

Root directories have special behavior in VlppOS and differ significantly between platforms. The `Folder` class provides specific support for working with root directories and understanding the file system hierarchy.

## Understanding Root Directories

### Creating Root Directory References

The default constructor creates a reference to the root directory:

```cpp
using namespace vl::filesystem;

// Create root directory reference
Folder rootFolder;  // Default constructor creates root folder

// Check if it's root
FilePath rootPath = rootFolder.GetFilePath();
if (rootPath.IsRoot())
{
    Console::WriteLine(L"This is the root directory");
    Console::WriteLine(L"Root path: " + rootPath.GetFullPath());
}
```

### Platform-Specific Root Behavior

Root directories behave differently on different operating systems:

```cpp
void ExploreRootDirectory()
{
    Folder rootFolder;
    List<Folder> rootContents;
    
    if (rootFolder.GetFolders(rootContents))
    {
        Console::WriteLine(L"Root directory contents:");
        for (vint i = 0; i < rootContents.Count(); i++)
        {
            Console::WriteLine(L"  " + rootContents[i].GetFilePath().GetFullPath());
        }
    }
    
    // On Windows: Lists drives like "C:", "D:", "E:", etc.
    // On Linux/macOS: Lists directories under "/" like "bin", "usr", "home", etc.
}
```

## Path Resolution and Navigation

### Absolute vs Relative Paths

```cpp
void DemonstratePathResolution()
{
    // Absolute paths
    FilePath absolutePath(L"/usr/local/bin");  // Unix-style
    FilePath windowsPath(L"C:\\Program Files"); // Windows-style
    
    Console::WriteLine(L"Absolute path 1: " + absolutePath.GetFullPath());
    Console::WriteLine(L"Absolute path 2: " + windowsPath.GetFullPath());
    
    // Relative paths are resolved to absolute
    FilePath relativePath(L"../documents");
    Console::WriteLine(L"Resolved relative: " + relativePath.GetFullPath());
    
    // Current directory
    FilePath currentPath(L".");
    Console::WriteLine(L"Current directory: " + currentPath.GetFullPath());
    
    // Parent directory
    FilePath parentPath(L"..");
    Console::WriteLine(L"Parent directory: " + parentPath.GetFullPath());
}
```

## Important Notes

- **Platform Differences**: Root behavior varies significantly between Windows (multiple drive roots) and Unix-like systems (single "/" root)
- **Default Constructor**: `Folder()` always creates a root directory reference
- **Path Resolution**: Relative paths like "." and ".." are automatically resolved to absolute paths
- **Drive Access**: On Windows, drives may exist but not be accessible (e.g., removable media not inserted)
- **Permissions**: Root directory operations may require elevated permissions on some systems
- **Cross-Platform Code**: Use `FilePath::IsRoot()` to write platform-independent code for root detection