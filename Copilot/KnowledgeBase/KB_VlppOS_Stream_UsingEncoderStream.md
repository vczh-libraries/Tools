# Using EncoderStream for Data Transformation

`EncoderStream` is a writable stream that applies data transformation using an `IEncoder` implementation. It provides a way to transform data as it's being written to a target stream, commonly used for text encoding, compression, or other data conversion tasks.

## Basic Usage

`EncoderStream` wraps an underlying stream and an encoder to transform data on-the-fly:

```cpp
// Write UTF-8 encoded text to a file
FileStream fileStream(L"output.txt", FileStream::WriteOnly);
Utf8Encoder encoder;
EncoderStream encoderStream(fileStream, encoder);

// Write text directly - it gets encoded to UTF-8 automatically
StreamWriter writer(encoderStream);
writer.WriteString(L"Hello, world! ????");
```

## Text Encoding with BOM

Use `BomEncoder` to add Byte Order Mark (BOM) to encoded text:

```cpp
FileStream fileStream(L"output.txt", FileStream::WriteOnly);
BomEncoder encoder(BomEncoder::Utf8);  // UTF-8 with BOM
EncoderStream encoderStream(fileStream, encoder);
StreamWriter writer(encoderStream);

writer.WriteLine(L"This file starts with UTF-8 BOM");
writer.WriteLine(L"Unicode content: ???? ??");
```

## Different Text Encodings

### UTF-8 Encoding
```cpp
FileStream fileStream(L"utf8_file.txt", FileStream::WriteOnly);
Utf8Encoder encoder;
EncoderStream encoderStream(fileStream, encoder);
StreamWriter writer(encoderStream);
writer.WriteString(L"UTF-8 encoded content");
```

### UTF-16 Encoding
```cpp
FileStream fileStream(L"utf16_file.txt", FileStream::WriteOnly);
Utf16Encoder encoder;
EncoderStream encoderStream(fileStream, encoder);
StreamWriter writer(encoderStream);
writer.WriteString(L"UTF-16 encoded content");
```

### MBCS (Local Code Page) Encoding
```cpp
FileStream fileStream(L"mbcs_file.txt", FileStream::WriteOnly);
MbcsEncoder encoder;
EncoderStream encoderStream(fileStream, encoder);
StreamWriter writer(encoderStream);
writer.WriteString(L"MBCS encoded content");
```

## Production Example

Real-world usage from metadata generation:

```cpp
// Generate reflection metadata to file with UTF-8 BOM
FileStream fileStream(outputPath + L"Reflection.txt", FileStream::WriteOnly);
BomEncoder encoder(BomEncoder::Utf8);
EncoderStream encoderStream(fileStream, encoder);
StreamWriter writer(encoderStream);

// Write structured data
LogTypeManager(writer);  // Writes formatted metadata
```

## Memory Stream with Encoding

Use `EncoderStream` with `MemoryStream` for in-memory transformations:

```cpp
MemoryStream memoryStream;
Utf8Encoder encoder;
EncoderStream encoderStream(memoryStream, encoder);
StreamWriter writer(encoderStream);

writer.WriteLine(L"Line 1: English text");
writer.WriteLine(L"Line 2: ????");
writer.WriteLine(L"Line 3: ??????? ?????");

// The data is now encoded in UTF-8 in the memory stream
memoryStream.SeekFromBegin(0);
// Process the encoded data...
```

## Proper Resource Management

Always ensure the encoder stream is closed properly to flush any cached data:

```cpp
{
    FileStream fileStream(L"output.txt", FileStream::WriteOnly);
    BomEncoder encoder(BomEncoder::Utf16);
    EncoderStream encoderStream(fileStream, encoder);
    StreamWriter writer(encoderStream);
    
    writer.WriteString(L"Important data");
    // EncoderStream destructor will call Close() automatically
} // All streams closed here, data is flushed
```

## Stream Capabilities

`EncoderStream` provides these capabilities:

- **Readable**: No (write-only)
- **Writable**: Yes 
- **Seekable**: No
- **Peekable**: No
- **Limited**: Depends on underlying stream

## Available Encoders

VlppOS provides several built-in encoders:

### Text Encoders
- `Utf8Encoder` - UTF-8 encoding
- `Utf16Encoder` - UTF-16 Little Endian
- `Utf16BEEncoder` - UTF-16 Big Endian
- `Utf32Encoder` - UTF-32 encoding
- `MbcsEncoder` - Local code page encoding
- `BomEncoder` - Adds BOM for specified encoding

### Other Encoders
- `Utf8Base64Encoder` - Base64 encoding
- `LzwEncoder` - LZW compression

## Important Notes

- `EncoderStream` is write-only; use `DecoderStream` for reading
- Always ensure proper cleanup to flush cached encoder data
- The underlying stream must be writable and available
- Different encoders may have different buffering behaviors
- Some encoders (like BOM encoders) write header information first
- Use appropriate encoder for your target format and requirements