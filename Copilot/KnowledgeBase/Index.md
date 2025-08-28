# Knowledge Base

## Project Overview

### Vlpp

Files from Import:
- Vlpp.h
- Vlpp.cpp
- Vlpp.Windows.cpp
- Vlpp.Linux.cpp

Online documentation: https://gaclib.net/doc/current/vlpp/home.html

The goal of this project is to reduce the dependency to STL.

### VlppOS

Files from Import:
- VlppOS.h
- VlppOS.cpp
- VlppOS.Windows.cpp
- VlppOS.Linux.cpp

Online documentation: https://gaclib.net/doc/current/vlppos/home.html

The goal of this project is to make a thin layer of cross-platform OS abstraction.

### VlppRegex

Files from Import:
- VlppRegex.h
- VlppRegex.cpp

Online documentation: https://gaclib.net/doc/current/vlppregex/home.html

The goal of this project is to implement regular expression.

### VlppReflection

Files from Import:
- VlppReflection.h
- VlppReflection.cpp

Online documentation: https://gaclib.net/doc/current/vlppreflection/home.html

The goal of this project is to apply runtime reflection on C++ classes and functions.

### VlppParser2

Files from Import:
- VlppGlrParser.h
- VlppGlrParser.cpp

Online documentation: https://gaclib.net/doc/current/vlppparser2/home.html

The goal of this project is to implement GLR parsers based on customized and enhanced EBNF syntax.

### Workflow

Files from Import:
- VlppWorkflowLibrary.h
- VlppWorkflowLibrary.cpp
- VlppWorkflowCompiler.h
- VlppWorkflowCompiler.cpp
- VlppWorkflowRuntime.h
- VlppWorkflowRuntime.cpp

Online documentation: https://gaclib.net/doc/current/workflow/home.html

The goal of this project is to implement a script language based on C++ reflection.
It can execute the script if reflection is turned on.
It can generate equivalent C++ source files from the the script.

### GacUI

Online documentation: https://gaclib.net/doc/current/gacui/home.html

This repo contains C++ source code of the `GacUI` project.
The goal of this project is to build a cross-platform GUI library.
It also comes with a compiler to transform GacUI XML files into equivalent `Workflow` script files and further more equivalent C++ source files.

## Guidance

The following data types are preferred:

- For any code interops with Windows API, use Windows API specific types.
- Use signed integer type `vint` or unsigned integer type `vuint` for general purpose. It always has the size of a pointer.
- Use signed integer types when the size is critical: `vint8_t`, `vint16_t`, `vint32_t`, `vint64_t`.
- Use unsigned integer types when the size is critical: `vuint8_t`, `vuint16_t`, `vuint32_t`, `vuint64_t`.
- Use `atomic_vint` for atomic integers, it is a rename of `std::atomic<vint>`.
- Use `DateTime` for date times.

### Vlpp

Vlpp is the foundational library that provides STL replacements and basic utilities. It is the cornerstone of the entire framework, offering string handling, collections, lambda expressions, memory management, and primitive data types. Use this when you need basic data structures without depending on STL. This project prefers `wchar_t` over other char types and provides immutable string types, smart pointers, collection classes, and LINQ-like operations.

### VlppOS

VlppRegex provides regular expression functionality with .NET-like syntax but with important differences. Use this when you need pattern matching and text processing capabilities. Key differences include using both `/` and `\` for escaping, `.` accepting literal '.' character while `/.` accepts all characters, and performance considerations for DFA incompatible features.

### VlppReflection

VlppReflection provides runtime reflection capabilities for C++ classes and functions. Use this when you need to work with type metadata, register classes for scripting, or implement dynamic behavior. It supports three compilation levels: full reflection, metadata-only, and no reflection. Registration must happen in dedicated files and follows specific patterns for enums, structs, classes, and interfaces.

### VlppParser2

VlppParser2 implements GLR parsers based on customized and enhanced EBNF syntax. Use this when you need to parse complex grammars or implement domain-specific languages. The documentation for VlppParser2 is not ready yet according to the copilot instructions.

### Workflow

Workflow is a script language based on C++ reflection that can execute scripts at runtime or generate equivalent C++ code. Use this when you need scripting capabilities, code generation, or when working with GacUI XML files. It provides a C#-like syntax and can compile to both runtime execution and C++ source code generation.

### GacUI

GacUI is a cross-platform GUI library that comes with an XML-based UI definition system and a compiler. Use this when you need to create desktop applications with rich user interfaces. It provides a comprehensive testing framework, XML-to-C++ compilation, and integrates with the Workflow script language for event handling and data binding.

## Experiences and Learnings
