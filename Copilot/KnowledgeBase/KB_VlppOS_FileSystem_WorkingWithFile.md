# Working with File Class

The `File` class in VlppOS provides file operations and text reading/writing capabilities. It's built on top of the `FilePath` class and offers convenient methods for common file operations.

## Creating File Objects

### From FilePath
```cpp
using namespace vl::filesystem;

FilePath filePath(L"/home/user/document.txt");
File file(filePath);
```

### From String Path
```cpp
// Direct string construction
File file(L"/home/user/document.txt");
File file2(L"C:\\Users\\User\\document.txt");  // Windows-style

// From WString variable
WString path = L"/path/to/file.txt";
File file3(path);
```

### Copy Constructor
```cpp
File originalFile(L"/path/to/file.txt");
File copyFile(originalFile);
```

## File Existence and Information

### Checking if File Exists
```cpp
File file(L"/path/to/file.txt");
bool exists = file.Exists();

// Using underlying FilePath
if (file.GetFilePath().IsFile())
{
    // File exists and is a file (not a directory)
}
```

## File Operations

### Deleting Files
```cpp
File file(L"/path/to/file.txt");
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

## Text File Reading

### Reading All Text with Encoding Detection
```cpp
File file(L"/path/to/textfile.txt");
WString content;
BomEncoder::Encoding encoding;
bool hasBom;

bool success = file.ReadAllTextWithEncodingTesting(content, encoding, hasBom);
if (success)
{
    Console::WriteLine(L"File content: " + content);
    Console::WriteLine(L"Detected encoding: " + itow((vint)encoding));
    Console::WriteLine(L"Has BOM: " + (hasBom ? L"true" : L"false"));
}
```

### Reading All Text with BOM
```cpp
File file(L"/path/to/textfile.txt");

// Read and automatically detect BOM encoding
WString content = file.ReadAllTextByBom();
Console::WriteLine(L"File content: " + content);
```

### Reading All Lines with BOM
```cpp
File file(L"/path/to/textfile.txt");
List<WString> lines;

bool success = file.ReadAllLinesByBom(lines);
if (success)
{
    for (vint i = 0; i < lines.Count(); i++)
    {
        Console::WriteLine(L"Line " + itow(i + 1) + L": " + lines[i]);
    }
}
```

## Text File Writing

### Writing All Text
```cpp
File file(L"/path/to/output.txt");
WString content = L"Hello, World!\nThis is a test file.";

// Write with UTF-8 encoding and BOM
bool success = file.WriteAllText(content, true, BomEncoder::Utf8);
if (success)
{
    Console::WriteLine(L"File written successfully");
}

// Write without BOM
bool success2 = file.WriteAllText(content, false, BomEncoder::Utf8);
```

### Writing All Lines
```cpp
File file(L"/path/to/output.txt");
List<WString> lines;
lines.Add(L"First line");
lines.Add(L"Second line");
lines.Add(L"Third line");

// Write lines with UTF-16 encoding and BOM
bool success = file.WriteAllLines(lines, true, BomEncoder::Utf16);
if (success)
{
    Console::WriteLine(L"Lines written successfully");
}
```

## Working with Different Encodings

### Supported Encodings
```cpp
// Available BOM encodings:
BomEncoder::Utf8        // UTF-8 with or without BOM
BomEncoder::Utf16       // UTF-16 Little Endian with BOM
BomEncoder::Utf16BE     // UTF-16 Big Endian with BOM  
BomEncoder::Utf32       // UTF-32 Little Endian with BOM
BomEncoder::Mbcs        // ANSI/MBCS encoding

// Example: Writing with specific encoding
File file(L"/path/to/file.txt");
WString content = L"Unicode content: 你好世界";
file.WriteAllText(content, true, BomEncoder::Utf16);
```

## Error Handling

Most File operations return boolean values to indicate success or failure:

```cpp
File file(L"/path/to/file.txt");

// Check if operations succeed
if (!file.WriteAllText(L"test content", true, BomEncoder::Utf8))
{
    Console::WriteLine(L"Failed to write file");
}

if (!file.Delete())
{
    Console::WriteLine(L"Failed to delete file");
}

// For reading operations that return strings, empty results may indicate failure
WString content = file.ReadAllTextByBom();
if (content.Length() == 0 && !file.Exists())
{
    Console::WriteLine(L"File doesn't exist or couldn't be read");
}
```

## Common Usage Patterns

### Safe File Operations
```cpp
File file(L"/path/to/document.txt");

// Check existence before operations
if (file.Exists())
{
    // Read existing content
    WString originalContent = file.ReadAllTextByBom();
    
    // Modify content
    WString newContent = originalContent + L"\n\nAppended text";
    
    // Write back
    if (file.WriteAllText(newContent, true, BomEncoder::Utf8))
    {
        Console::WriteLine(L"File updated successfully");
    }
}
else
{
    Console::WriteLine(L"File does not exist");
}
```

### Working with Configuration Files
```cpp
FilePath configDir = FilePath(L"~/.config/myapp");
File configFile = configDir / L"settings.conf";

// Read configuration
WString config = configFile.ReadAllTextByBom();
if (config.Length() == 0)
{
    // Create default configuration
    WString defaultConfig = L"# Default configuration\nkey=value\n";
    configFile.WriteAllText(defaultConfig, true, BomEncoder::Utf8);
}
```

### Backup Before Modify
```cpp
File originalFile(L"/path/to/important.txt");
File backupFile(L"/path/to/important.txt.backup");

if (originalFile.Exists())
{
    // Create backup
    WString content = originalFile.ReadAllTextByBom();
    backupFile.WriteAllText(content, true, BomEncoder::Utf8);
    
    // Modify original
    WString newContent = L"Modified content";
    if (!originalFile.WriteAllText(newContent, true, BomEncoder::Utf8))
    {
        Console::WriteLine(L"Failed to write file, backup preserved");
    }
}
```