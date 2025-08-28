# Using Utf8Base64Encoder and Utf8Base64Decoder

`Utf8Base64Encoder` and `Utf8Base64Decoder` provide Base64 encoding and decoding functionality, converting binary data to and from Base64 text representation using UTF-8 character encoding. These classes are useful for embedding binary data in text formats or transmitting binary data over text-based protocols.

## Understanding Base64 Encoding

### Base64 Concepts

Base64 encoding converts binary data into a text representation using 64 printable ASCII characters:
- `A-Z` (26 characters)
- `a-z` (26 characters) 
- `0-9` (10 characters)
- `+` and `/` (2 characters)

Every 3 bytes of binary data becomes 4 Base64 characters, with padding (`=`) used when needed.

### Encoding Process

```cpp
// 3 binary bytes ? 4 Base64 characters
// Input:  [0x4D, 0x61, 0x6E]  (bytes for "Man")
// Output: "TWFu"               (Base64 representation)
```

## Using Utf8Base64Encoder

### Basic Binary to Base64 Encoding

```cpp
using namespace vl::stream;

// Encode binary data to Base64
void EncodeBinaryToBase64()
{
    // Source binary data
    Array<vuint8_t> binaryData(256);
    for (vint i = 0; i < 256; i++)
    {
        binaryData[i] = (vuint8_t)i;
    }
    
    // Encode to Base64
    MemoryStream outputStream;
    Utf8Base64Encoder encoder;
    EncoderStream encoderStream(outputStream, encoder);
    
    // Write binary data
    encoderStream.Write(binaryData.Buffer(), binaryData.Count());
    encoderStream.Close();
    
    // Get Base64 result as UTF-8 bytes
    outputStream.SeekFromBegin(0);
    Array<char8_t> base64Utf8((vint)outputStream.Size());
    outputStream.Read(base64Utf8.Buffer(), base64Utf8.Count());
    
    Console::WriteLine(L"Encoded " + itow(binaryData.Count()) + 
                       L" bytes to " + itow(base64Utf8.Count()) + L" Base64 characters");
}
```

### Converting Binary Files to Base64

```cpp
// Convert a binary file to Base64 text
WString ConvertFileToBase64(const WString& binaryFilename)
{
    FileStream inputStream(binaryFilename, FileStream::ReadOnly);
    if (!inputStream.IsAvailable()) return L"";
    
    // Create Base64 encoding stream
    MemoryStream base64Stream;
    Utf8Base64Encoder encoder;
    EncoderStream encoderStream(base64Stream, encoder);
    
    // Read and encode file in chunks
    Array<vuint8_t> buffer(4096);
    while (true)
    {
        vint bytesRead = inputStream.Read(buffer.Buffer(), buffer.Count());
        if (bytesRead == 0) break;
        
        encoderStream.Write(buffer.Buffer(), bytesRead);
    }
    encoderStream.Close();
    
    // Convert UTF-8 Base64 to wchar_t string
    base64Stream.SeekFromBegin(0);
    Utf8Decoder utf8Decoder;
    DecoderStream utf8DecoderStream(base64Stream, utf8Decoder);
    StreamReader reader(utf8DecoderStream);
    
    return reader.ReadToEnd();
}
```

### Creating Base64 Data URLs

```cpp
// Create data URL with Base64 encoding (useful for web content)
WString CreateDataUrl(const Array<vuint8_t>& imageData, const WString& mimeType)
{
    // Encode image data to Base64
    MemoryStream base64Stream;
    Utf8Base64Encoder encoder;
    EncoderStream encoderStream(base64Stream, encoder);
    
    encoderStream.Write(imageData.Buffer(), imageData.Count());
    encoderStream.Close();
    
    // Convert to string
    base64Stream.SeekFromBegin(0);
    Utf8Decoder decoder;
    DecoderStream decoderStream(base64Stream, decoder);
    StreamReader reader(decoderStream);
    
    WString base64String = reader.ReadToEnd();
    
    // Create data URL
    return L"data:" + mimeType + L";base64," + base64String;
}

// Usage example
void CreateImageDataUrl()
{
    // Load image file (simplified)
    Array<vuint8_t> imageBytes(1024); // Would contain actual image data
    
    WString dataUrl = CreateDataUrl(imageBytes, L"image/png");
    Console::WriteLine(L"Data URL: " + dataUrl);
}
```

## Using Utf8Base64Decoder

### Basic Base64 to Binary Decoding

