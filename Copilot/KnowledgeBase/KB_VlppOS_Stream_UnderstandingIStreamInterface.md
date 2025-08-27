# Understanding IStream Interface

The `IStream` interface is the foundation of all stream operations in VlppOS. It provides a unified interface for reading, writing, and seeking across different types of streams including files, memory, and encoded data.

## IStream Interface Overview

The `IStream` interface defines the contract for all stream types:

```cpp
using namespace vl::stream;

// All stream types implement IStream
void DemonstrateStreamInterface(IStream& stream)
{
    // Feature testing
    if (stream.IsAvailable())
    {
        Console::WriteLine(L"Stream is available");
        Console::WriteLine(L"Can read: " + (stream.CanRead() ? L"true" : L"false"));
        Console::WriteLine(L"Can write: " + (stream.CanWrite() ? L"true" : L"false"));
        Console::WriteLine(L"Can seek: " + (stream.CanSeek() ? L"true" : L"false"));
        Console::WriteLine(L"Can peek: " + (stream.CanPeek() ? L"true" : L"false"));
        Console::WriteLine(L"Is limited: " + (stream.IsLimited() ? L"true" : L"false"));
    }
    else
    {
        Console::WriteLine(L"Stream is not available");
    }
}
```

## Stream Capabilities

You can test capabilities of a stream if you are not sure, but in most of the cases you should know by the structure of stream combining.

## Basic Stream Operations

### Reading from Streams

```cpp
void SafeReadFromStream(IStream& stream)
{
    if (!stream.IsAvailable() || !stream.CanRead())
    {
        Console::WriteLine(L"Stream cannot be read");
        return;
    }
    
    // Read in chunks
    const vint bufferSize = 1024;
    char buffer[bufferSize];
    vint totalBytesRead = 0;
    
    while (true)
    {
        vint bytesRead = stream.Read(buffer, bufferSize);
        if (bytesRead == 0)
        {
            break; // End of stream
        }
        
        totalBytesRead += bytesRead;
        
        // Process the data in buffer
        // ... processing logic here ...
    }
    
    Console::WriteLine(L"Total bytes read: " + itow(totalBytesRead));
}
```

### Writing to Streams

```cpp
void SafeWriteToStream(IStream& stream, char* data, vint size)
{
    if (!stream.IsAvailable() || !stream.CanWrite())
    {
        Console::WriteLine(L"Stream cannot be written to");
        return;
    }
    
    vint totalBytesWritten = 0;
    
    while (totalBytesWritten < size)
    {
        vint bytesWritten = stream.Write(
            data + totalBytesWritten, 
            size - totalBytesWritten
        );
        
        if (bytesWritten == 0)
        {
            Console::WriteLine(L"Warning: Stream cannot accept more data");
            break;
        }
        
        totalBytesWritten += bytesWritten;
    }
    
    Console::WriteLine(L"Bytes written: " + itow(totalBytesWritten) + L"/" + itow(size));
}
```

### Peeking at Stream Data

```cpp
void PeekAtStreamData(IStream& stream)
{
    if (!stream.IsAvailable() || !stream.CanPeek())
    {
        Console::WriteLine(L"Stream does not support peeking");
        return;
    }
    
    // Peek at first few bytes without advancing position
    char peekBuffer[16];
    vint peekBytes = stream.Peek(peekBuffer, sizeof(peekBuffer));
    
    if (peekBytes > 0)
    {
        Console::WriteLine(L"Peeked " + itow(peekBytes) + L" bytes");
        Console::WriteLine(L"Position remains: " + i64tow(stream.Position()));
        
        // Now actually read the same data
        char readBuffer[16];
        vint readBytes = stream.Read(readBuffer, peekBytes);
        Console::WriteLine(L"Read " + itow(readBytes) + L" bytes");
        Console::WriteLine(L"New position: " + i64tow(stream.Position()));
    }
}
```

## Stream Position Management

### Seeking Operations

```cpp
void DemonstrateStreamSeeking(IStream& stream)
{
    if (!stream.IsAvailable() || !stream.CanSeek())
    {
        Console::WriteLine(L"Stream does not support seeking");
        return;
    }
    
    // Get initial position
    pos_t initialPos = stream.Position();
    Console::WriteLine(L"Initial position: " + i64tow(initialPos));
    
    // Seek to beginning
    stream.SeekFromBegin(0);
    Console::WriteLine(L"After seeking to begin: " + i64tow(stream.Position()));
    
    // Seek forward
    stream.Seek(10);
    Console::WriteLine(L"After seeking +10: " + i64tow(stream.Position()));
    
    // Seek backward
    stream.Seek(-5);
    Console::WriteLine(L"After seeking -5: " + i64tow(stream.Position()));
    
    // Seek to end (only for limited streams)
    if (stream.IsLimited())
    {
        pos_t size = stream.Size();
        stream.SeekFromEnd(0);
        Console::WriteLine(L"After seeking to end: " + i64tow(stream.Position()));
        Console::WriteLine(L"Stream size: " + i64tow(size));
    }
    
    // Restore initial position
    stream.SeekFromBegin(initialPos);
    Console::WriteLine(L"Restored to: " + i64tow(stream.Position()));
}
```

## Error Handling

### Safe Stream Operations

```cpp
template<typename TOperation>
bool SafeStreamOperation(IStream& stream, const WString& operationName, TOperation operation)
{
    if (!stream.IsAvailable())
    {
        Console::WriteLine(L"Cannot perform " + operationName + L": stream unavailable");
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

// Usage examples
void SafeStreamOperations(IStream& stream)
{
    SafeStreamOperation(stream, L"reading", [](IStream& s)
    {
        if (s.CanRead())
        {
            char buffer[100];
            vint bytes = s.Read(buffer, sizeof(buffer));
            Console::WriteLine(L"Read " + itow(bytes) + L" bytes");
        }
    });
    
    SafeStreamOperation(stream, L"seeking", [](IStream& s)
    {
        if (s.CanSeek())
        {
            s.SeekFromBegin(0);
            Console::WriteLine(L"Seeked to beginning");
        }
    });
}
```

## Important Notes

- **Availability Check**: Always call `IsAvailable()` before any stream operations
- **Feature Testing**: Use capability methods (`CanRead()`, `CanWrite()`, etc.) before operations
- **Return Values**: Read/Write operations return actual bytes processed, which may be less than requested
- **Position Management**: Seeking operations are only available on streams where `CanSeek()` returns true
- **Stream Lifetime**: Streams should be properly closed when no longer needed
- **Thread Safety**: IStream implementations are generally not thread-safe unless specifically documented