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

#### String Types
- [Working with Utf and Ansi String Types](KB_Vlpp_String_WorkingWithUtfAndAnsiStringTypes.md)
- [Converting Between UTF Encodings](KB_Vlpp_String_ConvertingBetweenUTFEncodings.md)
- [Converting Strings to Numbers](KB_Vlpp_String_ConvertingStringsToNumbers.md)
- [Converting Numbers to Strings](KB_Vlpp_String_ConvertingNumbersToStrings.md)
- [Converting Between Double and String](KB_Vlpp_String_ConvertingBetweenDoubleAndString.md)
- [String Case Conversion](KB_Vlpp_String_StringCaseConversion.md)

#### Array Collection
- [Using Array for Fixed Size Collections](KB_Vlpp_Collections_UsingArray.md)

#### List Collections
- [Using List for Dynamic Collections](KB_Vlpp_Collections_UsingList.md)
- [Using SortedList for Ordered Collections](KB_Vlpp_Collections_UsingSortedList.md)

#### Dictionary Collections
- [Using Dictionary for Key-Value Mapping](KB_Vlpp_Collections_UsingDictionary.md)
- [Using Group for One-to-Many Mapping](KB_Vlpp_Collections_UsingGroup.md)

#### LINQ Operations
- [Using LazyList for LINQ Operations](KB_Vlpp_Collections_UsingLazyListForLINQ.md)
- [Using From Function with Collections](KB_Vlpp_Collections_UsingFromFunction.md)
- [Working with IEnumerable and IEnumerator](KB_Vlpp_Collections_WorkingWithIEnumerable.md)

#### Sorting and Ordering
- [Using Sort Function for Quick Sort](KB_Vlpp_Collections_UsingSortFunction.md)
- [Using PartialOrderingProcessor](KB_Vlpp_Collections_UsingPartialOrderingProcessor.md)

#### Collection Iteration
- [Using Range-Based For Loop with Collections](KB_Vlpp_Collections_UsingRangeBasedForLoop.md)
- [Using Indexed Function for Index Access](KB_Vlpp_Collections_UsingIndexedFunction.md)

#### Smart Pointers
- [Using Ptr for Shared Ownership](KB_Vlpp_Memory_UsingPtr.md)
- [Using ComPtr for COM Objects](KB_Vlpp_Memory_UsingComPtr.md)
- [Working with Raw Pointers as Weak References](KB_Vlpp_Memory_WorkingWithRawPointers.md)

#### Nullable Types
- [Using Nullable for Optional Values](KB_Vlpp_Memory_UsingNullable.md)

#### Global Storage Management
- [Defining Global Storage Classes](KB_Vlpp_Memory_DefiningGlobalStorageClasses.md)
- [Using Global Storage for Memory Leak Detection](KB_Vlpp_Memory_UsingGlobalStorageForMemoryLeakDetection.md)

#### Function Types
- [Using Func for Callable Objects](KB_Vlpp_Lambda_UsingFunc.md)
- [Using Event for Multiple Callbacks](KB_Vlpp_Lambda_UsingEvent.md)
- [Working with Lambda Expressions](KB_Vlpp_Lambda_WorkingWithLambdaExpressions.md)

#### Tuple Types
- [Using Pair for Two Values](KB_Vlpp_Primitives_UsingPair.md)
- [Using Tuple for Multiple Values](KB_Vlpp_Primitives_UsingTuple.md)
- [Working with Structured Binding](KB_Vlpp_Primitives_WorkingWithStructuredBinding.md)

#### Variant Types
- [Using Variant for Union Types](KB_Vlpp_Primitives_UsingVariant.md)
- [Working with Variant Apply and Overloading](KB_Vlpp_Primitives_WorkingWithVariantApply.md)

#### Error Handling
- [Understanding Error vs Exception](KB_Vlpp_Exception_UnderstandingErrorVsException.md)
- [Using CHECK_ERROR Macro](KB_Vlpp_Exception_UsingCHECK_ERROR.md)
- [Using CHECK_FAIL Macro](KB_Vlpp_Exception_UsingCHECK_FAIL.md)

#### Object Model
- [Defining Struct for Value Types](KB_Vlpp_Object_DefiningStructForValueTypes.md)
- [Defining Class for Reference Types](KB_Vlpp_Object_DefiningClassForReferenceTypes.md)
- [Working with Object Base Class](KB_Vlpp_Object_WorkingWithObjectBaseClass.md)
- [Working with Interface Base Class](KB_Vlpp_Object_WorkingWithInterfaceBaseClass.md)

