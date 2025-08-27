# Writing Text Files

The `File` class in VlppOS provides methods for writing text content to files with support for various text encodings and BOM (Byte Order Mark) handling. These methods handle encoding conversion and file operations automatically.

## Using WriteAllText()

The `WriteAllText()` method writes a complete string to a file with configurable encoding and BOM options.

### Basic Text Writing

```cpp
using namespace vl::filesystem;

File file(L"/path/to/output.txt");
WString content = L"Hello, world!\nThis is a test file.";

// Write with default settings (UTF-16 with BOM)
bool success = file.WriteAllText(content);
if (success)
{
    Console::WriteLine(L"File written successfully");
}
else
{
    Console::WriteLine(L"Failed to write file");
}
```

### Writing with Specific Encoding

```cpp
File file(L"/path/to/output.txt");
WString content = L"Unicode content: ????! ?????????? ???!";

// Write as UTF-8 with BOM
bool success = file.WriteAllText(content, true, stream::BomEncoder::Utf8);
if (success)
{
    Console::WriteLine(L"UTF-8 file written successfully");
}
```

### Writing without BOM

```cpp
File file(L"/path/to/output.txt");
WString content = L"Plain text content without BOM";

// Write as UTF-8 without BOM
bool success = file.WriteAllText(content, false, stream::BomEncoder::Utf8);
if (success)
{
    Console::WriteLine(L"File written without BOM");
}
```

## Using WriteAllLines()

The `WriteAllLines()` method writes a collection of strings as separate lines, automatically adding CRLF after each line.

### Writing Multiple Lines

```cpp
File file(L"/path/to/lines.txt");
List<WString> lines;

lines.Add(L"First line");
lines.Add(L"Second line");
lines.Add(L"Third line with unicode: ??");
lines.Add(L""); // Empty line
lines.Add(L"Last line");

// Write all lines with default encoding (UTF-16 with BOM)
bool success = file.WriteAllLines(lines);
if (success)
{
    Console::WriteLine(L"Lines written successfully");
}
```

### Configuration File Generation

```cpp
File configFile(L"/path/to/config.ini");
List<WString> configLines;

configLines.Add(L"# Application Configuration");
configLines.Add(L"");
configLines.Add(L"[General]");
configLines.Add(L"AppName=MyApplication");
configLines.Add(L"Version=1.0.0");
configLines.Add(L"");
configLines.Add(L"[Database]");
configLines.Add(L"Host=localhost");
configLines.Add(L"Port=5432");

// Write as UTF-8 for better cross-platform compatibility
bool success = configFile.WriteAllLines(configLines, true, stream::BomEncoder::Utf8);
```

### Log File Writing

```cpp
File logFile(L"/var/log/application.log");
List<WString> logEntries;

// Add timestamp and log entries
DateTime now = DateTime::LocalTime();
WString timestamp = L"[" + now.ToString() + L"]";

logEntries.Add(timestamp + L" INFO: Application started");
logEntries.Add(timestamp + L" INFO: Configuration loaded");
logEntries.Add(timestamp + L" WARNING: Connection timeout");

// Append to existing log (requires manual reading first)
List<WString> existingLines;
if (logFile.Exists())
{
    logFile.ReadAllLinesByBom(existingLines);
}

// Combine existing and new entries
for (auto entry : logEntries)
{
    existingLines.Add(entry);
}

logFile.WriteAllLines(existingLines, false, stream::BomEncoder::Utf8);
```

## Supported Encodings

### Available Encoding Options

```cpp
// UTF encodings
stream::BomEncoder::Utf8     // UTF-8 (most portable)
stream::BomEncoder::Utf16    // UTF-16 Little Endian (Windows default)
stream::BomEncoder::Utf16BE  // UTF-16 Big Endian
stream::BomEncoder::Mbcs     // ANSI/MBCS (locale-dependent)

// Example: Cross-platform compatible file
File file(L"/path/to/portable.txt");
WString content = L"Cross-platform content";
file.WriteAllText(content, true, stream::BomEncoder::Utf8);
```

### Encoding Selection Guidelines

```cpp
// For maximum compatibility across platforms
file.WriteAllText(content, true, stream::BomEncoder::Utf8);

// For Windows-specific applications  
file.WriteAllText(content, true, stream::BomEncoder::Utf16);

// For files that will be processed by simple text tools
file.WriteAllText(content, false, stream::BomEncoder::Utf8);

// For locale-specific ANSI compatibility
file.WriteAllText(content, false, stream::BomEncoder::Mbcs);
```

## Error Handling and Best Practices

### Safe File Writing with Error Checking

```cpp
bool WriteContentSafely(const WString& filePath, const WString& content)
{
    File file(filePath);
    
    // Check if we can write to the location
    File parentDir(file.GetFilePath().GetFolder());
    if (!parentDir.Exists())
    {
        Console::WriteLine(L"Parent directory does not exist: " + parentDir.GetFilePath().GetFullPath());
        return false;
    }
    
    // Attempt to write
    if (!file.WriteAllText(content, true, stream::BomEncoder::Utf8))
    {
        Console::WriteLine(L"Failed to write file: " + filePath);
        return false;
    }
    
    // Verify the write by reading back (optional)
    WString verification = file.ReadAllTextByBom();
    if (verification != content)
    {
        Console::WriteLine(L"File content verification failed");
        return false;
    }
    
    return true;
}

// Usage
if (WriteContentSafely(L"/path/to/important.txt", L"Critical data"))
{
    Console::WriteLine(L"File written and verified successfully");
}
```

