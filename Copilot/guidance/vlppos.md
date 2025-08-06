# Using VlppOS

This project offers basic abstractions of the OS in the following categories:
  - locale supports for localization and globalization
  - locale-awared string manipulation
  - file system access
  - file and memory access as streams
  - encoding and decoding for Base64 and Lzw
  - multi-threading and synchornization

## Locale

`Locale` is a value type, begins with these static methods:
  - `Invariant()`: returns the invariant locale. This locale does not change across OS settings. Use `INVLOC` macro for a shorter version instead of writing `vl::Locale::Invariant()`.
  - `SystemDefault()`: returns the locale for OS code page intepration, not needed in most of the cases.
  - `UserDefault()`: returns the locale for user language and location.
  - `Enumerate(locales)`: enumerate all locales to the argument which are supported by the running OS.

After we get a `Locale` value, we can do:
  - Enumerate all OS preset date-time formats, by calling `Get*Formats` methods. We take the first filled format as the default one.
  - Format `DateTime` to `WString`, by calling `FormatDate` and `FormatTime` methods.
  - Get locale-awared week day or month names by calling `Get*Name` methods.
  - Format a number to a locale-awared number or currency format, by calling `FormatNumber` and `FormatCurrency` methods. The input is a `WString` storing a number, `itow` and `ftow` will be useful in most of the cases.

The rest are all locale-awared string manipulation functions. The most importants one among them are:
  - `Compare`, `CompareOrdinal` and `CompareOrdinalIgnoreCase`: compare two strings in different way.
  - `FindFirst`, `FindLast`: find one in another. Since strings will be normalized before searching, it returns a pair of number indicating the matched substring. The matched substring might be not the same with the substring to search for, but they are equivalent under the given locale.
  - `StartsWith`, `EndsWith`: test if a substring appears in the expected location.
  - All above functions will internally rewrite the string with a specified normalization before performing the work.

## File System

`FilePath` is a string representation of file path.
  - Use `GetName`, `GetFolder`, `GetFullPath` and `GetRelativePathFor` to for path manipulation.
  - Use `IsFile`, `IsFolder` and `IsRoot` to tell the object represented by the path.

When `FilePath::IsFile` returns true, `File` could be initialized with such path. It offers:
  - Text reading by `ReadAllTextWithEncodingTesting`, `ReadAllTextByBom` and `ReadAllLinesByBom`.
  - Text writing by `WriteAllText`, `WriteAllLines`.
  - File operation by `Exists`, `Delete` and `Rename`.

When `FilePath::IsFolder` or `FilePath::IsRoot` return true, `Folder` could be initialized with such path. It offers:
  - Content enumerations by `GetFolders` and `GetFiles` to enumerate the content.
  - Folder operation by `Exists`, `Delete` and `Rename`.

`Folder::Create` is special, it creates a new folder, which means you have to initialize `Folder` with an unexisting `FilePath` before doing that. In such case `FilePath::IsFolder` would return false before calling `Create`.

Initializing a `Folder` with a file path with `IsRoot` returning true, is just calling `Folder`'s default constructors.
  - On Windows, the root contains all drives as folders, therefore root and drives cannot be removed or renamed. A drive's full path and name will be for example `C:`.
  - On Linux, the root means `/`.

## Stream

All stream implements `IStream` interface. Unfortunately there is another `IStream` in `Windows.h`, so it is not recommended to do `using namespace vl::stream;`, using `stream::` is recommended instead.

Streams are recommended to be used as value types, but they cannot be copied or moved.

A stream is available when `IsAvailable` returns true. All other methods can only be used in this case.
Calling `Close` will release the resource behind the stream and make it unavailable.
Usually we don't need to call `Close` explicitly, it will be called internally when the stream is destroyed.

A stream is readable when `CanRead` returns true. `Read` and `Peek` can only be used in this case.

Here are all streams that guaranteed to be readable so no further checking is needed:
  - `FileStream` with `FileStream::ReadOnly` or `FileStream::ReadWrite` in the constructor.
  - `MemoryStream`
  - `MemoryWrapperStream`
  - `DecoderStream`
  - `RecorderStream`
  - The following streams are readable when their underlying streams are readable
    - `CacheStream`

A stream is writable when `CanWrite` returns true. `Write` can only be used in this case.

Here are all streams that guaranteed to be writable so no further checking is needed:
  - `FileStream` with `FileStream::WriteOnly` or `FileStream::ReadWrite` in the constructor.
  - `MemoryStream`
  - `MemoryWrapperStream`
  - `EncoderStream`
  - `BroadcastStream`
  - The following streams are readable when their underlying streams are writable 
    - `CacheStream`

A stream is random accessible when `CanSeek` returns true. `Seek`, `SeekFromBegin` can only be used in this case. `SeekFromEnd` can only be used when both `CanSeek` and `IsLimited` returns true.
Use `Position` to know the current seeking position.
`Read` and `Peek` will read the data at the seeking position.

Here are all streams that guaranteed to be seekable so no further checking is needed:
  - `FileStream`
  - `MemoryStream`
  - `MemoryWrapperStream`
  - The following streams are readable when their underlying streams are seekable
    - `CacheStream`

A stream is finite when `IsLimited` returns true. A finite stream means there is limited data in the stream. An infinite stream means you can `Read` from the stream forever before it is broken or closed.
The `Size` and `SeekFromEnd` method only make sense for a finite stream.

Here are all streams that guaranteed to be limited/finite so no further checking is needed:
  - `FileStream` with `FileStream::ReadOnly` in the constructor.
  - `MemoryWrapperStream`
  - The following streams are readable when their underlying streams are limited/finite
    - `DecoderStream`
    - `EncoderStream`
    - `CacheStream`
    - `RecorderStream`

