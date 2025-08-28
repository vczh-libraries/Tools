# Using TestEncoding for Encoding Detection

The `TestEncoding` function in VlppOS provides automatic detection of text encoding from binary data. This function analyzes byte patterns and BOM (Byte Order Mark) information to determine the most likely text encoding format.

## Function Signature

```cpp
namespace vl::stream
{
    void TestEncoding(
        unsigned char* buffer,           // Binary data to analyze
        vint size,                      // Size of buffer in bytes
        BomEncoder::Encoding& encoding, // Returns detected encoding
        bool& containsBom              // Returns true if BOM found
    );
}
```

## Understanding the Detection Process

### Supported Encodings

```cpp
// Detectable encoding types
BomEncoder::Encoding detected_encoding;

// Possible values:
BomEncoder::Mbcs     // ANSI/Multi-byte (default fallback)
BomEncoder::Utf8     // UTF-8 with or without BOM
BomEncoder::Utf16    // UTF-16 Little Endian
BomEncoder::Utf16BE  // UTF-16 Big Endian
```

### BOM Detection

The function first checks for BOM (Byte Order Mark) patterns:

```cpp
// BOM patterns detected:
// UTF-8:       EF BB BF
// UTF-16 LE:   FF FE  
// UTF-16 BE:   FE FF
// UTF-32 LE:   FF FE 00 00 (treated as UTF-16)
// UTF-32 BE:   00 00 FE FF (treated as UTF-16)
```

## Basic Usage

### Simple Encoding Detection

```cpp
using namespace vl::stream;

void DetectFileEncoding(const WString& filename)
{
    FileStream fileStream(filename, FileStream::ReadOnly);
    if (!fileStream.IsAvailable()) return;
    
    // Read first 1024 bytes for analysis
    vint bufferSize = 1024;
    vint fileSize = (vint)fileStream.Size();
    if (fileSize < bufferSize) bufferSize = fileSize;
    
    Array<unsigned char> buffer(bufferSize);
    vint bytesRead = fileStream.Read(buffer.Buffer(), bufferSize);
    
    BomEncoder::Encoding encoding;
    bool hasBom;
    
    TestEncoding(buffer.Buffer(), bytesRead, encoding, hasBom);
    
    WString encodingName;
    switch (encoding)
    {
    case BomEncoder::Mbcs:    encodingName = L"ANSI/MBCS"; break;
    case BomEncoder::Utf8:    encodingName = L"UTF-8"; break;
    case BomEncoder::Utf16:   encodingName = L"UTF-16 LE"; break;
    case BomEncoder::Utf16BE: encodingName = L"UTF-16 BE"; break;
    }
    
    Console::WriteLine(L"File: " + filename);
    Console::WriteLine(L"Detected encoding: " + encodingName);
    Console::WriteLine(L"Has BOM: " + (hasBom ? L"Yes" : L"No"));
}
```

### Using with File Reading

```cpp
// Automatically detect encoding and read file content
WString ReadFileWithDetection(const WString& filename)
{
    FileStream fileStream(filename, FileStream::ReadOnly);
    if (!fileStream.IsAvailable()) return L"";
    
    // Read sample for encoding detection
    vint sampleSize = 2048;
    Array<unsigned char> sample(sampleSize);
    vint bytesRead = fileStream.Read(sample.Buffer(), sampleSize);
    
    BomEncoder::Encoding encoding;
    bool hasBom;
    TestEncoding(sample.Buffer(), bytesRead, encoding, hasBom);
    
    // Reset stream to beginning
    fileStream.SeekFromBegin(0);
    
    // Use appropriate decoder based on detection
    WString content;
    switch (encoding)
    {
    case BomEncoder::Utf8:
        {
            if (hasBom)
            {
                BomDecoder decoder;
                DecoderStream decoderStream(fileStream, decoder);
                StreamReader reader(decoderStream);
                content = reader.ReadToEnd();
            }
            else
            {
                Utf8Decoder decoder;
                DecoderStream decoderStream(fileStream, decoder);
                StreamReader reader(decoderStream);
                content = reader.ReadToEnd();
            }
        }
        break;
        
    case BomEncoder::Utf16:
    case BomEncoder::Utf16BE:
        {
            BomDecoder decoder;
            DecoderStream decoderStream(fileStream, decoder);
            StreamReader reader(decoderStream);
            content = reader.ReadToEnd();
        }
        break;
        
    case BomEncoder::Mbcs:
    default:
        {
            MbcsDecoder decoder;
            DecoderStream decoderStream(fileStream, decoder);
            StreamReader reader(decoderStream);
            content = reader.ReadToEnd();
        }
        break;
    }
    
    return content;
}
```

## Advanced Usage Patterns

### Batch File Analysis

