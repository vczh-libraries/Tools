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

## Working with Drives (Windows)

On Windows, drives are treated as folders under the root:

```cpp
void ListWindowsDrives()
{
    Folder rootFolder;
    List<Folder> drives;
    
    bool success = rootFolder.GetFolders(drives);
    if (success)
    {
        Console::WriteLine(L"Available drives:");
        for (vint i = 0; i < drives.Count(); i++)
        {
            WString drivePath = drives[i].GetFilePath().GetFullPath();
            Console::WriteLine(L"  Drive: " + drivePath);
            
            // Check if drive is accessible
            if (drives[i].Exists())
            {
                Console::WriteLine(L"    Status: Accessible");
            }
            else
            {
                Console::WriteLine(L"    Status: Not accessible");
            }
        }
    }
}
```

## Working with Current Directory

Get the current working directory using relative path resolution:

```cpp
FilePath GetCurrentDirectory()
{
    // FilePath constructor with "." resolves to current directory
    FilePath currentDir(L".");
    return currentDir;
}

void ShowCurrentDirectory()
{
    FilePath currentDir = GetCurrentDirectory();
    Folder workingDir(currentDir);
    
    Console::WriteLine(L"Current directory: " + currentDir.GetFullPath());
    Console::WriteLine(L"Is root: " + (currentDir.IsRoot() ? L"true" : L"false"));
    
    // List contents of current directory
    List<Folder> folders;
    List<File> files;
    
    if (workingDir.GetFolders(folders) && workingDir.GetFiles(files))
    {
        Console::WriteLine(L"Current directory contains:");
        Console::WriteLine(L"  Folders: " + itow(folders.Count()));
        Console::WriteLine(L"  Files: " + itow(files.Count()));
    }
}
```

## Cross-Platform Root Directory Navigation

Handle root directories consistently across platforms:

```cpp
class FileSystemExplorer : public Object
{
public:
    static void ExploreFromRoot()
    {
        Folder rootFolder;
        ExploreDirectory(rootFolder, 0, 2); // Explore 2 levels deep
    }
    
    static void ExploreDirectory(const Folder& folder, vint currentDepth, vint maxDepth)
    {
        if (currentDepth > maxDepth) return;
        
        WString indent = WString::FromChar(L' ', currentDepth * 2);
        FilePath path = folder.GetFilePath();
        
        if (path.IsRoot())
        {
            Console::WriteLine(indent + L"[ROOT] " + path.GetFullPath());
        }
        else
        {
            Console::WriteLine(indent + L"[DIR] " + path.GetName());
        }
        
        // Get subdirectories
        List<Folder> subfolders;
        if (folder.GetFolders(subfolders))
        {
            for (vint i = 0; i < subfolders.Count(); i++)
            {
                ExploreDirectory(subfolders[i], currentDepth + 1, maxDepth);
            }
        }
    }
};
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

### Finding System Directories

```cpp
struct SystemPaths
{
    static FilePath GetUserHome()
    {
#ifdef VCZH_MSVC
        // Windows: Use environment variable or default
        return FilePath(L"C:\\Users\\User");  // Simplified
#else
        // Unix-like: Use environment variable or default
        return FilePath(L"/home/user");  // Simplified
#endif
    }
    
    static FilePath GetTempDirectory()
    {
#ifdef VCZH_MSVC
        return FilePath(L"C:\\Temp");
#else
        return FilePath(L"/tmp");
#endif
    }
    
    static Folder GetRootDirectory()
    {
        return Folder();  // Default constructor = root
    }
};

