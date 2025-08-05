# About this repo

Online documentation: https://gaclib.net/doc/current/gacui/home.html

This repo contains C++ source code of the `GacUI` project.
The goal of this project is to build a cross-platform GUI library.
It also comes with a compiler to transform GacUI XML files into equivalent `Workflow` script files and further more equivalent C++ source files.

Unfortunately it is not widely accepted like WPF or react native. It could be difficult for you to find detailed information. If you are not sure about something:

- Read the source code in `Source`.
- Read all test files in `Test\GacUISrc\UnitTest`.

## Dependencies

This project is built on top of:

- `Vlpp`: `Import\Vlpp.h`
- `VlppOS`: `Import\VlppOS.h`
- `VlppRegex`: `Import\VlppRegex.h`
- `VlppReflection`: `Import\VlppReflection.h`
- `VlppParser2`: `Import\VlppParser2.h`
- `Workflow`: `Import\Workflow.h`
