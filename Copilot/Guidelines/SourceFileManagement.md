# Solution and Project File Structure

- A solution file (`*.sln` or `*.slnx`) contains multiple project files.
- Typical C++ project files is an XML file in `*.vcxproj` or `*.vcxitems` naming.
- The XML file `*.vcxproj.filter` organize source files in solution explorer folders (virtual folders) that could be different from physical file system, which create a human friendly view.
- The XML file `*.vcxproj.user` contains some temporary local configuration for a project. This file is not tracked by git, but it contains arguments for running the project.
- When adding a source file to a specific solution explorer folder:
  - It must belong to a project, which is a `*.vcxproj` or `*.vcxitems` file.
  - Find the `*.vcxproj.filters` file with the same name, it is an XML file.
  - Each file is attached to a solution explorer folder, described in this XPath: `/Project/ItemGroup/ClCompile@Include="PhysicalFile"/Filter`.
  - In side the `Filter` tag there is the solution explorer folder.
  - Edit that `*.vcxproj.filters` file to include the source file.
