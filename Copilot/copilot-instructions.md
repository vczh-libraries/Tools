# General Instruction

- `REPO-ROOT` refers to the root directory of the repository.
- `SOLUTION-ROOT` refers to the root directory of a solution (`*.sln` or `*.slnx`), this repo has a solution for development and testing purpose, and a few others for tools release.
  - Detailed information could be found in `REPO-ROOT/.github/project.md`.
- Following `Leveraging the Knowledge Base`, find knowledges and documents for this project in `REPO-ROOT/.github/KnowledgeBase/Index.md`.
- Before writing to a source file, read it to ensure you respect my parallel editing.
- If any `*.prompt.md` file is referenced, take immediate action following the instructions in that file.

## External Tools Environment and Context

- You are on Windows running in Visual Studio Code.
- Always prefer offered script files instead of direct CLI commands.
- DO NOT call `msbuild` or other executable files directly.
- DO NOT create or delete any file unless explicitly directed.
- MUST run any powershell script in this format: `& absolute-path.ps1 parameters...`.

## Coding Guidelines and Tools

The C++ project in this repo is built and tested using itw own system.
You must strictly follow the instructions in the following documents,
otherwise it won't work properly.

- Adding/Removing/Renaming Source Files: `REPO-ROOT/.github/Guidelines/SourceFileManagement.md`
- Building a Solution: `REPO-ROOT/.github/Guidelines/Building.md`
- Running a Project:
  - Unit Test: `REPO-ROOT/.github/Guidelines/Running-UnitTest.md`
  - CLI Application: `REPO-ROOT/.github/Guidelines/Running-CLI.md`
  - GacUI Application: `REPO-ROOT/.github/Guidelines/Running-GacUI.md`
- Debugging a Project: `REPO-ROOT/.github/Guidelines/Debugging.md`
- Using Unit Test Framework: `REPO-ROOT/.github/KnowledgeBase/manual/unittest/vlpp.md`
- Using Unit Test Framework for GacUI Applicatiln:
  - Running GacUI in Unit Test Framework: `REPO-ROOT/.github/KnowledgeBase/manual/unittest/gacui.md`
  - Snapshots and Frames: `REPO-ROOT/.github/KnowledgeBase/manual/unittest/gacui_frame.md`
  - IO Interaction: `REPO-ROOT/.github/KnowledgeBase/manual/unittest/gacui_io.md`
  - Accessing: `REPO-ROOT/.github/KnowledgeBase/manual/unittest/gacui_controls.md`
  - Snapshot Viewer: `REPO-ROOT/.github/KnowledgeBase/manual/unittest/gacui_snapshots.md`
- Syntax of GacUI XML Resources:
  - Brief Introduction: `REPO-ROOT/.github/Guidelines/GacUIXmlResource.md`
  - Detailed document can be found in `REPO-ROOT/.github/KnowledgeBase/Index.md` under `# Copy of Online Manual` / `## GacUI`

## Accessing Task Documents

If you need to find any document for the current working task, they are in the `REPO-ROOT/.github/TaskLogs` folder:
- `Copilot_Scrum.md`
- `Copilot_Task.md`
- `Copilot_Planning.md`
- `Copilot_Execution.md`
- `Copilot_KB.md`

### Important Rules for Writing Markdown File

- Do not print "````````" or "````````markdown" in markdown file.
- It is totally fine to have multiple top level `# Topic`.
- When mentioning a C++ name in markdown file:
  - If it is defined in the standard C++ library or third-party library, use the full name.
  - If it is defined in the source code, use the full name if there is ambiguity, and then mention the file containing its definition.

## Accessing Script Files

If you need to find any script or log files, they are in the `REPO-ROOT/.github/Scripts` folder:
- `copilotPrepare.ps1`
- `copilotBuild.ps1`
- `copilotExecute.ps1`
- `copilotDebug_Start.ps1`
- `copilotDebug_Stop.ps1`
- `copilotDebug_RunCommand.ps1`
- `Build.log`
- `Execute.log`