```cpp
// Analyze multiple files and report encoding statistics
void AnalyzeDirectoryEncodings(const WString& directoryPath)
{
    // This would typically use Folder::GetFiles()
    List<WString> files;
    files.Add(directoryPath + L"/file1.txt");
    files.Add(directoryPath + L"/file2.txt");
    files.Add(directoryPath + L"/file3.txt");
    
    Dictionary<vint, vint> encodingCounts;
    vint filesWithBom = 0;
    vint totalFiles = 0;
    
    for (vint i = 0; i < files.Count(); i++)
    {
        FileStream fileStream(files[i], FileStream::ReadOnly);
        if (!fileStream.IsAvailable()) continue;
        
        Array<unsigned char> buffer(1024);
        vint bytesRead = fileStream.Read(buffer.Buffer(), 1024);
        
        BomEncoder::Encoding encoding;
        bool hasBom;
        TestEncoding(buffer.Buffer(), bytesRead, encoding, hasBom);
        
        // Count encodings
        vint encodingKey = (vint)encoding;
        if (encodingCounts.Keys().Contains(encodingKey))
        {
            encodingCounts.Set(encodingKey, encodingCounts[encodingKey] + 1);
        }
        else
        {
            encodingCounts.Add(encodingKey, 1);
        }
        
        if (hasBom) filesWithBom++;
        totalFiles++;
    }
    
    Console::WriteLine(L"Encoding Analysis Results:");
    Console::WriteLine(L"Total files: " + itow(totalFiles));
    Console::WriteLine(L"Files with BOM: " + itow(filesWithBom));
    
    for (vint i = 0; i < encodingCounts.Count(); i++)
    {
        vint encodingType = encodingCounts.Keys()[i];
        vint count = encodingCounts.Values()[i];
        
        WString typeName;
        switch ((BomEncoder::Encoding)encodingType)
        {
        case BomEncoder::Mbcs:    typeName = L"ANSI/MBCS"; break;
        case BomEncoder::Utf8:    typeName = L"UTF-8"; break;
        case BomEncoder::Utf16:   typeName = L"UTF-16 LE"; break;
        case BomEncoder::Utf16BE: typeName = L"UTF-16 BE"; break;
        }
        
        Console::WriteLine(typeName + L": " + itow(count) + L" files");
    }
}
```

### Smart File Conversion

```cpp
// Convert files to UTF-8 if they're not already
void ConvertToUtf8IfNeeded(const WString& filename)
{
    FileStream fileStream(filename, FileStream::ReadOnly);
    if (!fileStream.IsAvailable()) return;
    
    // Detect current encoding
    Array<unsigned char> buffer(2048);
    vint bytesRead = fileStream.Read(buffer.Buffer(), 2048);
    
    BomEncoder::Encoding encoding;
    bool hasBom;
    TestEncoding(buffer.Buffer(), bytesRead, encoding, hasBom);
    
    // Skip if already UTF-8
    if (encoding == BomEncoder::Utf8)
    {
        Console::WriteLine(L"File already UTF-8: " + filename);
        return;
    }
    
    // Read content with detected encoding
    fileStream.SeekFromBegin(0);
    WString content;
    
    switch (encoding)
    {
    case BomEncoder::Utf16:
    case BomEncoder::Utf16BE:
        {
            BomDecoder decoder;
            DecoderStream decoderStream(fileStream, decoder);
            StreamReader reader(decoderStream);
            content = reader.ReadToEnd();
        }
        break;
        
    case BomEncoder::Mbcs:
    default:
        {
            MbcsDecoder decoder;
            DecoderStream decoderStream(fileStream, decoder);
            StreamReader reader(decoderStream);
            content = reader.ReadToEnd();
        }
        break;
    }
    
    fileStream.Close();
    
    // Write back as UTF-8
    FileStream outputStream(filename, FileStream::WriteOnly);
    Utf8Encoder encoder;
    EncoderStream encoderStream(outputStream, encoder);
    StreamWriter writer(encoderStream);
    
    writer.WriteString(content);
    
    Console::WriteLine(L"Converted to UTF-8: " + filename);
}
```

### Memory Buffer Analysis

```cpp
// Analyze encoding of data in memory
void AnalyzeMemoryBuffer(const Array<vuint8_t>& data)
{
    BomEncoder::Encoding encoding;
    bool hasBom;
    
    TestEncoding(
        const_cast<unsigned char*>(data.Buffer()), 
        data.Count(), 
        encoding, 
        hasBom
    );
    
    Console::WriteLine(L"Memory buffer analysis:");
    Console::WriteLine(L"Size: " + itow(data.Count()) + L" bytes");
    
    switch (encoding)
    {
    case BomEncoder::Utf8:
        Console::WriteLine(L"Detected: UTF-8" + (hasBom ? L" with BOM" : L""));
        break;
    case BomEncoder::Utf16:
        Console::WriteLine(L"Detected: UTF-16 LE with BOM");
        break;
    case BomEncoder::Utf16BE:
        Console::WriteLine(L"Detected: UTF-16 BE with BOM");
        break;
    case BomEncoder::Mbcs:
        Console::WriteLine(L"Detected: ANSI/MBCS (or unknown)");
        break;
    }
}
```

## Detection Accuracy Considerations

### Sample Size Requirements

```cpp
// Use adequate sample size for reliable detection
void TestDetectionAccuracy()
{
    WString testFile = L"sample.txt";
    FileStream fileStream(testFile, FileStream::ReadOnly);
    
    // Test different sample sizes
    Array<vint> sampleSizes = {64, 256, 1024, 4096};
    
    for (vint i = 0; i < sampleSizes.Count(); i++)
    {
        vint sampleSize = sampleSizes[i];
        fileStream.SeekFromBegin(0);
        
        Array<unsigned char> buffer(sampleSize);
        vint bytesRead = fileStream.Read(buffer.Buffer(), sampleSize);
        
        BomEncoder::Encoding encoding;
        bool hasBom;
        TestEncoding(buffer.Buffer(), bytesRead, encoding, hasBom);
        
        Console::WriteLine(L"Sample size " + itow(sampleSize) + 
                           L": " + itow((vint)encoding));
    }
}
```

## Best Practices

1. **Use Adequate Sample Size**: Analyze at least 1024 bytes for reliable detection, more for complex content.

2. **Handle Detection Failures**: Always have a fallback strategy when encoding detection is uncertain.

3. **Validate Detection Results**: Consider the context and expected encoding when interpreting results.

4. **Combine with BOM Detection**: Use both BOM presence and pattern analysis for best accuracy.

5. **Document Assumptions**: Make it clear when your application relies on automatic encoding detection.

The `TestEncoding` function provides a practical solution for handling files of unknown encoding, enabling robust text processing in environments with mixed encoding standards.