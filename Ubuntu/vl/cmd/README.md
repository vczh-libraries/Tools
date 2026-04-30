# vmake Maintenance Notes

This file documents the Linux `vmake` flow for future script maintenance.

## Important Files

- `cmd/vmake`: command entry point for `vmake --make`.
- `cmd/vt4`: tiny V4 template preprocessor/evaluator.
- `../vmake-cpp`: shared V4 template included by project-local `vmake` files.
- `../makefile-cpp`: shared make macros for compile/link commands.
- `cmd/vutil_CppFromVcxproj`: extracts `.cpp` files from `.vcxproj` and `.vcxitems`.
- `cmd/vutil_CppDependencies`: calls `clang++ -MM` to expand header dependencies.
- `cmd/vbuild`: wrapper around generated makefiles.

## vmake --make Pipeline

Run from a folder containing a project-local `vmake` file:

```bash
vmake --make
```

`cmd/vmake` runs this pipeline:

```bash
vt4 --preprocess ./vmake | vt4 --evaluate | ${SHELL} > makefile
```

The steps are:

1. `vt4 --preprocess ./vmake` expands V4 include lines such as:

   ```v4
   <#@ include "${VCPROOT}/vl/vmake-cpp" #>
   ```

2. `vt4 --evaluate` converts the expanded V4 text into a bash script.

   - Plain text becomes `echo` commands.
   - `<# ... #>` blocks become bash code.
   - `<#= ... #>` expressions become `echo -n ...`.

3. `${SHELL}` executes that generated bash script.

   - Standard output is redirected into `makefile`.
   - `../vmake-cpp` also writes `vmake.txt` as a side effect.

## Project vmake Structure

A project-local `vmake` is usually only a variable block plus the shared include:

```v4
<#
CPP_TARGET=./Bin/UnitTest
CPP_VCXPROJS=(
    "../UnitTest/UnitTest/UnitTest.vcxproj"
    "../UnitTest/Vlpp/Vlpp.vcxproj"
    )
CPP_REMOVES=(
    "../../Source/Console.Windows.cpp"
    )
CPP_ADDS=("../Main.cpp")
FOLDERS=("../Output")
TARGETS=("${CPP_TARGET}")
CPP_COMPILE_OPTIONS="-I ../../Import -DVCZH_DEBUG_NO_REFLECTION"
#>
<#@ include "${VCPROOT}/vl/vmake-cpp" #>
```

Useful variables:

- `CPP_TARGET`: output executable, normally `./Bin/UnitTest`.
- `CPP_VCXPROJ`: one `.vcxproj` or `.vcxitems` file to scan.
- `CPP_VCXPROJS`: array of `.vcxproj` or `.vcxitems` files to scan.
- `CPP_REMOVES`: exact `.cpp` paths to remove after scanning project files.
- `CPP_ADDS`: extra `.cpp` paths or globs to append after removals.
- `FOLDERS`: extra output folders created by `pre-build` and deleted by `clean`.
- `TARGETS`: make `all` dependencies, normally `("${CPP_TARGET}")`.
- `CPP_COMPILE_OPTIONS`: extra compiler flags for compile and dependency scan.
- `CPP_LINK_OPTIONS`: extra linker flags. Supported by `../vmake-cpp`; not currently used by existing samples.

There is no `IMPORTS` variable in the current samples. Imports are done by the V4 include directive.

Current sample usage under `${VROOT}/*/Test/Linux*/vmake`:

- 29 samples total.
- `CPP_TARGET`, `CPP_REMOVES`, and `TARGETS`: 29 samples.
- `CPP_COMPILE_OPTIONS`: 28 samples.
- `CPP_VCXPROJS`: 27 samples.
- `CPP_VCXPROJ`: 2 samples.
- `FOLDERS`: 17 samples.
- `CPP_ADDS`: 13 samples.

## File List Expansion

`../vmake-cpp` builds the final C++ file list before writing make rules:

1. If `CPP_VCXPROJ` is set, scan it with `vutil_CppFromVcxproj`.
2. For each item in `CPP_VCXPROJS`, scan it with `vutil_CppFromVcxproj`.
3. Remove duplicate `.cpp` paths while preserving the first occurrence.
4. Remove items listed in `CPP_REMOVES`.
5. Append items listed in `CPP_ADDS`; globs are expanded here.
6. Write the final `CPP_FILES` list to `vmake.txt`, one path per line.
7. Convert each `.cpp` basename to `./Obj/<basename>.o`.
8. Emit the generated `makefile` to standard output.

`vutil_CppFromVcxproj` extracts `<ClCompile Include="...cpp">`, converts Windows separators to `/`, resolves paths from the current folder, and prints paths relative to the current folder.

`vutil_CppDependencies` runs:

```bash
clang++ --std=c++20 ${CPP_COMPILE_OPTIONS} -MM <cpp-file>
```

This means `CPP_COMPILE_OPTIONS` must also be accepted by clang during dependency generation, even when `make USE_GCC=YES` is used for the actual build.

## vmake.txt

`vmake --make` creates `vmake.txt` beside `makefile`.

The file contains only the final expanded `CPP_FILES` list, one path per line. It has no header, count, blank line, object file list, or other metadata, so scripts can parse it directly.

If a future project-local `vmake` does not include `${VCPROOT}/vl/vmake-cpp`, this side file will not be created unless that template implements it.

## Generated makefile Structure

The generated `makefile` has this shape:

```make
.PHONY: all clean pre-build
.DEFAULT_GOAL := all

CPP_COMPILE_OPTIONS=...
CPP_LINK_OPTIONS=...
include $(VCPROOT)/vl/makefile-cpp

pre-build:
        mkdir ./Bin ./Obj ./Coverage and FOLDERS

clean:
        rm -r ./Bin ./Obj ./Coverage and FOLDERS

all:pre-build $(TARGETS)

$(CPP_TARGET): $(O_FILES)
        $(CPP_LINK)

./Obj/File.o: source.cpp headers...
        $(CPP_COMPILE)
```

`../makefile-cpp` chooses the toolchain:

- Default: clang++.
- `make USE_GCC=YES`: g++.
- `make COVERAGE=YES`: clang++ with coverage flags.

## Adding Compiler or Linker Arguments

Add compile flags in the project-local `vmake`:

```bash
CPP_COMPILE_OPTIONS="-I ../../../Import -DVCZH_DEBUG_METAONLY_REFLECTION"
```

These flags are used by:

- `CPP_COMPILE` in `../makefile-cpp`.
- `vutil_CppDependencies` during `vmake --make`.

Add link flags with:

```bash
CPP_LINK_OPTIONS="-L ./Lib -lSomeLibrary"
```

`CPP_LINK_OPTIONS` is emitted into the generated `makefile`. In the current `../makefile-cpp`, it is used by the GCC link command and coverage clang link command. The default non-coverage clang link command currently uses `CPP_COMPILE_OPTIONS` instead.

## Batch Commands

`vgo vmake [project]` searches each selected repo for files named `vmake`, runs `vmake --make` in each folder, and reports any output from those runs.

`vgo vbuild [project]` searches the same folders and runs `vbuild --clean` then `vbuild --build`.
