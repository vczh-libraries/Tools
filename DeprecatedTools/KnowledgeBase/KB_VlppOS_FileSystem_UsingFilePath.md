# Using FilePath for Path Manipulation

The `FilePath` class in VlppOS provides cross-platform path manipulation utilities. It automatically handles platform-specific path separators and provides various methods for working with file and folder paths.

## Creating FilePath Objects

### Default Constructor (Root Path)
```cpp
using namespace vl::filesystem;

// Create a root path
FilePath rootPath;
// rootPath.IsRoot() returns true
```

### From String Path
```cpp
// Create from string literal
FilePath path1(L"/home/user/documents");
FilePath path2(L"C:\\Users\\User\\Documents");  // Windows-style

// Create from WString
WString pathString = L"/path/to/file.txt";
FilePath path3(pathString);

// Relative paths are automatically converted to absolute paths
FilePath path4(L"../relative/path");
```

### Copy Constructor
```cpp
FilePath original(L"/home/user");
FilePath copy(original);
```

## Path Information Methods

### Getting Path Components
```cpp
FilePath filePath(L"/home/user/documents/file.txt");

// Get the file or folder name (last component)
WString name = filePath.GetName();  // Returns "file.txt"

// Get the parent folder
FilePath parentFolder = filePath.GetFolder();  // Returns "/home/user/documents"

// Get the full absolute path
WString fullPath = filePath.GetFullPath();  // Returns "/home/user/documents/file.txt"
```

### Path Type Testing
```cpp
FilePath filePath(L"/home/user/documents/file.txt");
FilePath folderPath(L"/home/user/documents");
FilePath rootPath;

// Test if the path represents a file
bool isFile = filePath.IsFile();        // true if file exists

// Test if the path represents a folder
bool isFolder = folderPath.IsFolder();  // true if folder exists

// Test if the path is the root
bool isRoot = rootPath.IsRoot();         // true for root path
```

## Path Operations

### Combining Paths with operator/
```cpp
FilePath basePath(L"/home/user");
WString relativePath = L"documents/file.txt";

// Combine absolute path with relative path
FilePath combinedPath = basePath / relativePath;
// Result: "/home/user/documents/file.txt"

// Chaining multiple path components
FilePath complexPath = basePath / L"projects" / L"myapp" / L"src" / L"main.cpp";
```

### Getting Relative Paths
```cpp
FilePath basePath(L"/home/user");
FilePath targetPath(L"/home/user/documents/file.txt");

// Get relative path from base to target
WString relativePath = targetPath.GetRelativePathFor(basePath);
// Result: "documents/file.txt"
```

## Platform-Specific Considerations

### Path Delimiters
```cpp
// The delimiter is automatically set based on platform
#ifdef VCZH_MSVC
    // On Windows: FilePath::Delimiter = L'\\'
#else
    // On Linux/macOS: FilePath::Delimiter = L'/'
#endif

// You can always use forward slashes - they work on all platforms
FilePath path(L"folder/subfolder/file.txt");  // Works on Windows too
```

## Common Usage Patterns

### Building File Paths Dynamically
```cpp
FilePath projectRoot(L"/projects/myapp");
FilePath sourceFile = projectRoot / L"src" / L"components" / L"main.cpp";
FilePath configFile = projectRoot / L"config" / L"settings.json";
```

### Navigating Directory Structures
```cpp
FilePath currentFile(L"/projects/myapp/src/utils/helper.cpp");

// Go up two levels to project root
FilePath projectRoot = currentFile.GetFolder().GetFolder().GetFolder();

// Get sibling directories
FilePath testsDir = projectRoot / L"tests";
FilePath docsDir = projectRoot / L"docs";
```

### Working with File Extensions and Names
```cpp
FilePath filePath(L"/documents/report.pdf");

WString fileName = filePath.GetName();  // "report.pdf"

// To extract extension, you'd need to process the name
WString name = filePath.GetName();
vint dotIndex = name.Length() - 1;
while (dotIndex >= 0 && name[dotIndex] != L'.')
{
    dotIndex--;
}
WString extension = dotIndex >= 0 ? name.Right(name.Length() - dotIndex - 1) : L"";
// extension = "pdf"
```

## Error Handling

FilePath operations generally don't throw exceptions for invalid paths, but path type testing methods (IsFile, IsFolder) will return false for non-existent paths:

```cpp
FilePath nonExistentPath(L"/does/not/exist");

// These will return false for non-existent paths
bool isFile = nonExistentPath.IsFile();      // false
bool isFolder = nonExistentPath.IsFolder();  // false
bool isRoot = nonExistentPath.IsRoot();      // false

// But you can still manipulate the path
WString name = nonExistentPath.GetName();    // "exist"
FilePath parent = nonExistentPath.GetFolder(); // "/does/not"
```