#### Console Operations
- * [Using Console Write and WriteLine](KB_Vlpp_Console_UsingConsoleWriteAndWriteLine.md)

### VlppOS

VlppOS provides cross-platform OS abstraction for file system operations, streams, locale support, and multi-threading. Use this when you need to interact with the operating system in a portable way. It offers locale-aware string manipulation, file system access, various stream types with encoding/decoding capabilities, and comprehensive multi-threading support with synchronization primitives.

#### File System Path Operations
- * [Using FilePath for Path Manipulation](KB_VlppOS_FileSystem_UsingFilePath.md)
- * [Working with File Class](KB_VlppOS_FileSystem_WorkingWithFile.md)
- * [Working with Folder Class](KB_VlppOS_FileSystem_WorkingWithFolder.md)

#### File I/O Operations
- * [Reading Text Files with Encoding Detection](KB_VlppOS_FileSystem_ReadingTextFilesWithEncodingDetection.md)
- * [Reading Text Files with BOM](KB_VlppOS_FileSystem_ReadingTextFilesWithBOM.md)
- * [Writing Text Files](KB_VlppOS_FileSystem_WritingTextFiles.md)
- * [File Operations Delete and Rename](KB_VlppOS_FileSystem_FileOperationsDeleteAndRename.md)

#### Directory Operations
- * [Enumerating Folder Contents](KB_VlppOS_FileSystem_EnumeratingFolderContents.md)
- * [Creating and Managing Directories](KB_VlppOS_FileSystem_CreatingAndManagingDirectories.md)
- * [Working with Root Directories](KB_VlppOS_FileSystem_WorkingWithRootDirectories.md)

#### Stream Interface
- * [Understanding IStream Interface](KB_VlppOS_Stream_UnderstandingIStreamInterface.md)
- * [Working with Stream Availability and Capabilities](KB_VlppOS_Stream_WorkingWithStreamAvailabilityAndCapabilities.md)

#### File Streams
- * [Using FileStream for File I/O](KB_VlppOS_Stream_UsingFileStream.md)

#### Memory Streams
- * [Using MemoryStream for Buffer Operations](KB_VlppOS_Stream_UsingMemoryStream.md)
- * [Using MemoryWrapperStream for External Buffers](KB_VlppOS_Stream_UsingMemoryWrapperStream.md)

#### Encoding Streams
- * [Using EncoderStream for Data Transformation](KB_VlppOS_Stream_UsingEncoderStream.md)
- * [Using DecoderStream for Data Transformation](KB_VlppOS_Stream_UsingDecoderStream.md)

#### UTF Encoding Support
- * [Using BomEncoder and BomDecoder](KB_VlppOS_Stream_UsingBomEncoderAndBomDecoder.md)
- * [Using UtfGeneralEncoder and UtfGeneralDecoder](KB_VlppOS_Stream_UsingUtfGeneralEncoderAndDecoder.md)
- * [Using UTF-8 Encoder and Decoder](KB_VlppOS_Stream_UsingUTF8EncoderAndDecoder.md)
- * [Using UTF-16 Encoder and Decoder](KB_VlppOS_Stream_UsingUTF16EncoderAndDecoder.md)
- * [Using UTF-32 Encoder and Decoder](KB_VlppOS_Stream_UsingUTF32EncoderAndDecoder.md)
- * [Using MbcsEncoder and MbcsDecoder](KB_VlppOS_Stream_UsingMbcsEncoderAndDecoder.md)
- * [Using TestEncoding for Encoding Detection](KB_VlppOS_Stream_UsingTestEncodingForDetection.md)

#### Base64 Encoding
- * [Using Utf8Base64Encoder and Utf8Base64Decoder](KB_VlppOS_Stream_UsingUtf8Base64EncoderAndDecoder.md)

#### LZW Compression
- * [Using LzwEncoder and LzwDecoder](KB_VlppOS_Stream_UsingLzwEncoderAndDecoder.md)
- * [Using Stream Helper Functions](KB_VlppOS_Stream_UsingStreamHelperFunctions.md)

#### Utility Streams
- * [Using CacheStream for Performance](KB_VlppOS_Stream_UsingCacheStream.md)
- * [Using RecorderStream for Data Copying](KB_VlppOS_Stream_UsingRecorderStream.md)
- * [Using BroadcastStream for Multiple Targets](KB_VlppOS_Stream_UsingBroadcastStream.md)

