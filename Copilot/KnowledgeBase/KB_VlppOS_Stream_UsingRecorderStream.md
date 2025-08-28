# Using RecorderStream for Data Copying

`RecorderStream` is a specialized stream that reads from one input stream while simultaneously copying all read data to an output stream. This is useful for logging, backup, data mirroring, and debugging scenarios where you need to observe or duplicate data as it flows through your application.

## Basic Data Recording

Record all data read from a file to another file:

```cpp
FileStream inputFile(L"source.txt", FileStream::ReadOnly);
FileStream logFile(L"read_log.txt", FileStream::WriteOnly);
RecorderStream recorder(inputFile, logFile);

// Read from recorder - data is automatically copied to logFile
char buffer[1024];
vint bytesRead = recorder.Read(buffer, sizeof(buffer));

// At this point, both buffer contains the data AND logFile has a copy
```

## Stream Processing with Logging

Monitor data flow during encoding operations:

```cpp
FileStream inputFile(L"data.txt", FileStream::ReadOnly);
FileStream logFile(L"processing.log", FileStream::WriteOnly);
RecorderStream recorder(inputFile, logFile);

// Process data while logging everything that passes through
BomDecoder decoder;
DecoderStream decoderStream(recorder, decoder);
StreamReader reader(decoderStream);

WString content = reader.ReadToEnd();
// logFile now contains the raw encoded data that was read
```

## Data Backup During Processing

Create automatic backups while reading:

```cpp
FileStream criticalData(L"important.dat", FileStream::ReadOnly);
FileStream backupFile(L"backup.dat", FileStream::WriteOnly);
RecorderStream recorder(criticalData, backupFile);

// Process critical data while creating backup
while (true)
{
    char block[4096];
    vint bytesRead = recorder.Read(block, sizeof(block));
    if (bytesRead == 0) break;
    
    ProcessDataBlock(block, bytesRead);
    // backupFile automatically receives a copy of each block
}
```

## Network Data Mirroring

Mirror network data to local storage:

```cpp
// Hypothetical network stream
NetworkStream networkData(L"https://api.example.com/data");
FileStream mirrorFile(L"network_mirror.dat", FileStream::WriteOnly);
RecorderStream recorder(networkData, mirrorFile);

// Read from network while saving to local file
StreamReader reader(recorder);
WString response = reader.ReadToEnd();

// Process the response knowing a complete copy is saved locally
ProcessApiResponse(response);
```

## Multi-Stream Recording

Record to multiple destinations using `BroadcastStream`:

```cpp
FileStream inputFile(L"source.txt", FileStream::ReadOnly);
FileStream log1(L"log1.txt", FileStream::WriteOnly);
FileStream log2(L"log2.txt", FileStream::WriteOnly);

BroadcastStream broadcaster;
broadcaster.Targets().Add(&log1);
broadcaster.Targets().Add(&log2);

RecorderStream recorder(inputFile, broadcaster);

// Reading from recorder copies data to both log files
StreamReader reader(recorder);
WString content = reader.ReadToEnd();
```

## Debugging Data Corruption

Use recorder to capture exact data being read:

```cpp
FileStream suspiciousFile(L"possibly_corrupt.dat", FileStream::ReadOnly);
FileStream debugDump(L"debug_dump.dat", FileStream::WriteOnly);
RecorderStream recorder(suspiciousFile, debugDump);

try
{
    // Attempt to process potentially corrupt data
    CustomDecoder decoder;
    DecoderStream decoderStream(recorder, decoder);
    
    ProcessDecodedData(decoderStream);
}
catch (...)
{
    Console::WriteLine(L"Processing failed - check debug_dump.dat for raw data");
    // debugDump contains exactly what was read before failure
}
```

## Progress Monitoring

Track reading progress by monitoring the recorder's output:

```cpp
class ProgressStream : public IStream
{
private:
    IStream* targetStream;
    vint totalBytesRecorded = 0;
    
public:
    ProgressStream(IStream* target) : targetStream(target) {}
    
    vint Write(void* buffer, vint size) override
    {
        vint written = targetStream->Write(buffer, size);
        totalBytesRecorded += written;
        
        if (totalBytesRecorded % 1048576 == 0)  // Every MB
        {
            Console::WriteLine(L"Processed: " + itow(totalBytesRecorded / 1048576) + L" MB");
        }
        
        return written;
    }
    
    // Implement other IStream methods...
};

FileStream largeFile(L"huge_data.txt", FileStream::ReadOnly);
FileStream backupFile(L"backup.txt", FileStream::WriteOnly);
ProgressStream progressMonitor(&backupFile);
RecorderStream recorder(largeFile, progressMonitor);

// Process with automatic progress reporting
ProcessLargeFile(recorder);
```

