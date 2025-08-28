# Using BroadcastStream for Multiple Targets

`BroadcastStream` is a write-only stream that copies all written data to multiple target streams simultaneously. This is useful for logging to multiple destinations, creating real-time backups, distributing data to multiple consumers, and implementing fan-out patterns.

## Basic Broadcasting

Write to multiple files simultaneously:

```cpp
FileStream file1(L"output1.txt", FileStream::WriteOnly);
FileStream file2(L"output2.txt", FileStream::WriteOnly);
FileStream file3(L"output3.txt", FileStream::WriteOnly);

BroadcastStream broadcaster;
broadcaster.Targets().Add(&file1);
broadcaster.Targets().Add(&file2);
broadcaster.Targets().Add(&file3);

// Single write operation copies to all target streams
WString message = L"This message goes to all files";
StreamWriter writer(broadcaster);
writer.WriteString(message);
// All three files now contain the message
```

## Dynamic Target Management

Add and remove targets dynamically:

```cpp
BroadcastStream broadcaster;
FileStream primaryLog(L"primary.log", FileStream::WriteOnly);
FileStream debugLog(L"debug.log", FileStream::WriteOnly);

// Start with primary logging
broadcaster.Targets().Add(&primaryLog);

StreamWriter writer(broadcaster);
writer.WriteLine(L"Application started");

// Add debug logging later
broadcaster.Targets().Add(&debugLog);
writer.WriteLine(L"Debug logging enabled");

// Remove debug logging
broadcaster.Targets().Remove(&debugLog);
writer.WriteLine(L"Debug logging disabled");
```

## Multi-Level Logging

Implement different log levels with selective broadcasting:

```cpp
class LogLevel
{
public:
    static const vint INFO = 1;
    static const vint WARNING = 2;
    static const vint ERROR = 4;
    static const vint DEBUG = 8;
};

class MultiLevelLogger
{
private:
    FileStream infoLog, warningLog, errorLog, debugLog;
    BroadcastStream infoBroadcast, warningBroadcast, errorBroadcast;
    
public:
    MultiLevelLogger()
        : infoLog(L"info.log", FileStream::WriteOnly)
        , warningLog(L"warning.log", FileStream::WriteOnly)
        , errorLog(L"error.log", FileStream::WriteOnly)
        , debugLog(L"debug.log", FileStream::WriteOnly)
    {
        // Info messages go to info and all higher levels
        infoBroadcast.Targets().Add(&infoLog);
        
        // Warning messages go to warning and error logs
        warningBroadcast.Targets().Add(&warningLog);
        warningBroadcast.Targets().Add(&errorLog);
        
        // Error messages go to error log
        errorBroadcast.Targets().Add(&errorLog);
    }
    
    void LogInfo(const WString& message)
    {
        StreamWriter writer(infoBroadcast);
        writer.WriteLine(L"INFO: " + message);
    }
    
    void LogWarning(const WString& message)
    {
        StreamWriter writer(warningBroadcast);
        writer.WriteLine(L"WARNING: " + message);
    }
    
    void LogError(const WString& message)
    {
        StreamWriter writer(errorBroadcast);
        writer.WriteLine(L"ERROR: " + message);
    }
};
```

## Real-Time Backup

Create real-time backups during data processing:

```cpp
FileStream primaryOutput(L"primary_data.txt", FileStream::WriteOnly);
FileStream backup1(L"backup1_data.txt", FileStream::WriteOnly);
FileStream backup2(L"backup2_data.txt", FileStream::WriteOnly);

BroadcastStream multiOutput;
multiOutput.Targets().Add(&primaryOutput);
multiOutput.Targets().Add(&backup1);
multiOutput.Targets().Add(&backup2);

// Process data with automatic backup
StreamWriter writer(multiOutput);
for (vint i = 0; i < 1000; i++)
{
    WString data = L"Data record " + itow(i);
    writer.WriteLine(data);
    // Data is written to all three files simultaneously
}
```

## Network and Local Distribution

Distribute data to both network and local destinations:

```cpp
// Hypothetical network stream
NetworkStream networkDestination(L"http://backup.example.com/upload");
FileStream localBackup(L"local_backup.dat", FileStream::WriteOnly);
MemoryStream memoryBuffer;

BroadcastStream distributor;
distributor.Targets().Add(&networkDestination);
distributor.Targets().Add(&localBackup);
distributor.Targets().Add(&memoryBuffer);

// Write data that goes to network, local file, and memory
char importantData[1024] = { /* ... */ };
distributor.Write(importantData, sizeof(importantData));
```

## Conditional Broadcasting

Implement conditional target activation:

