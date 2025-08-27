# Reading Text Files with BOM

The `File` class in VlppOS provides convenient methods for reading text files with BOM (Byte Order Mark) detection and handling. These methods automatically detect and decode BOM markers to properly read Unicode text files.

## Using ReadAllTextByBom()

The `ReadAllTextByBom()` method automatically detects BOM encoding and returns the file content as a WString.

### Simple Text Reading

```cpp
using namespace vl::filesystem;

File file(L"/path/to/textfile.txt");

// Read entire file content, automatically detecting BOM encoding
WString content = file.ReadAllTextByBom();
Console::WriteLine(L"File content: " + content);
```

### Reading with Error Handling

```cpp
File file(L"/path/to/textfile.txt");
WString content;

// Check if file exists before reading
if (file.Exists())
{
    bool success = file.ReadAllTextByBom(content);
    if (success)
    {
        Console::WriteLine(L"File content: " + content);
    }
    else
    {
        Console::WriteLine(L"Failed to read file");
    }
}
else
{
    Console::WriteLine(L"File does not exist");
}
```

## Using ReadAllLinesByBom()

The `ReadAllLinesByBom()` method reads the file content line by line, automatically handling BOM detection.

### Reading Lines

```cpp
File file(L"/path/to/textfile.txt");
List<WString> lines;

bool success = file.ReadAllLinesByBom(lines);
if (success)
{
    Console::WriteLine(L"File has " + itow(lines.Count()) + L" lines:");
    for (vint i = 0; i < lines.Count(); i++)
    {
        Console::WriteLine(L"Line " + itow(i + 1) + L": " + lines[i]);
    }
}
else
{
    Console::WriteLine(L"Failed to read file lines");
}
```

### Processing Large Files Line by Line

```cpp
File file(L"/path/to/largefile.txt");
List<WString> lines;

if (file.ReadAllLinesByBom(lines))
{
    vint emptyLines = 0;
    vint totalChars = 0;
    
    for (auto line : lines)
    {
        if (line.Length() == 0)
        {
            emptyLines++;
        }
        totalChars += line.Length();
    }
    
    Console::WriteLine(L"Total lines: " + itow(lines.Count()));
    Console::WriteLine(L"Empty lines: " + itow(emptyLines));
    Console::WriteLine(L"Total characters: " + itow(totalChars));
}
```

## Supported BOM Encodings

The BOM detection automatically handles these encodings:

- **UTF-8**: Detected by EF BB BF byte sequence
- **UTF-16 LE**: Detected by FF FE byte sequence (Little Endian)  
- **UTF-16 BE**: Detected by FE FF byte sequence (Big Endian)
- **MBCS/ANSI**: Used when no BOM is detected

### BOM Detection Behavior

```cpp
File file(L"/path/to/textfile.txt");

// The methods automatically:
// 1. Read the first few bytes to check for BOM
// 2. Select appropriate decoder based on BOM
// 3. Decode the remaining file content
// 4. Return content as WString (UTF-16/UTF-32 depending on platform)

WString content = file.ReadAllTextByBom();
// Content is now properly decoded regardless of original encoding
```

## Line Break Handling

The `ReadAllLinesByBom()` method properly handles different line break conventions:

```cpp
File file(L"/path/to/crossplatform.txt");
List<WString> lines;

// Handles:
// - Windows CRLF (\r\n)
// - Unix/Linux LF (\n)  
// - Classic Mac CR (\r)
file.ReadAllLinesByBom(lines);

// Each line in the list excludes the line break characters
for (auto line : lines)
{
    // Process each line without worrying about line endings
    Console::WriteLine(L">" + line + L"<");
}
```

## Performance Considerations

For very large files, consider using StreamReader.

The BOM-based reading methods provide automatic encoding detection and proper Unicode handling, making them ideal for reading text files of unknown encoding in cross-platform applications.