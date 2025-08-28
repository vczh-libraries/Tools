# Using LzwEncoder and LzwDecoder

LZW (Lempel-Ziv-Welch) compression is provided in VlppOS through `LzwEncoder` for compression and `LzwDecoder` for decompression. These classes implement the LZW algorithm with customizable byte filters for improved compression efficiency.

## Basic Compression

Compress data using `LzwEncoder`:

```cpp
FileStream inputFile(L"data.txt", FileStream::ReadOnly);
FileStream outputFile(L"data.lzw", FileStream::WriteOnly);
LzwEncoder encoder;
EncoderStream encoderStream(outputFile, encoder);

// Copy data with compression
char buffer[1024];
while (true)
{
    vint bytesRead = inputFile.Read(buffer, sizeof(buffer));
    if (bytesRead == 0) break;
    encoderStream.Write(buffer, bytesRead);
}
```

## Basic Decompression

Decompress data using `LzwDecoder`:

```cpp
FileStream compressedFile(L"data.lzw", FileStream::ReadOnly);
FileStream outputFile(L"data_restored.txt", FileStream::WriteOnly);
LzwDecoder decoder;
DecoderStream decoderStream(compressedFile, decoder);

// Copy data with decompression
char buffer[1024];
while (true)
{
    vint bytesRead = decoderStream.Read(buffer, sizeof(buffer));
    if (bytesRead == 0) break;
    outputFile.Write(buffer, bytesRead);
}
```

## Memory-Based Compression

Compress data in memory:

```cpp
WString textData = L"This is some text data that will be compressed.";
MemoryStream compressedStream;

// Convert to UTF-8 and compress
{
    Utf8Encoder utf8Encoder;
    EncoderStream utf8Stream(compressedStream, utf8Encoder);
    LzwEncoder lzwEncoder;
    EncoderStream lzwStream(utf8Stream, lzwEncoder);
    StreamWriter writer(lzwStream);
    writer.WriteString(textData);
}

// Now compressedStream contains compressed UTF-8 data
Console::WriteLine(L"Original size: " + itow(textData.Length() * sizeof(wchar_t)));
Console::WriteLine(L"Compressed size: " + itow(compressedStream.Size()));
```

## Memory-Based Decompression

Decompress data from memory:

```cpp
// Assuming compressedStream contains compressed data
compressedStream.SeekFromBegin(0);

WString restoredText;
{
    LzwDecoder lzwDecoder;
    DecoderStream lzwStream(compressedStream, lzwDecoder);
    Utf8Decoder utf8Decoder;
    DecoderStream utf8Stream(lzwStream, utf8Decoder);
    StreamReader reader(utf8Stream);
    restoredText = reader.ReadToEnd();
}

Console::WriteLine(L"Restored text: " + restoredText);
```

## Optimized Compression with Byte Filters

When you know the data will only contain specific bytes, you can improve compression by filtering unused bytes:

```cpp
// For ASCII text data (bytes 32-126)
bool existingBytes[256] = { false };
for (vint i = 32; i <= 126; i++)
{
    existingBytes[i] = true;
}
existingBytes['\n'] = true;  // Include newline
existingBytes['\r'] = true;  // Include carriage return
existingBytes['\t'] = true;  // Include tab

LzwEncoder encoder(existingBytes);
LzwDecoder decoder(existingBytes);  // Must match encoder settings
```

## Error Handling

LZW operations should be wrapped in error handling:

```cpp
try
{
    FileStream inputFile(L"data.txt", FileStream::ReadOnly);
    if (!inputFile.IsAvailable())
    {
        Console::WriteLine(L"Failed to open input file");
        return;
    }

    FileStream outputFile(L"data.lzw", FileStream::WriteOnly);
    if (!outputFile.IsAvailable())
    {
        Console::WriteLine(L"Failed to create output file");
        return;
    }

    LzwEncoder encoder;
    EncoderStream encoderStream(outputFile, encoder);

    char buffer[1024];
    while (true)
    {
        vint bytesRead = inputFile.Read(buffer, sizeof(buffer));
        if (bytesRead == 0) break;
        
        vint bytesWritten = encoderStream.Write(buffer, bytesRead);
        if (bytesWritten != bytesRead)
        {
            Console::WriteLine(L"Compression failed");
            return;
        }
    }
    Console::WriteLine(L"Compression completed successfully");
}
catch (...)
{
    Console::WriteLine(L"Exception occurred during compression");
}
```

## Performance Considerations

1. **Buffer Size**: Use appropriate buffer sizes (typically 1024-8192 bytes) for optimal performance.

2. **Dictionary Size**: LZW uses a dictionary that can grow up to 16MB (`MaxDictionarySize`). Monitor memory usage for large datasets.

3. **Byte Filtering**: Use byte filters when possible to improve compression ratio and reduce dictionary size.

4. **Stream Closing**: Always ensure `Close()` is called on encoders to flush remaining data.

## When to Use LZW

LZW compression is most effective for:
- Text data with repeated patterns
- Configuration files
- Source code
- Structured data with redundancy

Less effective for:
- Already compressed data (images, videos)
- Random or encrypted data
- Very small files (overhead may exceed benefits)

## Limitations

- **Dictionary Reset**: The current implementation doesn't support dictionary reset for very large files
- **Single-threaded**: Compression/decompression is single-threaded
- **Memory Usage**: Dictionary can consume significant memory for complex data

For production use with large files, consider using the helper functions `CompressStream` and `DecompressStream` which handle batching automatically and are more memory-efficient.