#### Locale Support
- * [Working with Locale Class](KB_VlppOS_Locale_WorkingWithLocaleClass.md)
- * [Using Locale Static Methods](KB_VlppOS_Locale_UsingLocaleStaticMethods.md)
- * [Formatting DateTime with Locale](KB_VlppOS_Locale_FormattingDateTimeWithLocale.md)
- * [Formatting Numbers and Currency](KB_VlppOS_Locale_FormattingNumbersAndCurrency.md)
- * [Getting Locale Names and Formats](KB_VlppOS_Locale_GettingLocaleNamesAndFormats.md)

#### Locale String Operations
- * [Using Locale String Comparison](KB_VlppOS_Locale_UsingLocaleStringComparison.md)
- * [Using Locale String Search](KB_VlppOS_Locale_UsingLocaleStringSearch.md)
- * [Using Locale String Testing](KB_VlppOS_Locale_UsingLocaleStringTesting.md)

#### Thread Pool
- * [Using ThreadPoolLite Queue Methods](KB_VlppOS_Threading_UsingThreadPoolLiteQueue.md)

#### Thread Operations
- * [Using Thread Static Methods](KB_VlppOS_Threading_UsingThreadStaticMethods.md)
- * [Using Thread CreateAndStart](KB_VlppOS_Threading_UsingThreadCreateAndStart.md)

#### Basic Synchronization
- * [Using SpinLock for Fast Operations](KB_VlppOS_Threading_UsingSpinLock.md)
- * [Using CriticalSection for Slow Operations](KB_VlppOS_Threading_UsingCriticalSection.md)

#### Advanced Synchronization
- * [Using ReaderWriterLock](KB_VlppOS_Threading_UsingReaderWriterLock.md)
- * [Using ConditionVariable](KB_VlppOS_Threading_UsingConditionVariable.md)

#### Waitable Objects
- * [Understanding WaitableObject Interface](KB_VlppOS_Threading_UnderstandingWaitableObject.md)
- * [Using Mutex for Process Synchronization](KB_VlppOS_Threading_UsingMutex.md)
- * [Using Semaphore for Resource Counting](KB_VlppOS_Threading_UsingSemaphore.md)
- * [Using EventObject for Signaling](KB_VlppOS_Threading_UsingEventObject.md)
- * [Using WaitAll and WaitAny Methods](KB_VlppOS_Threading_UsingWaitAllAndWaitAny.md)

### VlppRegex

