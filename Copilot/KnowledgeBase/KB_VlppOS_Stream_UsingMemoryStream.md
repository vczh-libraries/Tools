# Using MemoryStream for Buffer Operations

The `MemoryStream` class in VlppOS provides an in-memory stream implementation that dynamically grows as data is written to it. It is ideal for temporary data storage, building content in memory, or when you need a stream interface for memory operations.

## Creating MemoryStream Objects

### Basic Constructor

```cpp
using namespace vl::stream;

// Create with default block size (65536 bytes)
MemoryStream defaultStream;

// Create with custom block size
MemoryStream customStream(8192);  // 8KB blocks
```

### Understanding Block Size

The block size parameter controls how the internal buffer grows:
- When data exceeds current capacity, the buffer grows by multiples of the block size
- Larger block sizes reduce memory reallocations but may waste memory
- Smaller block sizes use memory more efficiently but may cause more reallocations

## Important Notes

- **Dynamic Growth**: MemoryStream automatically grows as needed, no pre-allocation required
- **Block-Based Allocation**: Memory is allocated in blocks to reduce fragmentation and improve performance
- **Full Stream Interface**: Supports all IStream operations including reading, writing, seeking, and peeking
- **Not Limited**: MemoryStream is considered unlimited (infinite) - you can write as much as memory allows
- **Internal Buffer Access**: Use `GetInternalBuffer()` cautiously - pointer becomes invalid after writes that cause reallocation
- **Thread Safety**: MemoryStream is not thread-safe, use external synchronization if needed
- **Automatic Cleanup**: Memory is automatically freed when the MemoryStream is destroyed

The MemoryStream class provides a versatile in-memory buffer that integrates seamlessly with the VlppOS stream ecosystem, making it ideal for temporary storage, data processing pipelines, and building complex data structures in memory.