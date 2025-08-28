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

## Best Practices

1. **Use Adequate Sample Size**: Analyze at least 1024 bytes for reliable detection, more for complex content.

2. **Handle Detection Failures**: Always have a fallback strategy when encoding detection is uncertain.

3. **Validate Detection Results**: Consider the context and expected encoding when interpreting results.

4. **Combine with BOM Detection**: Use both BOM presence and pattern analysis for best accuracy.

5. **Document Assumptions**: Make it clear when your application relies on automatic encoding detection.

The `TestEncoding` function provides a practical solution for handling files of unknown encoding, enabling robust text processing in environments with mixed encoding standards.