### Backup Before Overwriting

```cpp
bool WriteWithBackup(const WString& filePath, const WString& newContent)
{
    File originalFile(filePath);
    
    // Create backup if file exists
    if (originalFile.Exists())
    {
        WString backupPath = filePath + L".backup";
        File backupFile(backupPath);
        
        WString originalContent = originalFile.ReadAllTextByBom();
        if (!backupFile.WriteAllText(originalContent, true, stream::BomEncoder::Utf8))
        {
            Console::WriteLine(L"Failed to create backup");
            return false;
        }
    }
    
    // Write new content
    if (!originalFile.WriteAllText(newContent, true, stream::BomEncoder::Utf8))
    {
        Console::WriteLine(L"Failed to write new content");
        return false;
    }
    
    return true;
}
```

### Atomic File Writing

```cpp
bool WriteAtomic(const WString& filePath, const WString& content)
{
    // Write to temporary file first
    WString tempPath = filePath + L".tmp";
    File tempFile(tempPath);
    
    if (!tempFile.WriteAllText(content, true, stream::BomEncoder::Utf8))
    {
        Console::WriteLine(L"Failed to write temporary file");
        return false;
    }
    
    // Remove original file if it exists
    File originalFile(filePath);
    if (originalFile.Exists() && !originalFile.Delete())
    {
        Console::WriteLine(L"Failed to remove original file");
        tempFile.Delete(); // Cleanup temp file
        return false;
    }
    
    // Rename temp file to final name
    if (!tempFile.Rename(originalFile.GetFilePath().GetName()))
    {
        Console::WriteLine(L"Failed to rename temporary file");
        return false;
    }
    
    return true;
}
```

## Working with Large Content

### Building Content Incrementally

```cpp
// For large content, build efficiently
WString BuildLargeContent()
{
    List<WString> parts;
    
    // Add content parts
    parts.Add(L"Header section\n");
    parts.Add(L"Data section with lots of information...\n");
    parts.Add(L"Footer section\n");
    
    // Combine efficiently
    WString result;
    for (auto part : parts)
    {
        result += part;
    }
    
    return result;
}

File outputFile(L"/path/to/large-file.txt");
WString content = BuildLargeContent();
outputFile.WriteAllText(content, true, stream::BomEncoder::Utf8);
```

### Memory-Efficient Line Writing

```cpp
// When working with many lines, use WriteAllLines for efficiency
void WriteReport(const WString& filePath)
{
    List<WString> reportLines;
    
    reportLines.Add(L"=== SYSTEM REPORT ===");
    reportLines.Add(L"Generated: " + DateTime::LocalTime().ToString());
    reportLines.Add(L"");
    
    // Add data sections
    for (vint i = 0; i < 1000; i++)
    {
        reportLines.Add(L"Data entry " + itow(i + 1) + L": value");
    }
    
    reportLines.Add(L"");
    reportLines.Add(L"=== END REPORT ===");
    
    File reportFile(filePath);
    reportFile.WriteAllLines(reportLines, true, stream::BomEncoder::Utf8);
}
```

## File Operations Integration

### Creating Files in Directory Structure

```cpp
void SaveUserData(const WString& username, const WString& data)
{
    // Create user-specific directory structure
    FilePath userDir = FilePath(L"/data/users") / username;
    Folder(userDir).Create(true); // Create recursively
    
    // Write user data file
    File dataFile(userDir / L"profile.txt");
    dataFile.WriteAllText(data, true, stream::BomEncoder::Utf8);
    
    // Write metadata
    List<WString> metadata;
    metadata.Add(L"User: " + username);
    metadata.Add(L"Created: " + DateTime::LocalTime().ToString());
    metadata.Add(L"Version: 1.0");
    
    File metaFile(userDir / L"meta.txt");
    metaFile.WriteAllLines(metadata, true, stream::BomEncoder::Utf8);
}
```

### Template File Processing

```cpp
void GenerateFromTemplate(const WString& templatePath, const WString& outputPath, const WString& title)
{
    File templateFile(templatePath);
    WString template = templateFile.ReadAllTextByBom();
    
    // Replace placeholders
    WString output = template;
    output = output.Replace(L"{{TITLE}}", title);
    output = output.Replace(L"{{DATE}}", DateTime::LocalTime().ToString());
    output = output.Replace(L"{{VERSION}}", L"1.0.0");
    
    // Write generated file
    File outputFile(outputPath);
    outputFile.WriteAllText(output, true, stream::BomEncoder::Utf8);
}
```

## Cross-Platform Considerations

### Line Ending Handling

```cpp
// WriteAllLines automatically uses CRLF, which works on all platforms
List<WString> lines;
lines.Add(L"Line 1");
lines.Add(L"Line 2");

File file(L"/path/to/crossplatform.txt");
file.WriteAllLines(lines, true, stream::BomEncoder::Utf8);
// File will have proper line endings regardless of platform
```

### Path Handling

```cpp
// Use FilePath for proper path construction
FilePath basePath(L"/app/data");
File configFile(basePath / L"config.txt");
File logFile(basePath / L"logs" / L"app.log");

// Paths will use correct separators for the platform
configFile.WriteAllText(L"Configuration data", true, stream::BomEncoder::Utf8);
```

The text writing methods provide robust, encoding-aware file output capabilities that handle Unicode content properly across different platforms and encoding requirements.