```cpp
// Decode Base64 string back to binary data
Array<vuint8_t> DecodeBase64String(const WString& base64String)
{
    // Convert string to UTF-8 stream
    MemoryStream utf8Stream;
    Utf8Encoder utf8Encoder;
    EncoderStream utf8EncoderStream(utf8Stream, utf8Encoder);
    StreamWriter writer(utf8EncoderStream);
    
    writer.WriteString(base64String);
    utf8EncoderStream.Close();
    
    // Decode Base64 to binary
    utf8Stream.SeekFromBegin(0);
    Utf8Base64Decoder decoder;
    DecoderStream decoderStream(utf8Stream, decoder);
    
    MemoryStream binaryStream;
    Array<vuint8_t> buffer(4096);
    
    while (true)
    {
        vint bytesRead = decoderStream.Read(buffer.Buffer(), buffer.Count());
        if (bytesRead == 0) break;
        
        binaryStream.Write(buffer.Buffer(), bytesRead);
    }
    
    // Return binary data
    Array<vuint8_t> result((vint)binaryStream.Size());
    binaryStream.SeekFromBegin(0);
    binaryStream.Read(result.Buffer(), result.Count());
    
    return result;
}
```

### Converting Base64 Files to Binary

```cpp
// Read Base64 text file and convert to binary file
bool ConvertBase64FileToBinary(const WString& base64Filename, const WString& binaryFilename)
{
    try
    {
        // Read Base64 text file
        FileStream base64FileStream(base64Filename, FileStream::ReadOnly);
        Utf8Decoder utf8Decoder;
        DecoderStream utf8DecoderStream(base64FileStream, utf8Decoder);
        StreamReader reader(utf8DecoderStream);
        
        WString base64Content = reader.ReadToEnd();
        base64FileStream.Close();
        
        // Convert string back to UTF-8 for decoding
        MemoryStream utf8Stream;
        Utf8Encoder utf8Encoder;
        EncoderStream utf8EncoderStream(utf8Stream, utf8Encoder);
        StreamWriter writer(utf8EncoderStream);
        
        writer.WriteString(base64Content);
        utf8EncoderStream.Close();
        
        // Decode Base64 to binary file
        utf8Stream.SeekFromBegin(0);
        Utf8Base64Decoder decoder;
        DecoderStream decoderStream(utf8Stream, decoder);
        
        FileStream binaryFileStream(binaryFilename, FileStream::WriteOnly);
        
        Array<vuint8_t> buffer(4096);
        while (true)
        {
            vint bytesRead = decoderStream.Read(buffer.Buffer(), buffer.Count());
            if (bytesRead == 0) break;
            
            binaryFileStream.Write(buffer.Buffer(), bytesRead);
        }
        
        return true;
    }
    catch (...)
    {
        Console::WriteLine(L"Failed to convert Base64 file: " + base64Filename);
        return false;
    }
}
```

### Parsing Data URLs

```cpp
// Extract and decode Base64 data from data URLs
Array<vuint8_t> ExtractDataFromDataUrl(const WString& dataUrl)
{
    // Find Base64 data after "base64,"
    vint base64Start = dataUrl.IndexOf(L"base64,");
    if (base64Start == -1)
    {
        Console::WriteLine(L"Invalid data URL format");
        return Array<vuint8_t>(0);
    }
    
    base64Start += 7; // Skip "base64,"
    WString base64Data = dataUrl.Sub(base64Start, dataUrl.Length() - base64Start);
    
    // Decode Base64 data
    return DecodeBase64String(base64Data);
}

// Usage
void ProcessDataUrl()
{
    WString dataUrl = L"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    
    Array<vuint8_t> imageData = ExtractDataFromDataUrl(dataUrl);
    Console::WriteLine(L"Extracted " + itow(imageData.Count()) + L" bytes of image data");
}
```

## Complete Base64 Utilities

### Round-Trip Testing

