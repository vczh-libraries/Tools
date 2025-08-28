# Using FileStream for File I/O

The `FileStream` class in VlppOS provides direct file access through the IStream interface. It supports different access modes and is commonly used for reading from and writing to files on disk.

## Creating FileStream Objects

### Basic Constructor Usage

```cpp
using namespace vl::stream;

// Read-only access
FileStream readStream(L"/path/to/input.txt", FileStream::ReadOnly);

// Write-only access (creates or overwrites file)
FileStream writeStream(L"/path/to/output.txt", FileStream::WriteOnly);

// Read-write access
FileStream readWriteStream(L"/path/to/data.bin", FileStream::ReadWrite);
```

### Access Mode Options

- `FileStream::ReadOnly`: Open file for reading only. File must exist.
- `FileStream::WriteOnly`: Open file for writing only. Creates file if doesn't exist, overwrites if exists.
- `FileStream::ReadWrite`: Open file for both reading and writing. Creates file if doesn't exist.

## Important Notes

- **ReadOnly Mode**: File must exist or FileStream creation will fail
- **WriteOnly/ReadWrite Mode**: File is created if it doesn't exist, overwritten if it does
- **Automatic Cleanup**: FileStream automatically closes the file when destroyed
- **Seeking Support**: All FileStream instances support seeking operations
- **Limited/Infinite**: ReadOnly streams are limited (finite), WriteOnly/ReadWrite are infinite
- **Thread Safety**: FileStream is not thread-safe, use external synchronization if needed
- **Error Handling**: Always check `IsAvailable()` after construction and handle potential exceptions

The FileStream class provides robust file I/O capabilities while integrating seamlessly with the VlppOS stream ecosystem, making it easy to combine with encoders, decoders, and other stream processing components.