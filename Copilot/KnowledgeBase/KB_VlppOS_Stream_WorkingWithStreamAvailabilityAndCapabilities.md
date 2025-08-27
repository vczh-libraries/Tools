# Working with Stream Availability and Capabilities

Stream availability and capability checking are essential for safe stream operations in VlppOS. Understanding when and how to test stream features prevents runtime errors and ensures robust code.

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

## Stream Availability

### Checking Stream Availability

Always verify stream availability before attempting any operations:

```cpp
using namespace vl::stream;

void SafeStreamOperation(IStream& stream)
{
    // First check: Is the stream available?
    if (!stream.IsAvailable())
    {
        Console::WriteLine(L"Stream is not available");
        // Could be due to:
        // - Failed file opening
        // - Network connection issues
        // - Insufficient permissions
        // - Stream has been closed
        return;
    }
    
    Console::WriteLine(L"Stream is available for operations");
}
```

### Common Availability Scenarios

```cpp
void DemonstrateAvailabilityScenarios()
{
    // File stream - may be unavailable if file doesn't exist
    FileStream fileStream(L"nonexistent.txt", FileStream::ReadOnly);
    if (!fileStream.IsAvailable())
    {
        Console::WriteLine(L"File stream unavailable - file not found");
    }
    
    // Memory stream - always available after construction
    MemoryStream memoryStream;
    if (memoryStream.IsAvailable())
    {
        Console::WriteLine(L"Memory stream is available");
    }
    
    // Stream after closing
    memoryStream.Close();
    if (!memoryStream.IsAvailable())
    {
        Console::WriteLine(L"Memory stream unavailable after closing");
    }
}
```

## Stream Capabilities

### Comprehensive Capability Testing

Test all relevant capabilities before using stream features:

```cpp
struct StreamCapabilities
{
    bool isAvailable;
    bool canRead;
    bool canWrite;
    bool canSeek;
    bool canPeek;
    bool isLimited;
};

StreamCapabilities AnalyzeStream(IStream& stream)
{
    StreamCapabilities caps = {};
    
    // Primary check
    caps.isAvailable = stream.IsAvailable();
    
    if (caps.isAvailable)
    {
        // Secondary capabilities
        caps.canRead = stream.CanRead();
        caps.canWrite = stream.CanWrite();
        caps.canSeek = stream.CanSeek();
        caps.canPeek = stream.CanPeek();
        caps.isLimited = stream.IsLimited();
    }
    
    return caps;
}

void PrintCapabilities(IStream& stream, const WString& streamName)
{
    StreamCapabilities caps = AnalyzeStream(stream);
    
    Console::WriteLine(L"=== " + streamName + L" Capabilities ===");
    Console::WriteLine(L"Available: " + (caps.isAvailable ? L"✓" : L"✗"));
    
    if (caps.isAvailable)
    {
        Console::WriteLine(L"Readable: " + (caps.canRead ? L"✓" : L"✗"));
        Console::WriteLine(L"Writable: " + (caps.canWrite ? L"✓" : L"✗"));
        Console::WriteLine(L"Seekable: " + (caps.canSeek ? L"✓" : L"✗"));
        Console::WriteLine(L"Peekable: " + (caps.canPeek ? L"✓" : L"✗"));
        Console::WriteLine(L"Limited: " + (caps.isLimited ? L"✓" : L"✗"));
        
        if (caps.canSeek)
        {
            Console::WriteLine(L"Position: " + i64tow(stream.Position()));
        }
        
        if (caps.isLimited)
        {
            Console::WriteLine(L"Size: " + i64tow(stream.Size()));
        }
    }
    Console::WriteLine(L"========================");
}
```

### Stream Validation

```cpp
enum class StreamValidationResult
{
    Valid,
    Unavailable,
    MissingReadCapability,
    MissingWriteCapability,
    MissingSeekCapability,
    MissingPeekCapability,
    NotLimited
};

StreamValidationResult ValidateStreamForOperation(
    IStream& stream,
    bool needRead = false,
    bool needWrite = false,
    bool needSeek = false,
    bool needPeek = false,
    bool needLimited = false
)
{
    if (!stream.IsAvailable())
    {
        return StreamValidationResult::Unavailable;
    }
    
    if (needRead && !stream.CanRead())
    {
        return StreamValidationResult::MissingReadCapability;
    }
    
    if (needWrite && !stream.CanWrite())
    {
        return StreamValidationResult::MissingWriteCapability;
    }
    
    if (needSeek && !stream.CanSeek())
    {
        return StreamValidationResult::MissingSeekCapability;
    }
    
    if (needPeek && !stream.CanPeek())
    {
        return StreamValidationResult::MissingPeekCapability;
    }
    
    if (needLimited && !stream.IsLimited())
    {
        return StreamValidationResult::NotLimited;
    }
    
    return StreamValidationResult::Valid;
}

WString ValidationResultToString(StreamValidationResult result)
{
    switch (result)
    {
    case StreamValidationResult::Valid: return L"Valid";
    case StreamValidationResult::Unavailable: return L"Stream unavailable";
    case StreamValidationResult::MissingReadCapability: return L"Missing read capability";
    case StreamValidationResult::MissingWriteCapability: return L"Missing write capability";
    case StreamValidationResult::MissingSeekCapability: return L"Missing seek capability";
    case StreamValidationResult::MissingPeekCapability: return L"Missing peek capability";
    case StreamValidationResult::NotLimited: return L"Stream is not limited";
    default: return L"Unknown validation result";
    }
}
```

## Important Notes

- **Availability First**: Always check `IsAvailable()` before testing other capabilities
- **Capability Consistency**: Stream capabilities don't change during the stream's lifetime
- **Performance**: Capability checks are lightweight and can be called frequently
- **Error Prevention**: Proper capability checking prevents runtime errors and crashes
- **Stream Types**: Different stream implementations have predictable capability patterns
- **Thread Safety**: Capability checking methods are generally thread-safe for reading