void ShowSystemPaths()
{
    Console::WriteLine(L"System Paths:");
    Console::WriteLine(L"  User Home: " + SystemPaths::GetUserHome().GetFullPath());
    Console::WriteLine(L"  Temp Dir: " + SystemPaths::GetTempDirectory().GetFullPath());
    Console::WriteLine(L"  Root Dir: " + SystemPaths::GetRootDirectory().GetFilePath().GetFullPath());
}
```

## Root Directory Operations

### Checking Root Status

```cpp
void AnalyzeDirectory(const WString& path)
{
    FilePath filePath(path);
    Folder folder(filePath);
    
    Console::WriteLine(L"Analyzing: " + path);
    Console::WriteLine(L"  Full path: " + filePath.GetFullPath());
    Console::WriteLine(L"  Is root: " + (filePath.IsRoot() ? L"true" : L"false"));
    Console::WriteLine(L"  Is folder: " + (filePath.IsFolder() ? L"true" : L"false"));
    Console::WriteLine(L"  Exists: " + (folder.Exists() ? L"true" : L"false"));
    
    if (filePath.IsRoot())
    {
        List<Folder> rootContents;
        if (folder.GetFolders(rootContents))
        {
            Console::WriteLine(L"  Root contains " + itow(rootContents.Count()) + L" items");
        }
    }
    else
    {
        FilePath parent = filePath.GetFolder();
        Console::WriteLine(L"  Parent: " + parent.GetFullPath());
        Console::WriteLine(L"  Parent is root: " + (parent.IsRoot() ? L"true" : L"false"));
    }
}
```

### Safe Root Directory Access

```cpp
class SafeFileSystemAccess : public Object
{
public:
    static bool IsAccessiblePath(const FilePath& path)
    {
        Folder folder(path);
        
        // Try to test accessibility
        if (!folder.Exists()) return false;
        
        // Try to list contents (basic permission test)
        List<Folder> folders;
        List<File> files;
        return folder.GetFolders(folders) || folder.GetFiles(files);
    }
    
    static void SafeExploreRoot()
    {
        Folder rootFolder;
        FilePath rootPath = rootFolder.GetFilePath();
        
        Console::WriteLine(L"Exploring root: " + rootPath.GetFullPath());
        
        if (!IsAccessiblePath(rootPath))
        {
            Console::WriteLine(L"Root directory is not accessible");
            return;
        }
        
        List<Folder> rootItems;
        if (rootFolder.GetFolders(rootItems))
        {
            Console::WriteLine(L"Root directory items:");
            for (vint i = 0; i < rootItems.Count(); i++)
            {
                FilePath itemPath = rootItems[i].GetFilePath();
                bool accessible = IsAccessiblePath(itemPath);
                Console::WriteLine(L"  " + itemPath.GetFullPath() + 
                                 L" (" + (accessible ? L"accessible" : L"restricted") + L")");
            }
        }
    }
};
```

## Practical Examples

### Drive Space Checker (Windows-focused)

```cpp
void CheckDriveStatus()
{
    Folder rootFolder;
    List<Folder> drives;
    
    if (rootFolder.GetFolders(drives))
    {
        Console::WriteLine(L"Drive Status Report:");
        Console::WriteLine(L"===================");
        
        for (vint i = 0; i < drives.Count(); i++)
        {
            WString drivePath = drives[i].GetFilePath().GetFullPath();
            Console::WriteLine(L"Drive " + drivePath + L":");
            
            if (drives[i].Exists())
            {
                List<Folder> folders;
                List<File> files;
                bool canList = drives[i].GetFolders(folders) && drives[i].GetFiles(files);
                
                if (canList)
                {
                    Console::WriteLine(L"  Status: Ready");
                    Console::WriteLine(L"  Folders: " + itow(folders.Count()));
                    Console::WriteLine(L"  Files: " + itow(files.Count()));
                }
                else
                {
                    Console::WriteLine(L"  Status: Access denied");
                }
            }
            else
            {
                Console::WriteLine(L"  Status: Not ready");
            }
            Console::WriteLine(L"");
        }
    }
}
```

## Important Notes

- **Platform Differences**: Root behavior varies significantly between Windows (multiple drive roots) and Unix-like systems (single "/" root)
- **Default Constructor**: `Folder()` always creates a root directory reference
- **Path Resolution**: Relative paths like "." and ".." are automatically resolved to absolute paths
- **Drive Access**: On Windows, drives may exist but not be accessible (e.g., removable media not inserted)
- **Permissions**: Root directory operations may require elevated permissions on some systems
- **Cross-Platform Code**: Use `FilePath::IsRoot()` to write platform-independent code for root detection