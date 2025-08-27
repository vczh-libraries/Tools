# Enumerating Folder Contents

The `Folder` class in VlppOS provides methods to list files and subdirectories within a folder. These operations return collections of `File` and `Folder` objects that can be used for further processing.

## Basic Folder Enumeration

Use `GetFolders()` and `GetFiles()` methods to retrieve folder contents:

```cpp
using namespace vl::filesystem;
using namespace vl::collections;

Folder folder(L"/path/to/directory");
List<Folder> subfolders;
List<File> files;

// Get all subdirectories
bool foldersSuccess = folder.GetFolders(subfolders);
// Get all files
bool filesSuccess = folder.GetFiles(files);

if (foldersSuccess && filesSuccess)
{
    Console::WriteLine(L"Directory contents:");
    
    // List folders first
    for (vint i = 0; i < subfolders.Count(); i++)
    {
        Console::WriteLine(L"[DIR]  " + subfolders[i].GetFilePath().GetName());
    }
    
    // Then list files
    for (vint i = 0; i < files.Count(); i++)
    {
        Console::WriteLine(L"[FILE] " + files[i].GetFilePath().GetName());
    }
}
```

## Combined Enumeration

You can check both operations and handle them together:

```cpp
Folder folder(L"/path/to/directory");
List<Folder> subfolders;
List<File> files;

if (folder.GetFolders(subfolders) && folder.GetFiles(files))
{
    Console::WriteLine(L"Total items: " + itow(subfolders.Count() + files.Count()));
    Console::WriteLine(L"Folders: " + itow(subfolders.Count()));
    Console::WriteLine(L"Files: " + itow(files.Count()));
}
else
{
    Console::WriteLine(L"Failed to enumerate folder contents");
}
```

## Working with Root Directory

The root directory has special behavior on different platforms:

```cpp
Folder rootFolder;  // Default constructor creates root folder

List<Folder> drives;
bool success = rootFolder.GetFolders(drives);
if (success)
{
    Console::WriteLine(L"Available drives/root folders:");
    for (vint i = 0; i < drives.Count(); i++)
    {
        Console::WriteLine(L"  " + drives[i].GetFilePath().GetFullPath());
    }
}

// On Windows, this lists drives like "C:", "D:", etc.
// On Linux/macOS, this would typically show mount points under "/"
```

## Recursive Directory Traversal

You can recursively enumerate all contents of a directory tree:

```cpp
void TraverseDirectory(const Folder& folder, vint depth = 0)
{
    WString indent = WString::FromChar(L'\t', depth);
    Console::WriteLine(indent + L"[DIR] " + folder.GetFilePath().GetName());
    
    // Process subdirectories
    List<Folder> subfolders;
    if (folder.GetFolders(subfolders))
    {
        for (vint i = 0; i < subfolders.Count(); i++)
        {
            TraverseDirectory(subfolders[i], depth + 1);
        }
    }
    
    // Process files
    List<File> files;
    if (folder.GetFiles(files))
    {
        for (vint i = 0; i < files.Count(); i++)
        {
            Console::WriteLine(indent + L"\t[FILE] " + files[i].GetFilePath().GetName());
        }
    }
}

// Usage
Folder startFolder(L"/path/to/traverse");
TraverseDirectory(startFolder);
```

## Important Notes

- **Return Values**: Both `GetFolders()` and `GetFiles()` return boolean values indicating success
- **Empty Collections**: On success, the collections will contain all items (may be empty if folder is empty)  
- **Cross-Platform**: Root directory behavior differs between Windows (drives) and Unix-like systems (mount points)
- **Performance**: Large directories may take time to enumerate; consider the performance implications
- **Thread Safety**: Folder enumeration is not inherently thread-safe if the directory is being modified concurrently