Here are all streams that guaranteed to be infinite so no further checking is needed:
  - `FileStream` with `FileStream::WriteOnly` or `FileStream::ReadWrite` in the constructor.
  - `MemoryStream`
  - The following streams are readable when their underlying streams are limited/finite
    - `DecoderStream`
    - `EncoderStream`
    - `CacheStream`
    - `RecorderStream`

### FileStream

Initialize `FileStream` with a file path (`WString` instead of `FilePath`) to open a file. One of `FileStream::ReadOnly`, `FileStream::WriteOnly` and `FileStream::ReadWrite` must be specified.

### MemoryStream

`MemoryStream` maintain a consecutive memory buffer to store data.
Use `GetInternalBuffer` to get the pointer to the buffer.
The pointer is only safe to use before `MemoryStream` is written to, because when the buffer is not long enough, a new one will be created and the old will will be deleted.
The buffer will be deleted when `MemoryStream` is destroyed.

### MemoryWrapperStream

`MemoryWrapperStream` operates on a given memory buffer, `MemoryWrapperStream` will be delete the buffer.

### EncoderStream and DecoderStream

An `EncoderStream` transform the data using the given `IEncoder` and then write to a given writable stream. It is write only stream.

A `DecoderStream` read data from a given readable stream and then transform the data using the given `IDecoder`. It is a read only stream.

By stacking multiple encoders, decoders and stream together, we can create a pipeline of data processing.

When we need to read a UTF-8 file into a `WString` we could use:
```C++
FileStream fileStream(fullPath, FileStream::ReadOnly);
Utf8Decoder decoder;
DecoderStream decoderStream(fileStream, decoder);
StreamReader reader(decoderStream);
auto text = reader.ReadToEnd();
```

When we need to write a `WString` to a UTF-8 file with BOM enabled we could use:
```C++
FileStream fileStream(fullPath, FileStream::WriteOnly);
BomEncoder encoder(BomEncoder::Utf8);
EncoderStream encoderStream(fileStream, encoder);
StreamWriter writer(encoderStream);
writer.WriteString(text);
```

Or just use `File` to do the work which is much simpler.

#### UTF Encoding

- `BomEncoder` and `BomDecoder` convert data between `wchar_t` and a specified UTF encoding with BOM added to the very beginning.
- `UtfGeneralEncoder<Native, Expect>` encode from `Expext` to `Native`, `UtfGeneralDecoder<Native, Expect>` decode from `Native` to `Expect`. They should be one of `wchar_t`, `char8_t`, `char16_t`, `char32_t` and `char16be_t`.
  - Unlike `BomEncoder` and `BomDecoder`, `UtfGeneralEncoder` and `UtfGeneralDecodes` is without BOM.
  - `char16be_t` means UTF-16 Big Endian, which is not a C++ native type, it can't be used with any string literal.
  - There are aliases for them to convert between `wchar_t` and any other UTF encoding:
    - `Utf8Encoder` and `Utf8Decoder`
    - `Utf16Encoder` and `Utf16Decoder`
    - `Utf16BEEncoder` and `Utf16BEDecoder`
    - `Utf32Encoder` and `Utf32Decoder`
- `MbcsEncoder` and `MbcsDecoder` convert data between `wchar_t` and `char`, which is ASCII.
  - `BomEncoder::Mbcs` also handles ASCII meanwhile there is no BOM for ASCII. A `BomEncoder(BomEncoder::Mbcs)` works like a `MbcsEncoder`.
  - The actual encoding of `char` depends on the user setting in the running OS.

There is a function `TestEncoding` to scan a binary data and guess the most possible UTF encoding.

#### Base64 Encoding

`Utf8Base64Encoder` and `Utf6Base64Decoder` convert between binary data to Base64 in UTF8 encoding.
They can work with `UtfGeneralEncoder` and `UtfGeneralDecoder` to convert binary data to Base64 in a `WString`.
Here is some examples:

```C++
MemoryStream memoryStream;
{
  UtfGeneralEncoder<wchar_t, char8_t> u8towEncoder;
  EncoderStream u8towStream(memoryStream, u8towEncoder);
  Utf8Base64Encoder base64Encoder;
  EncoderStream base64Stream(u8t0wStream, base64Encoder);
  base64Stream.Write(binary ...);
}
memoryStream.SeekFromBegin(0);
{
  StreamReader reader(memoryStream);
  auto base64 = reader.ReadToEnd(reader);
}
```

```C++
MemoryStream memoryStreamn;
{
  StreamWriter writer(memoryStream);
  writer.WriteString(base64);
}
memoryStream.SeekFromBegin(0);
{
  UtfGeneralEncoder<wchar_t, char8_t> wtou8Decoder;
  DecoderStream wtou8Stream(memoryStream, wtou8Decoder);
  Utf8Base64Decoder base64Decoder;
  DecoderStream base64Stream(wtou8Stream, base64Decoder);
  base64Stream.Read(binary ...);
}
```

#### Lzw Encoding

- `LzwEncoder` compress binary data.
- `LzwDecoder` decompress binary data.
- There are help functions `CopyStream`, `CompressStream` and `DecompressStream` to make the code simpler.

### Other Streams

`CacheStream` maintain a cache to reduce calls to the underlying stream.
It increases the performance when there are too many data to read/write,
or when the same part of the data needs to be modified repeatly.

`RecorderStream` reads data from one readable stream while copying everything to another writable stream.

`BroadcastStream` write the same data to multiple streams, which is managed by the `Targets()` method.

## Multi-Threading

### Thread

### ThreadPoolLite

### ThreadVariable<T>

## Synchronization

### SpinLock

### Mutex

### EventObject

### CriticalSection

### Semaphore

### ReaderWriterLock

### ConditionVariable
