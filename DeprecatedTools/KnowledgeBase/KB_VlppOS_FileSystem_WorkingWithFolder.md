# Working with Folder Class

The `Folder` class in VlppOS provides directory operations and folder manipulation capabilities. It's built on top of the `FilePath` class and offers convenient methods for common folder operations.

## Creating Folder Objects

### From FilePath
```cpp
using namespace vl::filesystem;

FilePath folderPath(L"/home/user/documents");
Folder folder(folderPath);
```

### From String Path
```cpp
// Direct string construction
Folder folder(L"/home/user/documents");
Folder folder2(L"C:\\Users\\User\\Documents");  // Windows-style

// From WString variable
WString path = L"/path/to/directory";
Folder folder3(path);
```

### Copy Constructor
```cpp
Folder originalFolder(L"/path/to/directory");
Folder copyFolder(originalFolder);
```

## Folder Existence and Information

### Checking if Folder Exists
```cpp
Folder folder(L"/path/to/directory");
bool exists = folder.Exists();

// Using underlying FilePath
if (folder.GetFilePath().IsFolder())
{
    // Folder exists and is a directory (not a file)
}
```

## Folder Operations

### Creating Folders

#### Non-Recursive Creation
```cpp
Folder folder(L"/path/to/newdir");
bool success = folder.Create(false);  // Only creates the last directory
if (success)
{
    Console::WriteLine(L"Directory created successfully");
}
else
{
    Console::WriteLine(L"Failed to create directory");
}
```

#### Recursive Creation
```cpp
Folder folder(L"/path/to/deep/nested/directory");
bool success = folder.Create(true);  // Creates all intermediate directories
if (success)
{
    Console::WriteLine(L"Directory tree created successfully");
}
else
{
    Console::WriteLine(L"Failed to create directory tree");
}
```

### Deleting Folders

#### Non-Recursive Deletion (Empty Folders Only)
```cpp
Folder folder(L"/path/to/emptydir");
if (folder.Exists())
{
    bool success = folder.Delete(false);  // Only works if folder is empty
    if (success)
    {
        Console::WriteLine(L"Empty folder deleted successfully");
    }
    else
    {
        Console::WriteLine(L"Failed to delete folder (may not be empty)");
    }
}
```

#### Recursive Deletion (Including Contents)
```cpp
Folder folder(L"/path/to/directory");
if (folder.Exists())
{
    bool success = folder.Delete(true);  // Deletes all contents recursively
    if (success)
    {
        Console::WriteLine(L"Folder and all contents deleted successfully");
    }
    else
    {
        Console::WriteLine(L"Failed to delete folder");
    }
}
```

### Renaming Folders
```cpp
Folder folder(L"/path/to/oldname");
if (folder.Exists())
{
    // Rename to new name (just the folder name, not full path)
    bool success = folder.Rename(L"newname");
    if (success)
    {
        Console::WriteLine(L"Folder renamed successfully");
        // The folder is now at "/path/to/newname"
    }
    else
    {
        Console::WriteLine(L"Failed to rename folder");
    }
}
```

## Enumerating Folder Contents

### Getting Subfolders
```cpp
Folder parentFolder(L"/path/to/directory");
List<Folder> subfolders;

bool success = parentFolder.GetFolders(subfolders);
if (success)
{
    Console::WriteLine(L"Found " + itow(subfolders.Count()) + L" subfolders:");
    for (vint i = 0; i < subfolders.Count(); i++)
    {
        Console::WriteLine(L"  " + subfolders[i].GetFilePath().GetName());
    }
}
else
{
    Console::WriteLine(L"Failed to enumerate subfolders");
}
```

### Getting Files in Folder
```cpp
Folder folder(L"/path/to/directory");
List<File> files;

bool success = folder.GetFiles(files);
if (success)
{
    Console::WriteLine(L"Found " + itow(files.Count()) + L" files:");
    for (vint i = 0; i < files.Count(); i++)
    {
        Console::WriteLine(L"  " + files[i].GetFilePath().GetName());
    }
}
else
{
    Console::WriteLine(L"Failed to enumerate files");
}
```

### Complete Directory Listing
```cpp
Folder folder(L"/path/to/directory");
List<Folder> subfolders;
List<File> files;

if (folder.GetFolders(subfolders) && folder.GetFiles(files))
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

## Special Cases

### Working with Root Directory
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

### Getting Current Working Directory  
```cpp
// Note: FilePath constructor with relative path automatically resolves to absolute
FilePath currentDir(L".");
Folder workingDir(currentDir);
Console::WriteLine(L"Current directory: " + workingDir.GetFilePath().GetFullPath());
```

## Error Handling

Most Folder operations return boolean values to indicate success or failure:

```cpp
Folder folder(L"/path/to/directory");

// Check if operations succeed
if (!folder.Create(true))
{
    Console::WriteLine(L"Failed to create directory");
}

if (!folder.Delete(true))
{
    Console::WriteLine(L"Failed to delete directory");
}

// For enumeration operations, check return value
List<File> files;
if (!folder.GetFiles(files))
{
    Console::WriteLine(L"Failed to enumerate files in directory");
}
```

## Common Usage Patterns

### Safe Directory Operations
```cpp
Folder targetDir(L"/path/to/target");

// Ensure parent directory exists
if (!targetDir.Exists())
{
    if (targetDir.Create(true))
    {
        Console::WriteLine(L"Created directory: " + targetDir.GetFilePath().GetFullPath());
    }
    else
    {
        Console::WriteLine(L"Failed to create directory");
        return;
    }
}

// Now safely work with the directory
List<File> files;
targetDir.GetFiles(files);
```

### Recursive Directory Traversal
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
            Console::WriteLine(indent + L"[FILE] " + files[i].GetFilePath().GetName());
        }
    }
}

// Usage
Folder rootDir(L"/path/to/traverse");
TraverseDirectory(rootDir);
```

### Cleaning Up Temporary Directories
```cpp
void CleanTempDirectory(const Folder& tempDir)
{
    if (!tempDir.Exists()) return;
    
    Console::WriteLine(L"Cleaning temporary directory: " + tempDir.GetFilePath().GetFullPath());
    
    // Delete all contents recursively
    if (tempDir.Delete(true))
    {
        Console::WriteLine(L"Temporary directory cleaned successfully");
    }
    else
    {
        Console::WriteLine(L"Failed to clean temporary directory");
    }
}
```