## Important Rules for Markdown Document or Log

- Do not print "````````" or "````````markdown" in markdown file.
- It is totally fine to have multiple top level `# Topic`.
- When mentioning a C++ name in markdown file:
  - If it is defined in the standard C++ library or third-party library, use the full name.
  - If it is defined in the source code, use the full name if there is ambiguity, and then mention the file containing its definition.

## Writing C++ Code

- This project uses C++ 20, you are recommended to use new C++ 20 feature aggresively.
- All code should be crossed-platform. In case when OS feature is needed, a Windows version and a Linux version should be prepared in different files, following the `*.Windows.cpp` and `*.Linux.cpp` naming convention, and keep them as small as possible.
- DO NOT MODIFY any source code in the `Import` folder, they are dependencies.
- DO NOT MODIFY any source code in the `Release` folder, they are generated release files.
- You can modify source code in the `Source` and `Test` folder.
- Use tabs for indentation in C++ source code. For JSON or XML embedded in C++ source code, use double spaces.
- Header files are guarded with macros instead of `#pragma once`.
- Use `auto` to define variables if it is doable. Use `auto&&` when the type is big or when it is a collection type.
- In header files, do not use `using namespace` statement, full name of types are always required. In a class/struct/union declaration, member names must be aligned in the same column at least in the same public, protected or private session. Please follow this coding style just like other part of the code.
  - If the header file is in a unit test project, the only rule is to keep it consistent with other unit test only header in the same project.
- In cpp files, use `using namespace` statement if necessary to prevent from repeating namespace everywhere.
- The project only uses a very minimal subset of the standard library. I have substitutions for most of the STL constructions. Always use mine if possible:
  - Always use `vint` instead of `int`.
  - Always use `L'x'`, `L"x"`, `wchar_t`, `const wchar_t` and `vl::WString`, instead of `std::string` or `std::wstring`.
  - Use my own collection types vl::collections::* instead of std::*
  - Checkout `REPO-ROOT/.github/KnowledgeBase/Index.md` for more information of how to choose correct C++ data types.

## Leveraging the Knowledge Base

- When making design or coding decisions, you must leverage the knowledge base to make the best choice.
- The main entry is ``REPO-ROOT/.github/KnowledgeBase/Index.md`, it is organized in this way:
  - `## Guidance`: A general guidance that play a super important part repo-wide.
  - Each `## Project`: A brief description of each project and its purpose.
    - `### Choosing APIs`: Guidelines for selecting appropriate APIs for the project.
    - `### Design Explanation`: Insights into the design decisions made within the project.
  - `## Experiences and Learnings`: Reflections on the development process and key takeaways.

### Project/Choosing APIs

There are multiple categories under `Choosing APIs`. Each category begins with a short and accurate title `#### Category`.
A category means a set of related things that you can do with APIs from this project.

Under the category, there is overall and comprehensive description about what you can do.

Under the description, there are bullet points and each item follow the format:  `- Use CLASS-NAME for blahblahblah` (If a function does not belong to a class, you can generate `Use FUNCTION-NAME ...`).
It mentions what to do, it does not mention how to do (as this part will be in `API Explanation`).
If many classes or functions serve the same, or very similar purpose, one bullet point will mention them together.

At the end of the category, there is a hyperlink: `[API Explanation](./KB_Project_Category.md)` (no space between file name, all pascal case).

### Project/Design Explanation

There are multiple topics under `Design Explanation`. Each topic begins with a short and accurate title `#### Topic`.
A topic means a feature of this project, it will be multiple components combined.

Under the topic, there is overall and comprehensive description about what does this feature do.

Under the description, there are bullet points to provide a little more detail, but do not make it too long. Full details are supposed to be in the document from the hyperlink.

At the end of the topic, there is a hyperlink: `[Design Explanation](./KB_Project_Design_Topic.md)` (no space between file name, all pascal case).

### Experiences and Learnings

(to edit ...)
