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

## Performance Considerations

For very large files, consider using StreamWriter.

The text writing methods provide robust, encoding-aware file output capabilities that handle Unicode content properly across different platforms and encoding requirements.