# Working with StreamReader and StreamWriter

`StreamReader` and `StreamWriter` are text-oriented stream accessors that provide high-level text reading and writing capabilities on top of any `IStream`. They handle character-by-character operations and text formatting, making them the preferred way to work with text data.

## StreamReader for Text Reading

`StreamReader` provides methods to read text from any stream that stores characters as code points.

### Basic Text Reading Operations

```cpp
// Read from a UTF-8 file
FileStream fileStream(L"data.txt", FileStream::ReadOnly);
Utf8Decoder decoder;
DecoderStream decoderStream(fileStream, decoder);
StreamReader reader(decoderStream);

// Read single character
if (!reader.IsEnd())
{
    wchar_t ch = reader.ReadChar();
}

// Read entire content
WString content = reader.ReadToEnd();

// Read line by line
while (!reader.IsEnd())
{
    WString line = reader.ReadLine();
    // Process line
}

// Read specific number of characters
WString text = reader.ReadString(100);
```

### Working with Different Encodings

Use appropriate decoders for different text encodings:

```cpp
// UTF-8 with BOM detection
FileStream fileStream(L"text.txt", FileStream::ReadOnly);
BomDecoder decoder;
DecoderStream decoderStream(fileStream, decoder);
StreamReader reader(decoderStream);

// UTF-16
FileStream fileStream(L"text.txt", FileStream::ReadOnly);
Utf16Decoder decoder;
DecoderStream decoderStream(fileStream, decoder);
StreamReader reader(decoderStream);

// Local code page (MBCS)
FileStream fileStream(L"text.txt", FileStream::ReadOnly);
MbcsDecoder decoder;
DecoderStream decoderStream(fileStream, decoder);
StreamReader reader(decoderStream);
```

## StreamWriter for Text Writing

`StreamWriter` provides methods to write text to any writable stream with character encoding.

### Basic Text Writing Operations

```cpp
// Write to a UTF-8 file
FileStream fileStream(L"output.txt", FileStream::WriteOnly);
Utf8Encoder encoder;
EncoderStream encoderStream(fileStream, encoder);
StreamWriter writer(encoderStream);

// Write single character
writer.WriteChar(L'A');

// Write string
writer.WriteString(L"Hello, world!");

// Write line with CRLF
writer.WriteLine(L"This line ends with CRLF");

// Write formatted content
writer.WriteString(L"Number: ");
writer.WriteString(itow(42));
writer.WriteLine(L"");
```

### Writing with Different Encodings

```cpp
// UTF-8 with BOM
FileStream fileStream(L"output.txt", FileStream::WriteOnly);
BomEncoder encoder(BomEncoder::Utf8);
EncoderStream encoderStream(fileStream, encoder);
StreamWriter writer(encoderStream);
writer.WriteString(L"UTF-8 content with BOM");

// UTF-16 with BOM
FileStream fileStream(L"output.txt", FileStream::WriteOnly);
BomEncoder encoder(BomEncoder::Utf16);
EncoderStream encoderStream(fileStream, encoder);
StreamWriter writer(encoderStream);
writer.WriteString(L"UTF-16 content with BOM");
```

## Using with Memory Streams

StreamReader and StreamWriter work with any stream implementation:

```cpp
// Create content in memory
WString content = GenerateToStream([](StreamWriter& writer)
{
    writer.WriteLine(L"Line 1");
    writer.WriteLine(L"Line 2");
    writer.WriteString(L"Line 3");
});

// Read from memory
MemoryStream memoryStream;
StreamWriter writer(memoryStream);
writer.WriteString(L"Memory content");

memoryStream.SeekFromBegin(0);
StreamReader reader(memoryStream);
WString result = reader.ReadToEnd();
```

## Character Type Support

StreamReader and StreamWriter support different character types through templates:

- `StreamReader` = `StreamReader_<wchar_t>`
- `StreamWriter` = `StreamWriter_<wchar_t>`
- `StreamReader_<char8_t>` for UTF-8
- `StreamWriter_<char16_t>` for UTF-16
- etc.

## Important Notes

- StreamReader normalizes all line breaks to CRLF in `ReadLine()` regardless of the input format
- StreamWriter uses CRLF for line breaks in `WriteLine()`
- Both classes work with `wchar_t` by default (UTF-16 on Windows, UTF-32 on other platforms)
- Always ensure the underlying stream remains available during the lifetime of the reader/writer
- For text files, prefer using the higher-level `File` class methods when appropriate