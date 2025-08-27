# File Operations Delete and Rename

The `File` and `Folder` classes in VlppOS provide essential file system operations including deleting and renaming files and directories. These operations return boolean values to indicate success or failure.

## File Operations

### Deleting Files

Use the `Delete()` method to remove a file from the file system:

```cpp
using namespace vl::filesystem;

// Delete a specific file
File file(L"/path/to/document.txt");
if (file.Exists())
{
    bool success = file.Delete();
    if (success)
    {
        Console::WriteLine(L"File deleted successfully");
    }
    else
    {
        Console::WriteLine(L"Failed to delete file");
    }
}
```

### Renaming Files

Use the `Rename()` method to change a file's name. The method takes only the new filename, not the full path:

```cpp
File file(L"/path/to/oldname.txt");
if (file.Exists())
{
    // Rename to new name (just the filename, not full path)
    bool success = file.Rename(L"newname.txt");
    if (success)
    {
        Console::WriteLine(L"File renamed successfully");
        // The file is now at "/path/to/newname.txt"
    }
    else
    {
        Console::WriteLine(L"Failed to rename file");
    }
}
```

## Folder Operations

### Deleting Folders

Use the `Delete()` method with the recursive parameter to remove directories:

```cpp
Folder folder(L"/path/to/directory");
if (folder.Exists())
{
    // Delete empty directory only
    bool success = folder.Delete(false);
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

### Recursive Folder Deletion

To delete a folder and all its contents, use the recursive option:

```cpp
Folder folder(L"/path/to/directory");
if (folder.Exists())
{
    // Delete folder and all contents recursively
    bool success = folder.Delete(true);
    if (success)
    {
        Console::WriteLine(L"Folder and all contents deleted successfully");
    }
    else
    {
        Console::WriteLine(L"Failed to delete folder recursively");
    }
}
```

### Renaming Folders

Use the `Rename()` method to change a folder's name:

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

## Error Handling Best Practices

Always check if files or folders exist before attempting operations and handle errors appropriately:

```cpp
void SafeFileDelete(const WString& filePath)
{
    File file(filePath);
    
    if (!file.Exists())
    {
        Console::WriteLine(L"File does not exist: " + filePath);
        return;
    }
    
    if (file.Delete())
    {
        Console::WriteLine(L"Successfully deleted: " + filePath);
    }
    else
    {
        Console::WriteLine(L"Failed to delete: " + filePath);
    }
}

void SafeFolderRename(const WString& folderPath, const WString& newName)
{
    Folder folder(folderPath);
    
    if (!folder.Exists())
    {
        Console::WriteLine(L"Folder does not exist: " + folderPath);
        return;
    }
    
    if (folder.Rename(newName))
    {
        Console::WriteLine(L"Successfully renamed folder to: " + newName);
    }
    else
    {
        Console::WriteLine(L"Failed to rename folder: " + folderPath);
    }
}
```

## Important Notes

- **Asynchronous Operations**: These functions may return before the actual file system operation is complete
- **Cross-Platform**: These operations work consistently across Windows, Linux, and macOS
- **Path Limitations**: `Rename()` only accepts the new name, not a full path - files/folders are renamed within their current directory
- **Recursive Safety**: Use recursive deletion carefully as it permanently removes all contents
- **Return Values**: Always check the boolean return value to determine if the operation succeeded