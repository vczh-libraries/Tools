# Using CacheStream for Performance

`CacheStream` is a wrapper stream that provides buffering capabilities to improve performance when working with underlying streams that have high operation costs. It reduces the number of actual read/write operations by caching data in memory.

## Basic Usage

Create a `CacheStream` to buffer operations on a slower underlying stream:

```cpp
FileStream fileStream(L"large_file.dat", FileStream::ReadWrite);
CacheStream cachedStream(fileStream, 65536);  // 64KB cache

// Now use cachedStream instead of fileStream for better performance
```

## Read Performance Optimization

Cache frequently accessed file regions:

```cpp
FileStream slowFile(L"network_file.dat", FileStream::ReadOnly);
CacheStream fastAccess(slowFile, 32768);  // 32KB cache

// Multiple small reads are now cached
char buffer[100];
for (vint i = 0; i < 1000; i++)
{
    fastAccess.Read(buffer, sizeof(buffer));  // Only first few reads hit disk
}
```

## Write Performance Optimization

Buffer small writes to reduce system calls:

```cpp
FileStream outputFile(L"output.log", FileStream::WriteOnly);
CacheStream bufferedOutput(outputFile, 8192);  // 8KB write buffer

// Many small writes are buffered
for (vint i = 0; i < 10000; i++)
{
    WString logEntry = L"Log entry " + itow(i) + L"\n";
    StreamWriter writer(bufferedOutput);
    writer.WriteString(logEntry);  // Writes are cached until buffer is full
}
// Data is flushed automatically when CacheStream is destroyed
```

## Configurable Cache Size

Choose cache size based on access patterns:

```cpp
// Small cache for sequential access
CacheStream sequentialCache(fileStream, 4096);

// Large cache for random access
CacheStream randomAccessCache(fileStream, 1048576);  // 1MB

// Default cache size (65536 bytes) for general use
CacheStream defaultCache(fileStream);
```

## Working with Random Access

Optimize random access patterns with larger caches:

```cpp
FileStream dataFile(L"database.dat", FileStream::ReadWrite);
CacheStream cachedData(dataFile, 262144);  // 256KB cache

// Random access pattern
vint positions[] = { 1000, 5000, 2000, 8000, 1500 };
char record[100];

for (auto pos : positions)
{
    cachedData.SeekFromBegin(pos);
    cachedData.Read(record, sizeof(record));
    // Cached reads reduce actual disk seeks
}
```

## Stream Capability Inheritance

`CacheStream` inherits capabilities from the underlying stream:

```cpp
FileStream readOnlyFile(L"data.txt", FileStream::ReadOnly);
CacheStream cachedReader(readOnlyFile);

// CacheStream capabilities match underlying stream
Console::WriteLine(L"Can read: " + (cachedReader.CanRead() ? L"Yes" : L"No"));     // Yes
Console::WriteLine(L"Can write: " + (cachedReader.CanWrite() ? L"Yes" : L"No"));   // No
Console::WriteLine(L"Can seek: " + (cachedReader.CanSeek() ? L"Yes" : L"No"));     // Yes
Console::WriteLine(L"Is limited: " + (cachedReader.IsLimited() ? L"Yes" : L"No")); // Yes
```

## Explicit Cache Management

Control when cache is flushed:

```cpp
FileStream outputFile(L"critical_data.txt", FileStream::WriteOnly);
CacheStream cachedOutput(outputFile, 16384);

// Write critical data
StreamWriter writer(cachedOutput);
writer.WriteString(L"Important data");

// Explicitly flush cache for immediate persistence
cachedOutput.Close();  // Forces flush before closing
```

## Combining with Other Streams

Use `CacheStream` in stream processing pipelines:

```cpp
FileStream sourceFile(L"source.txt", FileStream::ReadOnly);
CacheStream cachedSource(sourceFile, 32768);

FileStream targetFile(L"target.utf8", FileStream::WriteOnly);
CacheStream cachedTarget(targetFile, 32768);

// Convert text with caching on both ends
BomDecoder decoder;
DecoderStream decoderStream(cachedSource, decoder);

Utf8Encoder encoder;
EncoderStream encoderStream(cachedTarget, encoder);

// CopyStream now benefits from caching on both streams
CopyStream(decoderStream, encoderStream);
```

## Network Stream Optimization

Improve performance for network-based streams:

```cpp
// Hypothetical network stream
NetworkStream networkStream(L"http://example.com/data");
CacheStream bufferedNetwork(networkStream, 131072);  // 128KB cache

// Reduce network round-trips
StreamReader reader(bufferedNetwork);
while (!reader.IsEnd())
{
    WString line = reader.ReadLine();  // Lines are cached locally
    ProcessLine(line);
}
```

## Memory vs. Performance Trade-offs

Choose cache size based on your needs:

```cpp
// Memory-constrained environment
CacheStream smallCache(stream, 2048);  // 2KB

// Performance-critical application
CacheStream largeCache(stream, 524288);  // 512KB

// Balanced approach
CacheStream balancedCache(stream, 65536);  // 64KB (default)
```

## Error Handling

`CacheStream` operations can fail if underlying stream fails:

```cpp
try
{
    FileStream fileStream(L"might_not_exist.txt", FileStream::ReadOnly);
    CacheStream cachedStream(fileStream);
    
    if (!cachedStream.IsAvailable())
    {
        Console::WriteLine(L"Failed to open cached stream");
        return;
    }
    
    char buffer[1024];
    vint bytesRead = cachedStream.Read(buffer, sizeof(buffer));
    Console::WriteLine(L"Read " + itow(bytesRead) + L" bytes");
}
catch (...)
{
    Console::WriteLine(L"Stream operation failed");
}
```

## Performance Benchmarking

Measure the performance impact:

```cpp
void BenchmarkWithoutCache()
{
    FileStream file(L"test_data.dat", FileStream::ReadOnly);
    char buffer[1];
    auto start = DateTime::LocalTime();
    
    for (vint i = 0; i < 100000; i++)
    {
        file.Read(buffer, 1);  // Many small reads
    }
    
    auto duration = DateTime::LocalTime().totalMilliseconds - start.totalMilliseconds;
    Console::WriteLine(L"Without cache: " + itow(duration) + L"ms");
}

void BenchmarkWithCache()
{
    FileStream file(L"test_data.dat", FileStream::ReadOnly);
    CacheStream cached(file, 8192);
    char buffer[1];
    auto start = DateTime::LocalTime();
    
    for (vint i = 0; i < 100000; i++)
    {
        cached.Read(buffer, 1);  // Cached reads
    }
    
    auto duration = DateTime::LocalTime().totalMilliseconds - start.totalMilliseconds;
    Console::WriteLine(L"With cache: " + itow(duration) + L"ms");
}
```

## Best Practices

1. **Size Selection**: Use larger caches for random access, smaller for sequential access.

2. **Memory Management**: Consider total memory usage when creating multiple cached streams.

3. **Auto-Flush**: `CacheStream` automatically flushes on destruction, but call `Close()` explicitly for error handling.

4. **Access Patterns**: Most beneficial for workloads with repeated access to the same data regions.

5. **Underlying Stream**: Works best with streams that have high per-operation costs (files, network, compressed data).

6. **Not Always Beneficial**: For very large sequential reads/writes, direct stream access might be more efficient.

`CacheStream` provides a transparent performance boost for many common stream operations, especially when dealing with multiple small operations or repeated access to the same data regions.