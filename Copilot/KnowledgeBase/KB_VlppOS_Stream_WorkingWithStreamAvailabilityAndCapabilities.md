# Working with Stream Availability and Capabilities

Stream availability and capability checking are essential for safe stream operations in VlppOS. Understanding when and how to test stream features prevents runtime errors and ensures robust code.

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
    Console::WriteLine(L"Available: " + (caps.isAvailable ? L"?" : L"?"));
    
    if (caps.isAvailable)
    {
        Console::WriteLine(L"Readable: " + (caps.canRead ? L"?" : L"?"));
        Console::WriteLine(L"Writable: " + (caps.canWrite ? L"?" : L"?"));
        Console::WriteLine(L"Seekable: " + (caps.canSeek ? L"?" : L"?"));
        Console::WriteLine(L"Peekable: " + (caps.canPeek ? L"?" : L"?"));
        Console::WriteLine(L"Limited: " + (caps.isLimited ? L"?" : L"?"));
        
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

### Stream Type Recognition

Different stream types have predictable capability patterns:

```cpp
enum class StreamType
{
    Unknown,
    FileReadOnly,
    FileWriteOnly,
    FileReadWrite,
    Memory,
    MemoryWrapper,
    Encoder,
    Decoder,
    Broadcast,
    Cache
};

StreamType IdentifyStreamType(IStream& stream)
{
    if (!stream.IsAvailable())
    {
        return StreamType::Unknown;
    }
    
    bool canRead = stream.CanRead();
    bool canWrite = stream.CanWrite();
    bool canSeek = stream.CanSeek();
    bool canPeek = stream.CanPeek();
    bool isLimited = stream.IsLimited();
    
    // Memory streams: readable, writable, seekable, peekable, unlimited
    if (canRead && canWrite && canSeek && canPeek && !isLimited)
    {
        return StreamType::Memory;
    }
    
    // Memory wrapper: readable, writable, seekable, peekable, limited
    if (canRead && canWrite && canSeek && canPeek && isLimited)
    {
        return StreamType::MemoryWrapper;
    }
    
    // File read-only: readable, seekable, limited, not writable
    if (canRead && !canWrite && canSeek && isLimited)
    {
        return StreamType::FileReadOnly;
    }
    
    // File write-only: writable, not readable, not limited
    if (!canRead && canWrite && !isLimited)
    {
        return StreamType::FileWriteOnly;
    }
    
    // File read-write: readable, writable, seekable
    if (canRead && canWrite && canSeek)
    {
        return StreamType::FileReadWrite;
    }
    
    // Encoder stream: writable only
    if (!canRead && canWrite)
    {
        return StreamType::Encoder;
    }
    
    // Decoder stream: readable only
    if (canRead && !canWrite)
    {
        return StreamType::Decoder;
    }
    
    return StreamType::Unknown;
}

WString StreamTypeToString(StreamType type)
{
    switch (type)
    {
    case StreamType::FileReadOnly: return L"File (Read-Only)";
    case StreamType::FileWriteOnly: return L"File (Write-Only)";
    case StreamType::FileReadWrite: return L"File (Read-Write)";
    case StreamType::Memory: return L"Memory Stream";
    case StreamType::MemoryWrapper: return L"Memory Wrapper";
    case StreamType::Encoder: return L"Encoder Stream";
    case StreamType::Decoder: return L"Decoder Stream";
    case StreamType::Broadcast: return L"Broadcast Stream";
    case StreamType::Cache: return L"Cache Stream";
    default: return L"Unknown Stream";
    }
}
```

## Capability-Based Stream Usage

### Safe Reading Operations

```cpp
class SafeStreamReader : public Object
{
private:
    IStream& stream;
    bool canRead;
    bool canSeek;
    bool canPeek;
    
public:
    SafeStreamReader(IStream& _stream) : stream(_stream)
    {
        canRead = stream.IsAvailable() && stream.CanRead();
        canSeek = stream.IsAvailable() && stream.CanSeek();
        canPeek = stream.IsAvailable() && stream.CanPeek();
    }
    
    bool CanRead() const { return canRead; }
    
    vint ReadData(void* buffer, vint size)
    {
        if (!canRead)
        {
            Console::WriteLine(L"Stream is not readable");
            return 0;
        }
        
        return stream.Read(buffer, size);
    }
    
    bool PeekData(void* buffer, vint size, vint& bytesRead)
    {
        if (!canPeek)
        {
            Console::WriteLine(L"Stream does not support peeking");
            return false;
        }
        
        bytesRead = stream.Peek(buffer, size);
        return true;
    }
    
    bool SeekToPosition(pos_t position)
    {
        if (!canSeek)
        {
            Console::WriteLine(L"Stream does not support seeking");
            return false;
        }
        
        stream.SeekFromBegin(position);
        return true;
    }
    
    pos_t GetCurrentPosition()
    {
        if (!canSeek)
        {
            return -1; // Position unknown
        }
        
        return stream.Position();
    }
};
```

### Safe Writing Operations

```cpp
class SafeStreamWriter : public Object
{
private:
    IStream& stream;
    bool canWrite;
    bool canSeek;
    
public:
    SafeStreamWriter(IStream& _stream) : stream(_stream)
    {
        canWrite = stream.IsAvailable() && stream.CanWrite();
        canSeek = stream.IsAvailable() && stream.CanSeek();
    }
    
    bool CanWrite() const { return canWrite; }
    
    vint WriteData(const void* buffer, vint size)
    {
        if (!canWrite)
        {
            Console::WriteLine(L"Stream is not writable");
            return 0;
        }
        
        return stream.Write(const_cast<void*>(buffer), size);
    }
    
    bool WriteAll(const void* buffer, vint size)
    {
        if (!canWrite) return false;
        
        vint totalWritten = 0;
        const char* data = static_cast<const char*>(buffer);
        
        while (totalWritten < size)
        {
            vint written = stream.Write(
                const_cast<char*>(data + totalWritten), 
                size - totalWritten
            );
            
            if (written == 0)
            {
                Console::WriteLine(L"Stream cannot accept more data");
                break;
            }
            
            totalWritten += written;
        }
        
        return totalWritten == size;
    }
    
    pos_t GetCurrentPosition()
    {
        if (!canSeek)
        {
            return -1; // Position unknown
        }
        
        return stream.Position();
    }
};
```

## Advanced Capability Patterns

### Capability-Based Stream Adapter

```cpp
template<typename TOperation>
class StreamCapabilityAdapter : public Object
{
private:
    IStream& stream;
    
public:
    StreamCapabilityAdapter(IStream& _stream) : stream(_stream) {}
    
    bool ExecuteIfCapable(
        const WString& operationName,
        const Func<bool(IStream&)>& capabilityCheck,
        const TOperation& operation
    )
    {
        if (!stream.IsAvailable())
        {
            Console::WriteLine(L"Cannot " + operationName + L": stream unavailable");
            return false;
        }
        
        if (!capabilityCheck(stream))
        {
            Console::WriteLine(L"Cannot " + operationName + L": capability not supported");
            return false;
        }
        
        try
        {
            operation(stream);
            return true;
        }
        catch (...)
        {
            Console::WriteLine(L"Error during " + operationName);
            return false;
        }
    }
};

// Usage example
void DemonstrateCapabilityAdapter(IStream& stream)
{
    StreamCapabilityAdapter<Func<void(IStream&)>> adapter(stream);
    
    // Safe reading
    adapter.ExecuteIfCapable(
        L"reading",
        [](IStream& s) { return s.CanRead(); },
        [](IStream& s) {
            char buffer[100];
            vint bytes = s.Read(buffer, sizeof(buffer));
            Console::WriteLine(L"Read " + itow(bytes) + L" bytes");
        }
    );
    
    // Safe seeking
    adapter.ExecuteIfCapable(
        L"seeking",
        [](IStream& s) { return s.CanSeek(); },
        [](IStream& s) {
            s.SeekFromBegin(0);
            Console::WriteLine(L"Seeked to beginning");
        }
    );
    
    // Safe peeking
    adapter.ExecuteIfCapable(
        L"peeking",
        [](IStream& s) { return s.CanPeek(); },
        [](IStream& s) {
            char buffer[10];
            vint bytes = s.Peek(buffer, sizeof(buffer));
            Console::WriteLine(L"Peeked " + itow(bytes) + L" bytes");
        }
    );
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