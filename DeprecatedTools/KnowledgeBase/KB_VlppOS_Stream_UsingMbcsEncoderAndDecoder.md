# Using MbcsEncoder and MbcsDecoder

`MbcsEncoder` and `MbcsDecoder` provide encoding and decoding between `wchar_t` strings and multi-byte character sequences (MBCS) using the local code page. MBCS typically refers to ANSI encoding that varies based on the system's locale settings.

## Understanding MBCS

### What is MBCS

MBCS (Multi-Byte Character Set) encoding uses variable-length byte sequences to represent characters. The specific encoding depends on the system's locale/code page:

- **Windows**: Uses the system ANSI code page (e.g., Windows-1252 for Western European)
- **Linux/macOS**: Uses the locale-specific encoding (often UTF-8 in modern systems)

### Character Type Mapping

```cpp
using namespace vl::stream;

// MbcsEncoder: wchar_t → char (ANSI/local code page)
class MbcsEncoder : public EncoderBase;

// MbcsDecoder: char (ANSI/local code page) → wchar_t  
class MbcsDecoder : public DecoderBase;
```

## Using MbcsEncoder

### Basic MBCS Encoding

```cpp
using namespace vl::stream;

// Write wchar_t content to ANSI/MBCS file
FileStream fileStream(L"output_mbcs.txt", FileStream::WriteOnly);
MbcsEncoder encoder;
EncoderStream encoderStream(fileStream, encoder);
StreamWriter writer(encoderStream);

writer.WriteString(L"Hello, World!");
writer.WriteLine(L"ANSI compatible text");

// Note: Non-ASCII characters may not encode properly depending on locale
writer.WriteString(L"Extended characters: café, naïve");
```

### Writing Legacy ANSI Files

```cpp
// Create ANSI text file for legacy applications
void CreateAnsiFile(const WString& filename, const WString& content)
{
    FileStream fileStream(filename, FileStream::WriteOnly);
    MbcsEncoder encoder;
    EncoderStream encoderStream(fileStream, encoder);
    StreamWriter writer(encoderStream);
    
    writer.WriteString(content);
}

// Usage
CreateAnsiFile(L"legacy_output.txt", L"ASCII and extended characters");
```

### Converting Unicode to Local Code Page

```cpp
// Convert Unicode strings to local encoding for external tools
MemoryStream memoryStream;
MbcsEncoder encoder;
EncoderStream encoderStream(memoryStream, encoder);
StreamWriter writer(encoderStream);

WString unicodeText = L"Text with accents: résumé, naïve, café";
writer.WriteString(unicodeText);

// Get the encoded bytes
memoryStream.SeekFromBegin(0);
vint size = (vint)memoryStream.Size();
Array<char> ansiBytes(size);
memoryStream.Read(ansiBytes.Buffer(), size);

Console::WriteLine(L"Encoded " + itow(unicodeText.Length()) + 
                   L" Unicode characters to " + itow(size) + L" ANSI bytes");
```

## Using MbcsDecoder

### Basic MBCS Decoding

```cpp
// Read ANSI/MBCS file and decode to wchar_t
FileStream fileStream(L"input_mbcs.txt", FileStream::ReadOnly);
MbcsDecoder decoder;
DecoderStream decoderStream(fileStream, decoder);
StreamReader reader(decoderStream);

WString content = reader.ReadToEnd();
Console::WriteLine(L"Decoded MBCS content: " + content);
```

### Reading Legacy ANSI Files

```cpp
// Read legacy ANSI text files
WString ReadAnsiFile(const WString& filename)
{
    FileStream fileStream(filename, FileStream::ReadOnly);
    MbcsDecoder decoder;
    DecoderStream decoderStream(fileStream, decoder);
    StreamReader reader(decoderStream);
    
    return reader.ReadToEnd();
}

// Process legacy configuration files
WString config = ReadAnsiFile(L"config.ini");
Console::WriteLine(L"Configuration: " + config);
```

### Converting Local Code Page to Unicode

```cpp
// Convert ANSI byte data to Unicode strings
void ProcessAnsiData(const Array<char>& ansiData)
{
    MemoryWrapperStream memoryStream(
        const_cast<char*>(ansiData.Buffer()), 
        ansiData.Count()
    );
    
    MbcsDecoder decoder;
    DecoderStream decoderStream(memoryStream, decoder);
    StreamReader reader(decoderStream);
    
    WString unicodeText = reader.ReadToEnd();
    Console::WriteLine(L"Converted to Unicode: " + unicodeText);
}
```

## Best Practices

1. **Use for Legacy Compatibility Only**: Prefer UTF-8 for new applications; use MBCS only when interfacing with legacy systems.

2. **Validate Character Coverage**: Test that your target characters can be represented in the local code page.

3. **Handle Conversion Errors**: Always be prepared for encoding/decoding failures with non-representable characters.

4. **Document Code Page Dependencies**: Make it clear when your application depends on specific locale settings.

5. **Consider Migration Strategies**: Plan to migrate legacy ANSI data to Unicode encodings when possible.

`MbcsEncoder` and `MbcsDecoder` provide essential compatibility with legacy ANSI-based systems while maintaining the modern Unicode-based architecture of VlppOS applications.