# Using Stream Helper Functions

VlppOS provides three convenient helper functions for common stream operations: `CopyStream`, `CompressStream`, and `DecompressStream`. These functions simplify data transfer and compression tasks while handling the complexity of buffering and batching internally.

## CopyStream Function

The `CopyStream` function efficiently transfers data from any readable stream to any writable stream:

```cpp
vint CopyStream(stream::IStream& inputStream, stream::IStream& outputStream);
```

### Basic File Copying

```cpp
FileStream sourceFile(L"source.txt", FileStream::ReadOnly);
FileStream targetFile(L"target.txt", FileStream::WriteOnly);

vint bytesCopied = CopyStream(sourceFile, targetFile);
Console::WriteLine(L"Copied " + itow(bytesCopied) + L" bytes");
```

### Memory to File Transfer

```cpp
WString data = L"Hello, World!";
MemoryStream memoryStream;
{
    StreamWriter writer(memoryStream);
    writer.WriteString(data);
}
memoryStream.SeekFromBegin(0);

FileStream outputFile(L"output.txt", FileStream::WriteOnly);
vint bytesCopied = CopyStream(memoryStream, outputFile);
```

### Stream Chain Processing

Use `CopyStream` with encoding streams:

```cpp
FileStream inputFile(L"data.txt", FileStream::ReadOnly);
FileStream outputFile(L"data_utf8.txt", FileStream::WriteOnly);

// Convert to UTF-8 while copying
Utf8Encoder encoder;
EncoderStream encoderStream(outputFile, encoder);
vint bytesCopied = CopyStream(inputFile, encoderStream);
```

## CompressStream Function

The `CompressStream` function compresses data from an input stream to an output stream using LZW compression with automatic batching:

```cpp
void CompressStream(stream::IStream& inputStream, stream::IStream& outputStream);
```

### File Compression

```cpp
FileStream inputFile(L"large_file.txt", FileStream::ReadOnly);
FileStream compressedFile(L"large_file.lzw", FileStream::WriteOnly);

CompressStream(inputFile, compressedFile);
Console::WriteLine(L"Compression completed");
```

### Compression with Progress Tracking

```cpp
class ProgressTrackingStream : public IStream
{
private:
    IStream* targetStream;
    vint totalBytesWritten = 0;
    
public:
    ProgressTrackingStream(IStream* target) : targetStream(target) {}
    
    vint Write(void* buffer, vint size) override
    {
        vint written = targetStream->Write(buffer, size);
        totalBytesWritten += written;
        if (totalBytesWritten % 1048576 == 0)  // Report every MB
        {
            Console::WriteLine(L"Compressed: " + itow(totalBytesWritten / 1048576) + L" MB");
        }
        return written;
    }
    
    // Implement other IStream methods by delegating to targetStream...
};

FileStream inputFile(L"huge_file.dat", FileStream::ReadOnly);
FileStream outputFile(L"huge_file.lzw", FileStream::WriteOnly);
ProgressTrackingStream progressStream(&outputFile);

CompressStream(inputFile, progressStream);
```

### Memory Compression

```cpp
MemoryStream inputData;
// Fill inputData with content...

MemoryStream compressedData;
CompressStream(inputData, compressedData);

Console::WriteLine(L"Original size: " + itow(inputData.Size()));
Console::WriteLine(L"Compressed size: " + itow(compressedData.Size()));
double ratio = (double)compressedData.Size() / inputData.Size();
Console::WriteLine(L"Compression ratio: " + ftow(ratio));
```

## DecompressStream Function

The `DecompressStream` function decompresses data that was compressed using `CompressStream`:

```cpp
void DecompressStream(stream::IStream& inputStream, stream::IStream& outputStream);
```

### File Decompression

```cpp
FileStream compressedFile(L"data.lzw", FileStream::ReadOnly);
FileStream outputFile(L"data_restored.txt", FileStream::WriteOnly);

DecompressStream(compressedFile, outputFile);
Console::WriteLine(L"Decompression completed");
```

### Verification After Compression/Decompression

```cpp
// Compress
FileStream originalFile(L"original.txt", FileStream::ReadOnly);
FileStream compressedFile(L"compressed.lzw", FileStream::WriteOnly);
CompressStream(originalFile, compressedFile);

// Decompress
compressedFile.Close();
FileStream compressedInput(L"compressed.lzw", FileStream::ReadOnly);
FileStream restoredFile(L"restored.txt", FileStream::WriteOnly);
DecompressStream(compressedInput, restoredFile);

// Verify integrity
auto originalData = File(FilePath(L"original.txt")).ReadAllTextByBom();
auto restoredData = File(FilePath(L"restored.txt")).ReadAllTextByBom();

if (originalData == restoredData)
{
    Console::WriteLine(L"Compression/decompression successful - data integrity verified");
}
else
{
    Console::WriteLine(L"Data corruption detected!");
}
```

## Complete Compression Example

From the VlppOS implementation:

```cpp
const vint CompressionFragmentSize = 1048576;  // 1MB fragments

void CompressStream(stream::IStream& inputStream, stream::IStream& outputStream)
{
    Array<char> buffer(CompressionFragmentSize);
    while (true)
    {
        vint size = inputStream.Read(&buffer[0], buffer.Count());
        if (size == 0) break;

        MemoryStream compressedStream;
        {
            LzwEncoder encoder;
            EncoderStream encoderStream(compressedStream, encoder);
            encoderStream.Write(&buffer[0], size);
        }

        compressedStream.SeekFromBegin(0);
        {
            // Write original size
            vint32_t bufferSize = (vint32_t)size;
            outputStream.Write(&bufferSize, sizeof(bufferSize));
            
            // Write compressed size
            vint32_t compressedSize = (vint32_t)compressedStream.Size();
            outputStream.Write(&compressedSize, sizeof(compressedSize));
            
            // Write compressed data
            CopyStream(compressedStream, outputStream);
        }
    }
}
```

## Error Handling

Always handle potential errors when using stream helper functions:

```cpp
try
{
    FileStream inputFile(L"input.txt", FileStream::ReadOnly);
    if (!inputFile.IsAvailable())
    {
        Console::WriteLine(L"Cannot open input file");
        return;
    }

    FileStream outputFile(L"output.lzw", FileStream::WriteOnly);
    if (!outputFile.IsAvailable())
    {
        Console::WriteLine(L"Cannot create output file");
        return;
    }

    CompressStream(inputFile, outputFile);
    Console::WriteLine(L"Compression successful");
}
catch (...)
{
    Console::WriteLine(L"Compression failed with exception");
}
```

## Performance Characteristics

- **CopyStream**: Uses 1KB internal buffer, optimal for most file sizes
- **CompressStream**: Processes data in 1MB chunks to balance memory usage and compression efficiency
- **DecompressStream**: Matches `CompressStream` chunk processing for optimal decompression

## Best Practices

1. **File Size Considerations**: Helper functions are optimized for files of any size, but very large files (>1GB) should be processed with progress indicators.

2. **Stream State**: Ensure input streams are positioned correctly before calling helper functions.

3. **Error Recovery**: Compressed files created by `CompressStream` include size headers - corruption can be detected during decompression.

4. **Memory Usage**: Helper functions use bounded memory regardless of input size, making them safe for large files.

5. **Format Compatibility**: Only use `DecompressStream` on data compressed by `CompressStream` - they use a specific format with size headers.

These helper functions provide convenient, memory-efficient solutions for common stream operations while maintaining the flexibility of the underlying stream architecture.