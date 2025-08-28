# Using UtfGeneralEncoder and UtfGeneralDecoder

`UtfGeneralEncoder<TNative, TExpected>` and `UtfGeneralDecoder<TNative, TExpected>` are template classes that provide encoding and decoding between different UTF character types. These classes handle the conversion between `wchar_t`, `char8_t`, `char16_t`, `char16be_t`, and `char32_t` character types.

## Understanding the Template Parameters

### Template Structure

```cpp
template<typename TNative, typename TExpected>
class UtfGeneralEncoder : public EncoderBase;

template<typename TNative, TExpected>  
class UtfGeneralDecoder : public DecoderBase;
```

- **TNative**: The character type that the target stream expects (stream's native format)
- **TExpected**: The character type that you want to write/read (your application's format)

### Available Character Types

```cpp
// Standard character types
wchar_t     // Platform-dependent UTF (UTF-16 on Windows, UTF-32 on Linux/macOS)
char8_t     // UTF-8
char16_t    // UTF-16 Little Endian
char16be_t  // UTF-16 Big Endian (custom type)
char32_t    // UTF-32
```

## Using UtfGeneralEncoder

### Basic Encoding Example

```cpp
using namespace vl::stream;

// Convert from wchar_t to UTF-8 for file storage
FileStream fileStream(L"output.txt", FileStream::WriteOnly);
UtfGeneralEncoder<char8_t, wchar_t> encoder;
EncoderStream encoderStream(fileStream, encoder);
StreamWriter writer(encoderStream);

writer.WriteString(L"Hello, ??! Unicode text.");
```

### Encoding Between Different UTF Types

```cpp
// Convert from wchar_t to UTF-16 Big Endian
MemoryStream memoryStream;
UtfGeneralEncoder<char16be_t, wchar_t> beEncoder;
EncoderStream beEncoderStream(memoryStream, beEncoder);
StreamWriter beWriter(beEncoderStream);

beWriter.WriteString(L"Big Endian UTF-16 content");

// Convert from UTF-32 to UTF-8
MemoryStream outputStream;
UtfGeneralEncoder<char8_t, char32_t> utf32to8Encoder;
EncoderStream utf32EncoderStream(outputStream, utf32to8Encoder);

// Write char32_t data directly to the stream
U32String utf32Text = u32tow(L"UTF-32 source text");
utf32EncoderStream.Write(utf32Text.Buffer(), utf32Text.Length() * sizeof(char32_t));
```

## Using UtfGeneralDecoder  

### Basic Decoding Example

```cpp
// Read UTF-8 file and decode to wchar_t
FileStream fileStream(L"input.txt", FileStream::ReadOnly);
UtfGeneralDecoder<char8_t, wchar_t> decoder;
DecoderStream decoderStream(fileStream, decoder);
StreamReader reader(decoderStream);

WString content = reader.ReadToEnd();
Console::WriteLine(L"Decoded content: " + content);
```

### Decoding Between Different UTF Types

```cpp
// Convert from UTF-16 Big Endian to wchar_t
MemoryStream inputStream; // Contains UTF-16 BE data
UtfGeneralDecoder<char16be_t, wchar_t> beDecoder;
DecoderStream beDecoderStream(inputStream, beDecoder);
StreamReader beReader(beDecoderStream);

WString decodedText = beReader.ReadToEnd();

// Convert from UTF-8 to UTF-32
MemoryStream utf8Stream; // Contains UTF-8 data  
UtfGeneralDecoder<char8_t, char32_t> utf8to32Decoder;
DecoderStream utf8DecoderStream(utf8Stream, utf8to32Decoder);

// Read char32_t data directly
char32_t buffer[1024];
vint bytesRead = utf8DecoderStream.Read(buffer, sizeof(buffer));
```

## Optimized Same-Type Handling

When `TNative` and `TExpected` are the same type, the implementation is optimized to perform direct copying without conversion:

```cpp
// These are optimized to simple memory copying
UtfGeneralEncoder<wchar_t, wchar_t> sameTypeEncoder;
UtfGeneralDecoder<char8_t, char8_t> sameTypeDecoder;
```

## Platform-Specific Optimizations

The framework provides special optimizations for platform-specific character mappings:

```cpp
#if defined VCZH_WCHAR_UTF16
// On Windows (UTF-16 wchar_t):
// UtfGeneralEncoder<char16_t, wchar_t> is optimized
// UtfGeneralEncoder<wchar_t, char16_t> is optimized

#elif defined VCZH_WCHAR_UTF32  
// On Linux/macOS (UTF-32 wchar_t):
// UtfGeneralEncoder<char32_t, wchar_t> is optimized
// UtfGeneralEncoder<wchar_t, char32_t> is optimized
#endif
```

## Error Handling

UTF encoding/decoding operations can encounter invalid character sequences:

```cpp
try
{
    FileStream fileStream(L"potentially_corrupt.txt", FileStream::ReadOnly);
    UtfGeneralDecoder<char8_t, wchar_t> decoder;
    DecoderStream decoderStream(fileStream, decoder);
    StreamReader reader(decoderStream);
    
    WString content = reader.ReadToEnd();
}
catch (...)
{
    Console::WriteLine(L"Failed to decode file - may contain invalid UTF-8 sequences");
}
```

## Best Practices

1. **Choose Appropriate Character Types**: Use `char8_t` for UTF-8 file storage and network transmission, `wchar_t` for application-internal string handling.

2. **Use Alias Classes When Available**: Prefer `Utf8Encoder`/`Utf8Decoder` over `UtfGeneralEncoder<char8_t, wchar_t>` for common cases.

3. **Consider Platform Differences**: Be aware that `wchar_t` size varies between platforms (16-bit on Windows, 32-bit on Linux/macOS).

4. **Handle Invalid Sequences**: Always be prepared to handle exceptions when decoding potentially malformed data.

5. **Minimize Conversions**: When possible, work with the same character type throughout your pipeline to avoid unnecessary conversions.

These general encoder/decoder classes provide the foundation for all UTF encoding operations in VlppOS, offering both flexibility and performance optimization for cross-platform text processing.