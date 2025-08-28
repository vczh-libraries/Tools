# Using MemoryWrapperStream for External Buffers

`MemoryWrapperStream` is a stream implementation that wraps around an existing external buffer without taking ownership of it. Unlike `MemoryStream` which manages its own buffer, `MemoryWrapperStream` operates directly on a provided buffer, making it useful for scenarios where you need stream functionality over existing data.

## Basic Usage

`MemoryWrapperStream` provides a read/write stream interface over an external buffer:

```cpp
// Wrap an existing buffer
char buffer[1024];
MemoryWrapperStream stream(buffer, sizeof(buffer));

// Write data to the buffer through the stream
stream.Write("Hello", 5);
stream.Write(" World", 6);

// Read data back from the buffer
stream.SeekFromBegin(0);
char readBuffer[100];
vint bytesRead = stream.Read(readBuffer, 11);
// readBuffer now contains "Hello World"
```

## Working with String Buffers

A common use case is working with string data through the stream interface:

```cpp
// Serialize string data using MemoryWrapperStream
U8String data = u8"Sample data for processing";
MemoryWrapperStream stream((void*)data.Buffer(), data.Length());

// Use the stream for processing
// The stream provides read-only access to the string buffer
char buffer[50];
vint bytesRead = stream.Read(buffer, 20);
```

## Working with Existing Arrays

When you have data in arrays and need stream functionality:

```cpp
// Process existing binary data
Array<vuint8_t> binaryData(1000);
// ... fill binaryData ...

// Wrap the array data with a stream
MemoryWrapperStream stream(&binaryData[0], binaryData.Count());

// Use stream operations
if (stream.CanSeek())
{
    stream.SeekFromBegin(100);
    vuint8_t header[16];
    stream.Read(header, 16);
}
```

## Stream Capabilities

`MemoryWrapperStream` provides these capabilities:

- **Readable**: Yes
- **Writable**: Yes
- **Seekable**: Yes
- **Peekable**: Yes
- **Limited**: Yes (constrained by buffer size)

## Buffer Constraints

Unlike `MemoryStream`, `MemoryWrapperStream` cannot expand the buffer:

```cpp
char smallBuffer[10];
MemoryWrapperStream stream(smallBuffer, sizeof(smallBuffer));

// This will only write up to 10 bytes
vint written = stream.Write("This is a long string", 21);
// written will be 10, not 21

// Position and Size reflect the actual buffer limits
pos_t size = stream.Size(); // Returns 10
```

## Memory Management

`MemoryWrapperStream` does not take ownership of the buffer:

```cpp
void ProcessData()
{
    char* dynamicBuffer = new char[500];
    
    {
        MemoryWrapperStream stream(dynamicBuffer, 500);
        // Use stream...
    } // Stream destructor does NOT delete the buffer
    
    // You are responsible for cleanup
    delete[] dynamicBuffer;
}
```

## Integration with Other Streams

`MemoryWrapperStream` works seamlessly with other stream types:

```cpp
// Copy data from a file to a buffer via stream interface
FileStream fileStream(L"input.dat", FileStream::ReadOnly);
char buffer[4096];
MemoryWrapperStream memoryStream(buffer, sizeof(buffer));

// Copy file content to buffer
char temp[256];
vint bytesRead;
while ((bytesRead = fileStream.Read(temp, sizeof(temp))) > 0)
{
    memoryStream.Write(temp, bytesRead);
}
```

## Use Cases

`MemoryWrapperStream` is ideal for:

- **Legacy code integration**: Adding stream functionality to existing buffer-based code
- **Performance optimization**: Avoiding buffer copies when you already have the data
- **Serialization**: Converting buffers to/from stream format for serialization systems
- **Testing**: Creating streams from known data for unit tests
- **Protocol handling**: Processing network packets or file headers as streams

## Important Notes

- The buffer must remain valid for the lifetime of the `MemoryWrapperStream`
- Writing beyond the buffer size will be truncated, not cause an error
- The stream does not automatically null-terminate string data
- Unlike `MemoryStream`, the buffer size is fixed and cannot grow
- Always ensure the buffer size parameter matches the actual allocated size