VlppRegex provides regular expression functionality with .NET-like syntax but with important differences. Use this when you need pattern matching and text processing capabilities. Key differences include using both `/` and `\` for escaping, `.` accepting literal '.' character while `/.` accepts all characters, and performance considerations for DFA incompatible features.

#### Regex Syntax
- * [Understanding Regex Syntax Differences](KB_VlppRegex_Syntax_UnderstandingRegexSyntaxDifferences.md)
- * [Using Escaping Characters](KB_VlppRegex_Syntax_UsingEscapingCharacters.md)
- * [Understanding DFA Compatibility](KB_VlppRegex_Syntax_UnderstandingDFACompatibility.md)

#### Regex Execution
- * [Using MatchHead for Prefix Matching](KB_VlppRegex_Execution_UsingMatchHead.md)
- * [Using Match for Substring Matching](KB_VlppRegex_Execution_UsingMatch.md)
- * [Using TestHead for Prefix Testing](KB_VlppRegex_Execution_UsingTestHead.md)
- * [Using Test for Substring Testing](KB_VlppRegex_Execution_UsingTest.md)
- * [Using Search for Multiple Matches](KB_VlppRegex_Execution_UsingSearch.md)
- * [Using Split for Text Splitting](KB_VlppRegex_Execution_UsingSplit.md)
- * [Using Cut for Combined Operations](KB_VlppRegex_Execution_UsingCut.md)

#### Multi-Encoding Support
- * [Working with Different UTF Encodings](KB_VlppRegex_Encoding_WorkingWithDifferentUTFEncodings.md)

#### Regex Aliases
- * [Understanding Regex Type Aliases](KB_VlppRegex_Types_UnderstandingRegexTypeAliases.md)

### VlppReflection

VlppReflection provides runtime reflection capabilities for C++ classes and functions. Use this when you need to work with type metadata, register classes for scripting, or implement dynamic behavior. It supports three compilation levels: full reflection, metadata-only, and no reflection. Registration must happen in dedicated files and follows specific patterns for enums, structs, classes, and interfaces.

#### Reflection Levels
- * [Understanding Three Reflection Compilation Levels](KB_VlppReflection_Levels_UnderstandingThreeReflectionLevels.md)
- * [Working with VCZH_DEBUG_NO_REFLECTION](KB_VlppReflection_Levels_WorkingWithVCZH_DEBUG_NO_REFLECTION.md)
- * [Working with VCZH_DESCRIPTABLEOBJECT_WITH_METADATA](KB_VlppReflection_Levels_WorkingWithVCZH_DESCRIPTABLEOBJECT_WITH_METADATA.md)

#### Type Descriptors
- * [Using GetTypeDescriptor Function](KB_VlppReflection_Types_UsingGetTypeDescriptor.md)
- * [Working with Description Base Class](KB_VlppReflection_Types_WorkingWithDescriptionBaseClass.md)
- * [Working with AggregatableDescription](KB_VlppReflection_Types_WorkingWithAggregatableDescription.md)
- * [Working with IDescriptable Interface](KB_VlppReflection_Types_WorkingWithIDescriptableInterface.md)

#### Value Boxing
- * [Using Value Class for Boxing](KB_VlppReflection_Boxing_UsingValueClassForBoxing.md)

#### Registration Structure
- * [Organizing Registration in Header Files](KB_VlppReflection_Registration_OrganizingRegistrationInHeaderFiles.md)
- * [Organizing Registration in CPP Files](KB_VlppReflection_Registration_OrganizingRegistrationInCPPFiles.md)
- * [Using Type Registration Macros](KB_VlppReflection_Registration_UsingTypeRegistrationMacros.md)

#### Enum Registration
- * [Registering Regular Enums](KB_VlppReflection_Registration_RegisteringRegularEnums.md)
- * [Registering Mergable Flag Enums](KB_VlppReflection_Registration_RegisteringMergableFlagEnums.md)
- * [Registering Enum Class Items](KB_VlppReflection_Registration_RegisteringEnumClassItems.md)
- * [Registering Nested Enum Items](KB_VlppReflection_Registration_RegisteringNestedEnumItems.md)

#### Struct Registration
- * [Registering Struct Members](KB_VlppReflection_Registration_RegisteringStructMembers.md)

#### Class and Interface Registration
- * [Registering Class Members](KB_VlppReflection_Registration_RegisteringClassMembers.md)
- * [Registering Interface Members](KB_VlppReflection_Registration_RegisteringInterfaceMembers.md)
- * [Registering Interface Members without Proxy](KB_VlppReflection_Registration_RegisteringInterfaceMembersWithoutProxy.md)

#### Member Registration
- * [Registering Base Classes](KB_VlppReflection_Registration_RegisteringBaseClasses.md)
- * [Registering Fields](KB_VlppReflection_Registration_RegisteringFields.md)
- * [Registering Constructors](KB_VlppReflection_Registration_RegisteringConstructors.md)
- * [Registering External Constructors](KB_VlppReflection_Registration_RegisteringExternalConstructors.md)
- * [Registering Methods](KB_VlppReflection_Registration_RegisteringMethods.md)
- * [Registering Overloaded Methods](KB_VlppReflection_Registration_RegisteringOverloadedMethods.md)
- * [Registering External Methods](KB_VlppReflection_Registration_RegisteringExternalMethods.md)
- * [Registering Static Methods](KB_VlppReflection_Registration_RegisteringStaticMethods.md)
- * [Registering Events](KB_VlppReflection_Registration_RegisteringEvents.md)
- * [Registering Properties](KB_VlppReflection_Registration_RegisteringProperties.md)
- * [Registering Properties with Events](KB_VlppReflection_Registration_RegisteringPropertiesWithEvents.md)

#### Interface Proxy
- * [Creating Interface Proxy for Inheritance](KB_VlppReflection_Proxy_CreatingInterfaceProxyForInheritance.md)
- * [Using Interface Proxy Macros](KB_VlppReflection_Proxy_UsingInterfaceProxyMacros.md)
- * [Working with Proxy Invoke Methods](KB_VlppReflection_Proxy_WorkingWithProxyInvokeMethods.md)

### VlppParser2

VlppParser2 implements GLR parsers based on customized and enhanced EBNF syntax. Use this when you need to parse complex grammars or implement domain-specific languages. The documentation for VlppParser2 is not ready yet according to the copilot instructions.

#### Parser Fundamentals
- * [Understanding GLR Parser Concepts](KB_VlppParser2_Fundamentals_UnderstandingGLRParserConcepts.md)

#### EBNF Syntax
- * [Working with Enhanced EBNF Syntax](KB_VlppParser2_EBNF_WorkingWithEnhancedEBNFSyntax.md)

### Workflow

Workflow is a script language based on C++ reflection that can execute scripts at runtime or generate equivalent C++ code. Use this when you need scripting capabilities, code generation, or when working with GacUI XML files. It provides a C#-like syntax and can compile to both runtime execution and C++ source code generation.

#### Script Language Features
- * [Understanding Workflow Script Syntax](KB_Workflow_Script_UnderstandingWorkflowScriptSyntax.md)

#### Runtime and Compilation
- * [Executing Workflow Scripts at Runtime](KB_Workflow_Runtime_ExecutingWorkflowScriptsAtRuntime.md)
- * [Generating C++ Code from Workflow](KB_Workflow_CodeGen_GeneratingCppCodeFromWorkflow.md)

### GacUI

GacUI is a cross-platform GUI library that comes with an XML-based UI definition system and a compiler. Use this when you need to create desktop applications with rich user interfaces. It provides a comprehensive testing framework, XML-to-C++ compilation, and integrates with the Workflow script language for event handling and data binding.

#### XML Resource Structure
- * [Understanding GacUI XML Resource Structure](KB_GacUI_XML_UnderstandingGacUIXMLResourceStructure.md)
- * [Working with Instance and Class Definitions](KB_GacUI_XML_WorkingWithInstanceAndClassDefinitions.md)
- * [Adding Workflow Scripts to Resources](KB_GacUI_XML_AddingWorkflowScriptsToResources.md)

#### XML Tag Mapping
- * [Understanding XML Tag to C++ Class Mapping](KB_GacUI_XML_UnderstandingXMLTagToCppClassMapping.md)
- * [Using Metadata Reflection File](KB_GacUI_XML_UsingMetadataReflectionFile.md)

#### UI Layout Compositions
- * [Understanding AlignmentToParent](KB_GacUI_Layout_UnderstandingAlignmentToParent.md)
- * [Working with BoundsComposition](KB_GacUI_Layout_WorkingWithBoundsComposition.md)
- * [Using Bounds Composition](KB_GacUI_Layout_UsingBoundsComposition.md)

#### Table Layout
- * [Using Table Composition for Grid Layout](KB_GacUI_Layout_UsingTableCompositionForGridLayout.md)
- * [Understanding Table Sizing Modes](KB_GacUI_Layout_UnderstandingTableSizingModes.md)
- * [Working with Table Cell Positioning](KB_GacUI_Layout_WorkingWithTableCellPositioning.md)

#### Other Layout Compositions
- * [Using Stack and StackItem Compositions](KB_GacUI_Layout_UsingStackAndStackItemCompositions.md)
- * [Using Flow and FlowItem Compositions](KB_GacUI_Layout_UsingFlowAndFlowItemCompositions.md)
- * [Using Other Layout Compositions](KB_GacUI_Layout_UsingOtherLayoutCompositions.md)

#### Properties and Bindings
- * [Setting Properties in XML](KB_GacUI_Properties_SettingPropertiesInXML.md)
- * [Using Property Bindings](KB_GacUI_Properties_UsingPropertyBindings.md)
- * [Working with Nested Property Access](KB_GacUI_Properties_WorkingWithNestedPropertyAccess.md)

#### Event Handling
- * [Subscribing to Events in XML](KB_GacUI_Events_SubscribingToEventsInXML.md)
- * [Writing Workflow Script in Events](KB_GacUI_Events_WritingWorkflowScriptInEvents.md)

#### Unit Testing Framework
- * [Understanding GacUI Unit Test Structure](KB_GacUI_Testing_UnderstandingGacUIUnitTestStructure.md)
- * [Writing Test Files with TEST_FILE Macro](KB_GacUI_Testing_WritingTestFilesWithTEST_FILE.md)
- * [Using TEST_CATEGORY and TEST_CASE Macros](KB_GacUI_Testing_UsingTEST_CATEGORYAndTEST_CASE.md)
- * [Setting Up GUI Main Proxy](KB_GacUI_Testing_SettingUpGUIMainProxy.md)
- * [Working with Test Frames](KB_GacUI_Testing_WorkingWithTestFrames.md)
- * [Managing Shared Variables in Tests](KB_GacUI_Testing_ManagingSharedVariablesInTests.md)

#### Test Object Access
- * [Accessing Main Window in Tests](KB_GacUI_Testing_AccessingMainWindowInTests.md)
- * [Finding Objects by Name](KB_GacUI_Testing_FindingObjectsByName.md)
- * [Finding Controls by Text](KB_GacUI_Testing_FindingControlsByText.md)

#### Test IO Operations
- * [Performing Mouse Operations in Tests](KB_GacUI_Testing_PerformingMouseOperationsInTests.md)
- * [Performing Keyboard Operations in Tests](KB_GacUI_Testing_PerformingKeyboardOperationsInTests.md)
- * [Working with Control Locations](KB_GacUI_Testing_WorkingWithControlLocations.md)

## Experiences and Learnings
