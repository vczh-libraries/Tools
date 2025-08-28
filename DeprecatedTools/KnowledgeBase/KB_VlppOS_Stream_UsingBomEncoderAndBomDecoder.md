# Using BomEncoder and BomDecoder

`BomEncoder` and `BomDecoder` are specialized encoder/decoder classes that handle Byte Order Mark (BOM) for text encoding and decoding. BOM is a special marker at the beginning of text files that indicates the encoding format and byte order used.

## BomEncoder for Writing with BOM

`BomEncoder` writes the appropriate BOM before encoding text data:

```cpp
// Write UTF-8 file with BOM
FileStream fileStream(L"output.txt", FileStream::WriteOnly);
BomEncoder encoder(BomEncoder::Utf8);
EncoderStream encoderStream(fileStream, encoder);
StreamWriter writer(encoderStream);

writer.WriteLine(L"This file starts with UTF-8 BOM (EF BB BF)");
writer.WriteLine(L"Unicode content: 你好世界 🌍");
```

## Available BOM Encodings

`BomEncoder` supports several encoding formats:

```cpp
// UTF-8 with BOM (EF BB BF)
BomEncoder utf8Encoder(BomEncoder::Utf8);

// UTF-16 Little Endian with BOM (FF FE)
BomEncoder utf16Encoder(BomEncoder::Utf16);

// UTF-16 Big Endian with BOM (FE FF)
BomEncoder utf16BEEncoder(BomEncoder::Utf16BE);

// MBCS/ANSI (no BOM written)
BomEncoder mbcsEncoder(BomEncoder::Mbcs);
```

## BomDecoder for Reading with BOM Detection

`BomDecoder` automatically detects the encoding based on BOM and chooses the appropriate decoder:

```cpp
// Read file with automatic BOM detection
FileStream fileStream(L"input.txt", FileStream::ReadOnly);
BomDecoder decoder;
DecoderStream decoderStream(fileStream, decoder);
StreamReader reader(decoderStream);

WString content = reader.ReadToEnd();
// BOM is automatically consumed and appropriate decoder selected
```

## BOM Detection Process

`BomDecoder` reads the first few bytes to detect encoding:

```cpp
// BOM patterns detected:
// EF BB BF        -> UTF-8
// FF FE           -> UTF-16 Little Endian  
// FE FF           -> UTF-16 Big Endian
// No BOM          -> MBCS/ANSI (local code page)

FileStream fileStream(L"unknown_encoding.txt", FileStream::ReadOnly);
BomDecoder decoder;
DecoderStream decoderStream(fileStream, decoder);
StreamReader reader(decoderStream);

// Decoder automatically chosen based on BOM or defaults to MBCS
WString text = reader.ReadToEnd();
```

## File Class Integration

The `File` class uses BOM encoders/decoders internally:

```cpp
// File::ReadAllTextByBom uses BomDecoder internally
File file(L"input.txt");
WString content = file.ReadAllTextByBom();

// File::WriteAllText with BOM
File outputFile(L"output.txt");
WString text = L"Content with unicode: 测试文本";
outputFile.WriteAllText(text, true, BomEncoder::Utf8);  // true = include BOM
```

## Production Example

Real-world usage from VlppOS file operations:

```cpp
bool File::ReadAllTextByBom(WString& text) const
{
    FileStream fileStream(filePath.GetFullPath(), FileStream::ReadOnly);
    if (!fileStream.IsAvailable()) return false;
    
    BomDecoder decoder;
    DecoderStream decoderStream(fileStream, decoder);
    StreamReader reader(decoderStream);
    
    text = reader.ReadToEnd();
    return true;
}
```

## Working with Different Encodings

### Writing UTF-8 with BOM
```cpp
FileStream fileStream(L"utf8_bom.txt", FileStream::WriteOnly);
BomEncoder encoder(BomEncoder::Utf8);
EncoderStream encoderStream(fileStream, encoder);
StreamWriter writer(encoderStream);

writer.WriteString(L"UTF-8 content with BOM");
// File starts with: EF BB BF (UTF-8 BOM) followed by encoded text
```

### Writing UTF-16 with BOM
```cpp
FileStream fileStream(L"utf16_bom.txt", FileStream::WriteOnly);
BomEncoder encoder(BomEncoder::Utf16);
EncoderStream encoderStream(fileStream, encoder);
StreamWriter writer(encoderStream);

writer.WriteString(L"UTF-16 content with BOM");
// File starts with: FF FE (UTF-16 LE BOM) followed by encoded text
```

### Reading Mixed Encoding Files
```cpp
void ProcessMultipleFiles(const List<WString>& fileNames)
{
    for (const auto& fileName : fileNames)
    {
        FileStream fileStream(fileName, FileStream::ReadOnly);
        BomDecoder decoder;  // Auto-detects each file's encoding
        DecoderStream decoderStream(fileStream, decoder);
        StreamReader reader(decoderStream);
        
        WString content = reader.ReadToEnd();
        ProcessFileContent(content);
    }
}
```

## BOM vs Non-BOM

### With BOM (Recommended for interchange)
```cpp
// Writing with BOM - better for file interchange
BomEncoder encoder(BomEncoder::Utf8);
// File can be correctly identified by other applications
```

### Without BOM (Use specific encoder)
```cpp
// Writing without BOM - use specific encoder directly
Utf8Encoder encoder;  // No BOM written
// Application must know the encoding in advance
```

## BOM Behavior Summary

| Encoding | BOM Bytes | BomEncoder | BomDecoder |
|----------|-----------|------------|------------|
| UTF-8 | EF BB BF | Writes BOM + UTF-8 | Detects and uses Utf8Decoder |
| UTF-16 LE | FF FE | Writes BOM + UTF-16 LE | Detects and uses Utf16Decoder |  
| UTF-16 BE | FE FF | Writes BOM + UTF-16 BE | Detects and uses Utf16BEDecoder |
| MBCS | None | No BOM, uses MBCS | No BOM, uses MbcsDecoder |

## Best Practices

### For Writing Files
```cpp
// Use BomEncoder when creating files for interchange
BomEncoder encoder(BomEncoder::Utf8);  // UTF-8 with BOM
// Or UTF-16 for Windows compatibility
BomEncoder encoder(BomEncoder::Utf16); // UTF-16 with BOM
```

### For Reading Files
```cpp
// Always use BomDecoder for reading text files of unknown encoding
BomDecoder decoder;  // Handles all common text file formats
```

### Encoding Selection Guidelines
- **UTF-8 with BOM**: Good for cross-platform text files
- **UTF-16 with BOM**: Good for Windows-centric applications
- **No BOM**: Use when you control both reading and writing

## Important Notes

- BOM is written at the very beginning of the file
- BOM bytes are consumed during reading and not included in text content
- `BomDecoder` defaults to MBCS if no BOM is detected
- Different applications may handle BOM differently
- BOM helps with encoding detection but adds 2-3 bytes to file size
- Not all text editors display BOM visibly
- BOM is strongly recommended for Unicode text files to ensure proper interpretation