## Stream Validation

Validate data integrity by comparing input and recorded output:

```cpp
FileStream inputFile(L"test_data.txt", FileStream::ReadOnly);
MemoryStream recordedData;
RecorderStream recorder(inputFile, recordedData);

// Read all data through recorder
Array<char> buffer(1024);
List<char> allData;
while (true)
{
    vint bytesRead = recorder.Read(&buffer[0], buffer.Count());
    if (bytesRead == 0) break;
    
    for (vint i = 0; i < bytesRead; i++)
    {
        allData.Add(buffer[i]);
    }
}

// Verify recorded data matches what we read
recordedData.SeekFromBegin(0);
Array<char> recordedBuffer(recordedData.Size());
recordedData.Read(&recordedBuffer[0], recordedBuffer.Count());

bool dataMatches = true;
if (allData.Count() == recordedBuffer.Count())
{
    for (vint i = 0; i < allData.Count(); i++)
    {
        if (allData[i] != recordedBuffer[i])
        {
            dataMatches = false;
            break;
        }
    }
}

Console::WriteLine(dataMatches ? L"Data integrity verified" : L"Data mismatch detected");
```

## Error Handling

Handle failures in either input or output streams:

```cpp
try
{
    FileStream inputFile(L"source.txt", FileStream::ReadOnly);
    FileStream outputFile(L"record.txt", FileStream::WriteOnly);
    
    if (!inputFile.IsAvailable())
    {
        Console::WriteLine(L"Cannot open input file");
        return;
    }
    
    if (!outputFile.IsAvailable())
    {
        Console::WriteLine(L"Cannot create output file");
        return;
    }
    
    RecorderStream recorder(inputFile, outputFile);
    
    if (!recorder.IsAvailable())
    {
        Console::WriteLine(L"Recorder stream not available");
        return;
    }
    
    // Use recorder...
    char buffer[1024];
    vint bytesRead = recorder.Read(buffer, sizeof(buffer));
    
    Console::WriteLine(L"Successfully recorded " + itow(bytesRead) + L" bytes");
}
catch (...)
{
    Console::WriteLine(L"Recording operation failed");
}
```

## Stream Capabilities

`RecorderStream` has specific capabilities:

- **Readable**: Yes (if input stream is readable)
- **Writable**: No (read-only operation)
- **Seekable**: No (sequential operation only)
- **Peekable**: No
- **Limited**: Depends on input stream

```cpp
FileStream file(L"data.txt", FileStream::ReadOnly);
MemoryStream recorder;
RecorderStream recorderStream(file, recorder);

Console::WriteLine(L"Can read: " + (recorderStream.CanRead() ? L"Yes" : L"No"));
Console::WriteLine(L"Can write: " + (recorderStream.CanWrite() ? L"Yes" : L"No"));
Console::WriteLine(L"Can seek: " + (recorderStream.CanSeek() ? L"Yes" : L"No"));
```

## Performance Considerations

1. **Single Write Attempt**: Recorder makes only one write attempt per read - ensure output stream can handle the full write.

2. **Error Propagation**: If output stream write fails, the read operation fails even if input stream is working.

3. **Memory Usage**: No additional buffering beyond what input/output streams provide.

4. **Sequential Only**: Cannot seek or peek - designed for forward-only data flow.

## Best Practices

1. **Output Stream Reliability**: Ensure output streams are reliable (local files, sufficient disk space).

2. **Error Handling**: Always check both input and output stream availability.

3. **Resource Management**: Ensure both streams are properly closed after use.

4. **Single Pass**: Design your processing to work with sequential, non-seekable access.

5. **Monitoring**: Use recorder for audit trails and debugging - very helpful for troubleshooting data processing issues.

`RecorderStream` provides a simple but powerful way to create data copies during normal stream processing, making it invaluable for logging, debugging, and data integrity scenarios.