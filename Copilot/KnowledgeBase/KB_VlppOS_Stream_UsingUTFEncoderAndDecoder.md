# Using UTF Encoder and Decoder

VlppOS provides specialized UTF encoder and decoder classes that are type-aliases for the `UtfGeneralEncoder` and `UtfGeneralDecoder` templates, configured for common UTF conversion scenarios. These classes simplify the conversion between `wchar_t` and specific UTF encodings.

## Available UTF Encoder/Decoder Classes

### UTF-8 Encoders and Decoders

```cpp
using namespace vl::stream;

// UTF-8 classes (aliases for UtfGeneralEncoder/Decoder<char8_t, wchar_t>)
class Utf8Encoder : public UtfGeneralEncoder<char8_t, wchar_t> {};
class Utf8Decoder : public UtfGeneralDecoder<char8_t, wchar_t> {};
```

### UTF-16 Encoders and Decoders

```cpp
// UTF-16 Little Endian classes  
class Utf16Encoder : public UtfGeneralEncoder<char16_t, wchar_t> {};
class Utf16Decoder : public UtfGeneralDecoder<char16_t, wchar_t> {};

// UTF-16 Big Endian classes
class Utf16BEEncoder : public UtfGeneralEncoder<char16be_t, wchar_t> {};
class Utf16BEDecoder : public UtfGeneralDecoder<char16be_t, wchar_t> {};
```

### UTF-32 Encoders and Decoders

```cpp
// UTF-32 classes
class Utf32Encoder : public UtfGeneralEncoder<char32_t, wchar_t> {};
class Utf32Decoder : public UtfGeneralDecoder<char32_t, wchar_t> {};
```

## Using UTF-8 Encoder and Decoder

### Writing UTF-8 Content

```cpp
using namespace vl::stream;

// Write wchar_t strings to UTF-8 file
FileStream fileStream(L"output_utf8.txt", FileStream::WriteOnly);
Utf8Encoder encoder;
EncoderStream encoderStream(fileStream, encoder);
StreamWriter writer(encoderStream);

writer.WriteString(L"Hello, ??!");
writer.WriteLine(L"UTF-8 encoded content: סהצü");
writer.WriteString(L"Emoji: ??????");
```

### Reading UTF-8 Content

```cpp
// Read UTF-8 file and decode to wchar_t
FileStream fileStream(L"input_utf8.txt", FileStream::ReadOnly);
Utf8Decoder decoder;
DecoderStream decoderStream(fileStream, decoder);
StreamReader reader(decoderStream);

WString line1 = reader.ReadLine();
WString line2 = reader.ReadLine();
WString remaining = reader.ReadToEnd();

Console::WriteLine(L"Line 1: " + line1);
Console::WriteLine(L"Line 2: " + line2);
Console::WriteLine(L"Rest: " + remaining);
```

## Using UTF-16 Encoders and Decoders

### Little Endian UTF-16

```cpp
// Write to UTF-16 LE format
FileStream outputStream(L"output_utf16le.txt", FileStream::WriteOnly);
Utf16Encoder utf16Encoder;
EncoderStream utf16EncoderStream(outputStream, utf16Encoder);
StreamWriter utf16Writer(utf16EncoderStream);

utf16Writer.WriteString(L"UTF-16 Little Endian content");

// Read from UTF-16 LE format
FileStream inputStream(L"input_utf16le.txt", FileStream::ReadOnly);
Utf16Decoder utf16Decoder;
DecoderStream utf16DecoderStream(inputStream, utf16Decoder);
StreamReader utf16Reader(utf16DecoderStream);

WString content = utf16Reader.ReadToEnd();
Console::WriteLine(L"UTF-16 LE content: " + content);
```

### Big Endian UTF-16

```cpp
// Write to UTF-16 BE format (useful for certain protocols/systems)
MemoryStream memoryStream;
Utf16BEEncoder beEncoder;
EncoderStream beEncoderStream(memoryStream, beEncoder);
StreamWriter beWriter(beEncoderStream);

beWriter.WriteString(L"Big Endian UTF-16 content");

// Read back UTF-16 BE format
memoryStream.SeekFromBegin(0);
Utf16BEDecoder beDecoder;
DecoderStream beDecoderStream(memoryStream, beDecoder);
StreamReader beReader(beDecoderStream);

WString beContent = beReader.ReadToEnd();
Console::WriteLine(L"UTF-16 BE content: " + beContent);
```

