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

Use static functions `ThreadPoolLite::Queue` or `ThreadPoolLite::QueueLambda` to run a function in another thread.

Use static function `Thread::Sleep` to pause the current thread for some milliseconds.

Use static function `Thread::GetCurrentThreadId` to get an identifier for the OS native thread running the current function.

`Thread::CreateAndStart` could be used to run a function in another thread while returning a `Thread*` to control it, but this is not recommended.
Always use `ThreadPoolLite` if possible.
A `ThreadPoolLite` call with an `EventObject` is a better version of `Thread::Wait`.

## Non-WaitableObject

Only use `SpinLock` when the protected code exists super fast.
Only use `CriticalSection` when the protected code costs time.

### SpinLock

- `Enter` blocks the current thread, and when it returns, the current thread owns the spin lock.
  - Only one thread owns the spin lock.
  - `TryEnter` does not block the current thread, and there is a chance that the current thread will own the spin lock, indicated by the return value.
- `Leave` releases the spin lock from the current thread.

When it is able to `Enter` and `Leave` in the same function, use `SPIN_LOCK` to simplify the code.
It is also exception safety, so you don't need to worry about try-catch:

```C++
SpinLock lock;
SPIN_LOCK(lock)
{
  // fast code that owns the spin lock
}
```

### CritcalSection

- `Enter` blocks the current thread, and when it returns, the current thread owns the critical section.
  - Only one thread owns the critical section.
  - `TryEnter` does not block the current thread, and there is a chance that the current thread will own the critical section, indicated by the return value.
- `Leave` releases the critical section from the current thread.

When it is able to `Enter` and `Leave` in the same function, use `CS_LOCK` to simplify the code.
It is also exception safety, so you don't need to worry about try-catch:

```C++
CriticalSection cs;
CS_LOCK(cs)
{
  // slow code that owns the critical section
}
```

### ReaderWriterLock

`ReaderWriterLock` is an advanced version of `CriticalSection`:
  - Multiple threads could own the same reader lock. When it happens, it prevents any thread from owning the writer lock.
  - Only one threads could own the writer lock. When it happens, it prevents any thread from owning the reader lock.
- Call `TryEnterReader`, `EnterReader` and `LeaveReader` to access the reader lock.
- Call `TryEnterWriter`, `EnterWriter` and `LeaveWriter` to access the writer lock.

When it is able to `EnterReader` and `LeaveReader` in the same function, use `READER_LOCK` to simplify the code.
When it is able to `EnterWriter` and `LeaveWriter` in the same function, use `WRITER_LOCK` to simplify the code.
They are also exception safety, so you don't need to worry about try-catch:

```C++
ReaderWriterLock rwlock;
READER_LOCK(rwlock)
{
  // code that owns the reader lock
}
WRITER_LOCK(rwlock)
{
  // code that owns the writer lock
}
```

### ConditionVariable

A `ConditionVariable` works with a `CriticalSection` or a `ReaderWriterLock`.
  - Call `SleepWith` to work with a `CriticalSection`. It works on both Windows and Linux.
  - Call `SleepWithForTime` to work with a `CriticalSection` with a timeout. It only works on Windows.
  - Call `SleepWithReader`, `SleepWithReaderForTime`, `SleepWriter` or `SleepWriterForTime` to work with a `ReaderWriterLock`. They only work on Windows.

The `Sleep*` function temporarily releases the lock from the current thread, and block the current thread until it owns the lock again.
  - Before calling the `Sleep*` function, the current thread must own the lock.
  - Calling the `Sleep*` function releases the lock from the current thread, and block the current thread.
  - The `Sleep*` function returns when `WakeOnePending` or `WaitAllPendings` is called.
    - The `Sleep*ForTime` function could also return when it reaches the timeout. But this will not always happen, because:
      - `WaitOnePending` only activates one thread pending on the condition variable.
      - `WaitAllPendings` activates all thread but they are also controlled by the lock.
    - When `Sleep*` returns, the current thread owns the lock.

## WaitableObject

All locks mentioned here implements `WaitableObject`. A `WaitableObject` offer these functions to wait while blocking the current thread:
  - `Wait`: wait until it signals. It could return false meaning the wait operation did not succeed and there is no guarantee about the status of the `WaitableObject`.
  - `WaitForTime`: wait until it signals with a timeout. It could return false like `Wait`, including reaching the timeout.
    - IMPORTANT: it is Windows only.

There are also static functions `WaitAll`, `WaitAllForTime`, `WaitAny`, `WaitAnyForTime` to wait for multiple `WaitableObject` at the same time.
  - IMPORTANT: they are Windows only.

All following classes are named after Windows API. Their Linux version works exactly like Windows but with less features.

### Mutex

- `Mutex` pretty much serves the same purpose like `SpinLock` and `CriticalSection`, but it could be shared across multiple processes, meanwhile costs more OS resource. Prefer `SpinLock` or `CriticalSection` one only operates in one process.
- The constructor does not actually create a mutex. You must call `Create` and `Open` later.
- The `Create` method creates a mutex.
  - If the name is not empty, the mutex is associated to a name, which works across different processes.
  - No thread owns a mutex that is just created.
- The `Open` method shares a created mutex with a name.
- Calling `Wait` will block the current thread until it owns the mutex. Calling `Release` release the owned mutex to other threads.

### Semaphore

- The constructor does not actually create a semaphore. You must call `Create` and `Open` later.
- The `Create` method creates a semaphore.
  - If the name is not empty, the semaphore is associated to a name, which works across different processes.
  - No thread owns a semaphore that is just created.
- The `Open` method shares a created semaphore with a name.
- Calling `Wait` will block the current thread until it owns the semaphore.
  - Calling `Release` release the semaphore, for once or multiple times.
  - Unlike `Mutex`, multiple threads could own the same semaphore, as long as enough `Release` is called. And a thread doesn't need to own a semaphore to release it.

### EventObject

- The constructor does not actually create an event object. You must call `CreateAutoUnsignal`, `CreateManualUnsignal` and `Open` later.
- The `CreateAutoUnsignal` and `CreateManualUnsignal` method creates an event object.
  - An auto unsignal event object means, when it is owned by a thread, it automatically unsignaled. So only one thread will be unblocked. Otherwise multiple threads waiting for this event object will be unblocked at the same time.
  - If the name is not empty, the event object is associated to a name, which works across different processes.
- The `Open` method shares a created event object with a name.
- Calling `Wait` will block the current thread until it is signaled.
- Calling `Signal` to signal an event object.
- Calling `Unsignal` to unsignal an event object.
