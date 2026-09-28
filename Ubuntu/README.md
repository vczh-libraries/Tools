# Ubuntu Development Environment

Set-VMVideo -VMName `Virtual Machine Name` -HorizontalResolution:1920 -VerticalResolution:1080 -ResolutionType Single

## Create

Assuming you want to create a desktop launcher icon at the desktop,
and clone all repos in `~/Desktop/vczh-libraries`,
open a command line and run:

```PlainText
mkdir vczh-libraries
pushd vczh-libraries
git clone git@github.com:vczh-libraries/Tools.git
popd
source ./vczh-libraries/Tools/Ubuntu/vl/init.sh
```

If ssh has not been properly setup with github,
you could also use `git clone https://github.com/vczh-libraries/Tools.git` instead.

You will be asked two questions:
- Enter the launcher display name (VL++ DevEnv):
  - Choose the display name of the desktop launcher.
- Enter the launcher file name without extension (vl):
  - Choose the file name of the desktop launcher.

Answers nothing means you are satisfied with the default answer.

Assuming all default answers are chosen,
`~/Desktop/vl.desktop` and `~/Desktop/vczh-libraries/load.sh` will be created.

Right click `vl.desktop` and select `Allow Launching`,
now the icon of the file is changed,
and the name changed from `vl.desktop` to `VL++ DevEnv`.

## Prepare

- Double click the desktop launcher.
- Use `vapt` to install necessary softwares.
- Use `vssh` to setup a connection to github.
- Use `vsync --fix` to clone all missing repos.
- Use `vgo u` to sync all remote branches.
- Use `vgo vmake` and `vgo vbuild` to run CI.

## Start to work

- Double click the desktop launcher. Type `vhelp` to see all available commands.
- Use `vsync --master` to switch all branches to `master`.
- Use `vsync --1.0` to switch all branches to `release-1.0`.


## WebAssembly Unit Tests

Install Emscripten, then run the repository-local wrapper from a project's `Test/Linux` folder. For Vlpp:

```bash
cd Vlpp/Test/Linux
../../.github/Ubuntu/build.sh -bw
# Full Wasm build:
../../.github/Ubuntu/build.sh -fbw
python3 -m http.server 4173 --bind 127.0.0.1 --directory Bin
```

Open [the local test page](http://127.0.0.1:4173/app.html). Serve over HTTP with JavaScript-module and Wasm MIME types; `file://` is unsupported. Stop the server with Ctrl-C when finished.

The output folder contains `app.html`, `app.mjs`, `app.wasm`, and the configured `CPP_TARGET` (Vlpp uses `Bin/UnitTest`). The target is a byte-identical copy of `app.wasm`, used by make. The page loads `app.mjs`, which loads `app.wasm`. It initializes a fresh dedicated worker and calls the sole application export, `wasm_main`, once. Console writes preserve text order, whitespace and color. Successful completion ends with one black italic `wasm_main returns 0.` line; caught C++ failures return nonzero, while module failures and runtime traps have no return value. The runner provides EOF for input.

`--build-wasm` and `--full-build-wasm` are the long forms. With the installed Tools environment, run `vmake --make` followed by the corresponding `vbuild` command. `vgo uci Vlpp` copies the canonical wrapper, helper and HTML into Vlpp's `.github/Ubuntu` folder.

Native commands from the same folder:

```bash
../../.github/Ubuntu/build.sh
Bin/UnitTest /C
../../.github/Ubuntu/build.sh --build-gcc
Bin/UnitTest /C
# Clang coverage:
../../.github/Ubuntu/build.sh --build-coverage
Bin/UnitTest /C
```

Use `-f` for a full Clang build or `--full-build-gcc` for a full GCC build. Switching compiler or effective options invalidates incompatible objects, dependencies and the target before make evaluates them. An unchanged build does not compile or link. Missing Wasm package members, changed HTML, or a changed packaging helper are repaired on the next build; link/copy failures return nonzero and can be retried.

Wasm compilation and linking use `-fexceptions`; linking also uses `--bind -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=worker --no-entry`. Native pthread, Linux uring and macOS framework flags are excluded. Keep the SDK's 32-bit `wchar_t` and convert `WString` to UTF-16 only at JavaScript boundaries. See [Emscripten compiler options](https://emscripten.org/docs/tools_reference/emcc.html), [modularized output](https://emscripten.org/docs/compiling/Modularized-Output.html), and [C++ exceptions](https://emscripten.org/docs/porting/exceptions.html).

Verified on Linux with Emscripten 3.1.6 and Firefox 146.0.1: Vlpp's 32 test files / 469 Wasm cases, 32 files / 465 native Clang and GCC cases, coverage, compiler switches, incremental dependencies, output repair, failure/retry, Unicode/color rendering, worker responsiveness, and terminal failure reporting. Windows and macOS were not executed in this verification.
