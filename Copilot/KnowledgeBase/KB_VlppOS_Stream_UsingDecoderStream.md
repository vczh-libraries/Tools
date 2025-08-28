# Using DecoderStream for Data Transformation

`DecoderStream` is a readable stream that applies data transformation using an `IDecoder` implementation. It provides a way to transform data as it's being read from a source stream, commonly used for text decoding, decompression, or other data conversion tasks.

## Basic Usage

`DecoderStream` wraps an underlying stream and a decoder to transform data on-the-fly:

```cpp
// Read UTF-8 encoded text from a file
FileStream fileStream(L"input.txt", FileStream::ReadOnly);
Utf8Decoder decoder;
DecoderStream decoderStream(fileStream, decoder);

// Read text directly - it gets decoded from UTF-8 automatically
StreamReader reader(decoderStream);
WString content = reader.ReadToEnd();
```

## Text Decoding with BOM Detection

Use `BomDecoder` to automatically detect and handle Byte Order Mark (BOM):

```cpp
FileStream fileStream(L"input.txt", FileStream::ReadOnly);
BomDecoder decoder;  // Automatically detects UTF-8, UTF-16, UTF-16BE, or MBCS
DecoderStream decoderStream(fileStream, decoder);
StreamReader reader(decoderStream);

WString content = reader.ReadToEnd();
// BOM is automatically consumed and encoding detected
```

## Different Text Decodings

### UTF-8 Decoding
```cpp
FileStream fileStream(L"utf8_file.txt", FileStream::ReadOnly);
Utf8Decoder decoder;
DecoderStream decoderStream(fileStream, decoder);
StreamReader reader(decoderStream);
WString text = reader.ReadToEnd();
```

### UTF-16 Decoding
```cpp
FileStream fileStream(L"utf16_file.txt", FileStream::ReadOnly);
Utf16Decoder decoder;
DecoderStream decoderStream(fileStream, decoder);
StreamReader reader(decoderStream);
WString text = reader.ReadToEnd();
```

### MBCS (Local Code Page) Decoding
```cpp
FileStream fileStream(L"mbcs_file.txt", FileStream::ReadOnly);
MbcsDecoder decoder;
DecoderStream decoderStream(fileStream, decoder);
StreamReader reader(decoderStream);
WString text = reader.ReadToEnd();
```

## Line-by-Line Reading

Process large files line by line without loading everything into memory:

```cpp
FileStream fileStream(L"large_file.txt", FileStream::ReadOnly);
BomDecoder decoder;
DecoderStream decoderStream(fileStream, decoder);
StreamReader reader(decoderStream);

while (!reader.IsEnd())
{
    WString line = reader.ReadLine();
    // Process each line
    ProcessLine(line);
}
```

## Production Example

Real-world usage from file processing:

```cpp
// Read file content with encoding detection
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

## Memory Stream with Decoding

Use `DecoderStream` with `MemoryWrapperStream` for in-memory transformations:

```cpp
// Decode UTF-8 data from an existing buffer
Array<vuint8_t> utf8Data = GetUtf8DataFromSomewhere();
MemoryWrapperStream memoryStream(&utf8Data[0], utf8Data.Count());
Utf8Decoder decoder;
DecoderStream decoderStream(memoryStream, decoder);
StreamReader reader(decoderStream);

WString decodedText = reader.ReadToEnd();
```

## Working with Compressed Data

Decompress LZW-compressed data:

```cpp
FileStream compressedFile(L"data.lzw", FileStream::ReadOnly);
LzwDecoder decoder;
DecoderStream decoderStream(compressedFile, decoder);

// Read decompressed data
char buffer[1024];
vint bytesRead = decoderStream.Read(buffer, sizeof(buffer));
```

## Base64 Decoding

Decode Base64-encoded data:

```cpp
FileStream base64File(L"data.b64", FileStream::ReadOnly);
Utf8Base64Decoder decoder;
DecoderStream decoderStream(base64File, decoder);

// Read decoded binary data
Array<vuint8_t> binaryData(1000);
vint bytesRead = decoderStream.Read(&binaryData[0], binaryData.Count());
```

## Stream Capabilities

`DecoderStream` provides these capabilities:

- **Readable**: Yes
- **Writable**: No (read-only)
- **Seekable**: No
- **Peekable**: No
- **Limited**: Depends on underlying stream

## Available Decoders

VlppOS provides several built-in decoders:

### Text Decoders
- `Utf8Decoder` - UTF-8 decoding
- `Utf16Decoder` - UTF-16 Little Endian
- `Utf16BEDecoder` - UTF-16 Big Endian
- `Utf32Decoder` - UTF-32 decoding
- `MbcsDecoder` - Local code page decoding
- `BomDecoder` - Auto-detects BOM and chooses appropriate decoder

### Other Decoders
- `Utf8Base64Decoder` - Base64 decoding
- `LzwDecoder` - LZW decompression

## Encoding Detection Pattern

Common pattern for reading files with unknown encoding:

```cpp
WString ReadTextFileWithFallback(const WString& fileName)
{
    FileStream fileStream(fileName, FileStream::ReadOnly);
    if (!fileStream.IsAvailable())
        return L"";
    
    // First try BOM detection
    {
        BomDecoder decoder;
        DecoderStream decoderStream(fileStream, decoder);
        StreamReader reader(decoderStream);
        return reader.ReadToEnd();
    }
}
```

## Character vs Byte Reading

Remember that `DecoderStream` operates on characters after decoding:

```cpp
FileStream fileStream(L"utf8_file.txt", FileStream::ReadOnly);
Utf8Decoder decoder;
DecoderStream decoderStream(fileStream, decoder);

// Reading characters (after UTF-8 decoding)
wchar_t chars[100];
vint charCount = decoderStream.Read(chars, sizeof(chars));
// charCount is in bytes, but chars contains decoded wide characters
```

## Important Notes

- `DecoderStream` is read-only; use `EncoderStream` for writing
- The underlying stream must be readable and available
- Different decoders may have different buffering behaviors
- BOM detection consumes the BOM bytes from the stream
- Invalid encoded data may cause exceptions or produce replacement characters
- Some decoders handle multi-byte sequences that may span read operations
- Always check stream availability before reading