## Using UTF-32 Encoder and Decoder

### Working with UTF-32

```cpp
// Write to UTF-32 format (useful for Unicode code point processing)
FileStream outputStream(L"output_utf32.txt", FileStream::WriteOnly);
Utf32Encoder utf32Encoder;
EncoderStream utf32EncoderStream(outputStream, utf32Encoder);
StreamWriter utf32Writer(utf32EncoderStream);

utf32Writer.WriteString(L"UTF-32 content with complex characters: ??????????");

// Read from UTF-32 format
FileStream inputStream(L"input_utf32.txt", FileStream::ReadOnly);
Utf32Decoder utf32Decoder;
DecoderStream utf32DecoderStream(inputStream, utf32Decoder);
StreamReader utf32Reader(utf32DecoderStream);

WString utf32Content = utf32Reader.ReadToEnd();
Console::WriteLine(L"UTF-32 content: " + utf32Content);
```

## Practical Usage Patterns

### Cross-Platform Text Files

```cpp
// For maximum compatibility, use UTF-8 for file storage
void SaveCrossPlatformTextFile(const WString& filename, const WString& content)
{
    FileStream fileStream(filename, FileStream::WriteOnly);
    Utf8Encoder encoder;
    EncoderStream encoderStream(fileStream, encoder);
    StreamWriter writer(encoderStream);
    
    writer.WriteString(content);
}

WString LoadCrossPlatformTextFile(const WString& filename)
{
    FileStream fileStream(filename, FileStream::ReadOnly);
    Utf8Decoder decoder;
    DecoderStream decoderStream(fileStream, decoder);
    StreamReader reader(decoderStream);
    
    return reader.ReadToEnd();
}
```

### Protocol Implementation

```cpp
// Network protocols often require specific UTF encodings
void SendUtf8OverNetwork(IStream& networkStream, const WString& message)
{
    Utf8Encoder encoder;
    EncoderStream encoderStream(networkStream, encoder);
    StreamWriter writer(encoderStream);
    
    writer.WriteString(message);
}

WString ReceiveUtf8FromNetwork(IStream& networkStream)
{
    Utf8Decoder decoder;
    DecoderStream decoderStream(networkStream, decoder);
    StreamReader reader(decoderStream);
    
    return reader.ReadToEnd();
}
```

### Data Format Conversion

```cpp
// Convert between different UTF formats
void ConvertUtf8ToUtf16BE(const WString& inputFile, const WString& outputFile)
{
    // Read UTF-8
    FileStream inputStream(inputFile, FileStream::ReadOnly);
    Utf8Decoder utf8Decoder;
    DecoderStream utf8DecoderStream(inputStream, utf8Decoder);
    StreamReader reader(utf8DecoderStream);
    
    WString content = reader.ReadToEnd();
    
    // Write UTF-16 BE
    FileStream outputStream(outputFile, FileStream::WriteOnly);
    Utf16BEEncoder utf16beEncoder;
    EncoderStream utf16beEncoderStream(outputStream, utf16beEncoder);
    StreamWriter writer(utf16beEncoderStream);
    
    writer.WriteString(content);
}
```

## Error Handling and Best Practices

### Safe UTF Processing

```cpp
bool SafeProcessUtfFile(const WString& filename)
{
    try
    {
        FileStream fileStream(filename, FileStream::ReadOnly);
        Utf8Decoder decoder;
        DecoderStream decoderStream(fileStream, decoder);
        StreamReader reader(decoderStream);
        
        while (!reader.IsEnd())
        {
            WString line = reader.ReadLine();
            // Process line...
        }
        return true;
    }
    catch (...)
    {
        Console::WriteLine(L"Failed to process UTF file: " + filename);
        return false;
    }
}
```

## When to Use Each Encoder/Decoder

1. **Utf8Encoder/Decoder**: Most common choice for file storage, web content, and cross-platform compatibility
2. **Utf16Encoder/Decoder**: When working with Windows-native text formats or specific protocols
3. **Utf16BEEncoder/Decoder**: For big-endian systems or protocols that require big-endian UTF-16
4. **Utf32Encoder/Decoder**: When you need direct Unicode code point access or working with systems that prefer UTF-32

These specialized UTF classes provide convenient, type-safe access to Unicode text encoding and decoding operations while maintaining the flexibility of the underlying general encoder/decoder system.