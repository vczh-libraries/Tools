# Using Vlpp

The following data types are preferred:

- For any code interops with Windows API, use Windows API specific types.
- Use signed integer type `vint` or unsigned integer type `vuint` for general purpose. It always has the size of a pointer.
- Use signed integer types when the size is critical: `vint8_t`, `vint16_t`, `vint32_t`, `vint64_t`.
- Use unsigned integer types when the size is critical: `vuint8_t`, `vuint16_t`, `vuint32_t`, `vuint64_t`.
- Use `atomic_vint` for atomic integers, it is a rename of `std::atomic<vint>`.
- Use `DateTime` for date times.

## String

`ObjectString<T>` is an immutable string. It cannot be modified after initialized. Any updating results in a new string value returned.

- The project prefers `wchar_t` other than other types.
  - Please note that, on Windows it is UTF-16, on other platforms it is UTF-32.
  - Use `char8_t` instead of `char` for UTF-8.
- The project prefers `WString` other than other string types. It is a rename of `ObjectString<wchar_t>`. Other string types are:
  - `AString`: ASCII string, which is `ObjectString<char>`.
  - `U8String`: UTF-8 string, which is `ObjectString<char8_t>`.
  - `U16String`: UTF-16 string, which is `ObjectString<char16_t>`.
  - `U32String`: UTF-32 string, which is `ObjectString<char32_t>`.
  - Always use aliases instead of `ObjectString`.

Use the following static functions to initialize a `WString`:
  - `Unmanaged(L"string-literal")`: it only works on string literals.
  - `CopyFrom(wchar_t*, vint)`: copy a string.
    - In case we don't have the length in hand, we can call the constructor on a `wchar_t*`, it also copies.
  - `TakeOver(wchar_t*, vint)`: take over the pointer from `new[]`, `delete[]` will be automatically called when `WString` is about to destruct.
  - The same to others, note that we need to use different char types for different string types accordingly.

To convert from `WString` to integer: `wtoi`, `wtoi64`, `wtou`, `wtou64`.
To convert from integer to `WString`: `itow`, `i64tou`, `utow`, `u64tow`.
To convert between `double` and `WString`: `ftow`, `wtof`.
To make all letters upper or lower: `wupper`, `wlower`.

To convert between UTF strings, use `ConvertUtfString<From, To>`. `From` and `To` are char types, like `ConvertUtfString<wchar_t, char8_t>`. It is useful when you don't know the actual type, especially in template functions.

To convert between strings when you know the actual char types, use `AtoB`. Here `A` and `B` could be:
  - `w`: `WString`.
  - `u8`: `U8String`.
  - `u16`: `U16String`.
  - `u32`: `U32String`.
  - `a`: `AString`.
  - It is easy to see `wtou8` is actually `ConvertUtfString<wchar_t, char8_t>`.

## Exception Handling

There are `Error` and `Exception`.

`Error` is a base class, representing fatal errors which you can't recover by try-catch.
In some rase cases when you have to catch it, you must always raise it again in the catch statement.
It can be used to report a condition that should never happen.
Use `CHECK_ERROR(condition, L"string-literal")` to raise an `Error` when the assertion fails.
Use `CHECK_FAIL(L"string-literal")` to raise an `Error`. It is similar to `CHECK_ERROR` but it allows you to say a failed assertion if the condition cannot be described by just a condition.

`Exception` is a base class, representing errors that you may want to catch.
It can be used to report error that made by the user.
Some code also use `Exception` as control flows. For example, you could define your own `Exception` sub class, raise it inside a deep recursion and catch it from the outside, as a way of quick exiting.

## Object Modal

Always use `struct` for value types and `class` for reference types.
All reference types must inherits from `Object` or other reference types.
All interface types must virtual inherits from `Interface` or other interface types.
A reference type must virtual inherits an interface type to implement it.

Prefer `Ptr<T>` to hold an initialized reference type instead of using C++ pointers, e.g. `auto x = Ptr(new X(...));`.
`Ptr<T>` is similar to `std::shared_ptr<T>`.
There is no `std::weak_ptr<T>` equivalent constructions, use raw C++ pointers in such cases, but you should try your best to avoid it.

`ComPtr<T>` is similar to `Ptr<T>` but it is for COM objects with Windows API only.

### Special Case

Use `class` for defining new `Error` or `Exception` sub classes, although they are value types.

Collection types are also value types, although they implements `IEnumerable<T>` and `IEnumerator<T>`.
This is also a reason we always use references instead of pointers on `IEnumerable<T>` and `IEnumerator<T>`.

## Lambda Expressions and Callable Types

### Func<T(TArgs...)>

### Event<void(TArgs...)>

## Other Primitive Types

### Pair<Key, Value>

### Tuple<T...>

### Variant<T...>

## Collection Types

### IEnumerable<T> and IEnumerator<T>

### Array<T>

### List<T>

### SortedList<T>

### Dictionary<Key, Value>

### Group<Key, Value>

### Sorting and Partial Ordering

## Linq for C++

## Iterating with Collections, Linq, and also C++ Arrays/Pointers/STL Iterators

## Command Line Interactions for Console Application

## Memory Leak Detection

### GlobalStorage