```cpp
// Test Base64 encoding and decoding round-trip
void TestBase64RoundTrip()
{
    // Create test data
    Array<vuint8_t> originalData(1000);
    for (vint i = 0; i < originalData.Count(); i++)
    {
        originalData[i] = (vuint8_t)(i % 256);
    }
    
    // Encode to Base64
    MemoryStream base64Stream;
    Utf8Base64Encoder encoder;
    EncoderStream encoderStream(base64Stream, encoder);
    
    encoderStream.Write(originalData.Buffer(), originalData.Count());
    encoderStream.Close();
    
    // Decode back to binary
    base64Stream.SeekFromBegin(0);
    Utf8Base64Decoder decoder;
    DecoderStream decoderStream(base64Stream, decoder);
    
    Array<vuint8_t> decodedData(originalData.Count());
    vint bytesRead = decoderStream.Read(decodedData.Buffer(), decodedData.Count());
    
    // Verify round-trip
    bool success = (bytesRead == originalData.Count());
    if (success)
    {
        for (vint i = 0; i < originalData.Count(); i++)
        {
            if (originalData[i] != decodedData[i])
            {
                success = false;
                break;
            }
        }
    }
    
    Console::WriteLine(L"Base64 round-trip test: " + (success ? L"PASSED" : L"FAILED"));
}
```

### Base64 Utility Class

```cpp
// Utility class for common Base64 operations
class Base64Utility
{
public:
    static WString EncodeBytes(const Array<vuint8_t>& data)
    {
        MemoryStream base64Stream;
        Utf8Base64Encoder encoder;
        EncoderStream encoderStream(base64Stream, encoder);
        
        encoderStream.Write(data.Buffer(), data.Count());
        encoderStream.Close();
        
        base64Stream.SeekFromBegin(0);
        Utf8Decoder decoder;
        DecoderStream decoderStream(base64Stream, decoder);
        StreamReader reader(decoderStream);
        
        return reader.ReadToEnd();
    }
    
    static Array<vuint8_t> DecodeString(const WString& base64String)
    {
        MemoryStream utf8Stream;
        Utf8Encoder encoder;
        EncoderStream encoderStream(utf8Stream, encoder);
        StreamWriter writer(encoderStream);
        
        writer.WriteString(base64String);
        encoderStream.Close();
        
        utf8Stream.SeekFromBegin(0);
        Utf8Base64Decoder decoder;
        DecoderStream decoderStream(utf8Stream, decoder);
        
        MemoryStream binaryStream;
        CopyStream(decoderStream, binaryStream);
        
        Array<vuint8_t> result((vint)binaryStream.Size());
        binaryStream.SeekFromBegin(0);
        binaryStream.Read(result.Buffer(), result.Count());
        
        return result;
    }
    
    static WString EncodeFile(const WString& filename)
    {
        FileStream fileStream(filename, FileStream::ReadOnly);
        if (!fileStream.IsAvailable()) return L"";
        
        MemoryStream base64Stream;
        Utf8Base64Encoder encoder;
        EncoderStream encoderStream(base64Stream, encoder);
        
        CopyStream(fileStream, encoderStream);
        encoderStream.Close();
        
        base64Stream.SeekFromBegin(0);
        Utf8Decoder decoder;
        DecoderStream decoderStream(base64Stream, decoder);
        StreamReader reader(decoderStream);
        
        return reader.ReadToEnd();
    }
};
```

## Performance Considerations

### Chunked Processing

```cpp
// Process large files in chunks to manage memory usage
void ProcessLargeFileBase64(const WString& inputFile, const WString& outputFile)
{
    FileStream inputStream(inputFile, FileStream::ReadOnly);
    FileStream outputStream(outputFile, FileStream::WriteOnly);
    
    Utf8Base64Encoder encoder;
    EncoderStream encoderStream(outputStream, encoder);
    
    // Process in 64KB chunks
    Array<vuint8_t> buffer(65536);
    
    while (true)
    {
        vint bytesRead = inputStream.Read(buffer.Buffer(), buffer.Count());
        if (bytesRead == 0) break;
        
        encoderStream.Write(buffer.Buffer(), bytesRead);
    }
    
    encoderStream.Close();
    Console::WriteLine(L"Large file Base64 encoding completed");
}
```

## Best Practices

1. **Handle Padding Correctly**: Base64 encoders/decoders automatically manage padding characters (`=`).

2. **Use Streaming for Large Data**: Process large files in chunks rather than loading everything into memory.

3. **Validate Input Data**: When decoding, ensure the input contains only valid Base64 characters.

4. **Consider Line Breaking**: For email or other protocols, you may need to add line breaks to Base64 output.

5. **UTF-8 Consistency**: These classes specifically use UTF-8 for text representation, ensuring cross-platform compatibility.

`Utf8Base64Encoder` and `Utf8Base64Decoder` provide efficient, standards-compliant Base64 encoding functionality that integrates seamlessly with VlppOS's stream architecture.