```cpp
class ConditionalBroadcaster
{
private:
    BroadcastStream broadcaster;
    FileStream productionLog, debugLog, auditLog;
    bool debugEnabled = false;
    bool auditEnabled = false;
    
public:
    ConditionalBroadcaster()
        : productionLog(L"production.log", FileStream::WriteOnly)
        , debugLog(L"debug.log", FileStream::WriteOnly)
        , auditLog(L"audit.log", FileStream::WriteOnly)
    {
        // Production log always active
        broadcaster.Targets().Add(&productionLog);
    }
    
    void EnableDebug(bool enable)
    {
        if (enable && !debugEnabled)
        {
            broadcaster.Targets().Add(&debugLog);
            debugEnabled = true;
        }
        else if (!enable && debugEnabled)
        {
            broadcaster.Targets().Remove(&debugLog);
            debugEnabled = false;
        }
    }
    
    void EnableAudit(bool enable)
    {
        if (enable && !auditEnabled)
        {
            broadcaster.Targets().Add(&auditLog);
            auditEnabled = true;
        }
        else if (!enable && auditEnabled)
        {
            broadcaster.Targets().Remove(&auditLog);
            auditEnabled = false;
        }
    }
    
    void WriteMessage(const WString& message)
    {
        StreamWriter writer(broadcaster);
        writer.WriteLine(message);
    }
};
```

## Error Handling with Multiple Targets

Handle partial failures gracefully:

```cpp
class ReliableBroadcaster : public IStream
{
private:
    List<IStream*> targets;
    vint successfulWrites = 0;
    
public:
    void AddTarget(IStream* target)
    {
        targets.Add(target);
    }
    
    vint Write(void* buffer, vint size) override
    {
        successfulWrites = 0;
        
        for (auto target : targets)
        {
            try
            {
                if (target->IsAvailable() && target->CanWrite())
                {
                    vint written = target->Write(buffer, size);
                    if (written == size)
                    {
                        successfulWrites++;
                    }
                }
            }
            catch (...)
            {
                // Log failure but continue with other targets
                Console::WriteLine(L"Write failed to one target");
            }
        }
        
        return successfulWrites > 0 ? size : 0;  // Success if any target succeeded
    }
    
    vint GetSuccessfulWrites() const { return successfulWrites; }
    
    // Implement other IStream methods...
};

// Usage with error tolerance
ReliableBroadcaster broadcaster;
FileStream file1(L"output1.txt", FileStream::WriteOnly);
FileStream file2(L"invalid_path/output2.txt", FileStream::WriteOnly);  // May fail
FileStream file3(L"output3.txt", FileStream::WriteOnly);

broadcaster.AddTarget(&file1);
broadcaster.AddTarget(&file2);
broadcaster.AddTarget(&file3);

WString data = L"Test data";
StreamWriter writer(broadcaster);
writer.WriteString(data);

Console::WriteLine(L"Successful writes: " + itow(broadcaster.GetSuccessfulWrites()));
```

## Performance Monitoring

Monitor broadcasting performance:

```cpp
class PerformanceMonitoredBroadcast : public IStream
{
private:
    BroadcastStream* broadcaster;
    vint totalWrites = 0;
    vint totalBytes = 0;
    
public:
    PerformanceMonitoredBroadcast(BroadcastStream* broadcast)
        : broadcaster(broadcast) {}
    
    vint Write(void* buffer, vint size) override
    {
        auto start = DateTime::LocalTime();
        vint written = broadcaster->Write(buffer, size);
        auto duration = DateTime::LocalTime().totalMilliseconds - start.totalMilliseconds;
        
        totalWrites++;
        totalBytes += written;
        
        if (totalWrites % 100 == 0)
        {
            Console::WriteLine(L"Broadcast stats: " + itow(totalWrites) + 
                             L" writes, " + itow(totalBytes) + L" bytes, " +
                             L"avg " + itow(duration) + L"ms per write");
        }
        
        return written;
    }
    
    // Implement other IStream methods...
};
```

## Stream Capabilities

`BroadcastStream` has specific capabilities:

- **Readable**: No (write-only)
- **Writable**: Yes (when available)
- **Seekable**: No
- **Peekable**: No
- **Limited**: No (infinite write capacity)

```cpp
BroadcastStream broadcaster;
Console::WriteLine(L"Can read: " + (broadcaster.CanRead() ? L"Yes" : L"No"));       // No
Console::WriteLine(L"Can write: " + (broadcaster.CanWrite() ? L"Yes" : L"No"));     // Yes
Console::WriteLine(L"Can seek: " + (broadcaster.CanSeek() ? L"Yes" : L"No"));       // No
Console::WriteLine(L"Is limited: " + (broadcaster.IsLimited() ? L"Yes" : L"No"));   // No
```

## Target Stream Requirements

Each target stream should:

```cpp
BroadcastStream broadcaster;
FileStream target(L"output.txt", FileStream::WriteOnly);

// Verify target suitability
if (target.IsAvailable() && target.CanWrite())
{
    broadcaster.Targets().Add(&target);
    Console::WriteLine(L"Target added successfully");
}
else
{
    Console::WriteLine(L"Target stream not suitable for broadcasting");
}
```

## Best Practices

1. **Target Verification**: Always verify that target streams are available and writable before adding them.

2. **Error Handling**: Consider what happens if some targets fail - decide whether to continue or abort.

3. **Performance Impact**: Each write is multiplied by the number of targets - consider the performance implications.

4. **Resource Management**: Ensure all target streams are properly managed and closed.

5. **Single Write Attempt**: BroadcastStream makes only one write attempt per target - ensure targets can handle the full write.

6. **Memory Management**: Target list uses references - ensure target streams remain valid for the broadcaster's lifetime.

`BroadcastStream` provides an efficient way to implement fan-out patterns, making it ideal for logging systems, data distribution, and real-time backup scenarios where data needs to reach multiple destinations simultaneously.