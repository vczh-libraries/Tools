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

Install Emscripten and Node.js 22.17 or newer, then run the repository-local wrapper from a project's `Test/Linux` folder. For Vlpp:

```bash
cd Vlpp/Test/Linux
../../.github/Ubuntu/build.sh -bw
# Full Wasm build:
../../.github/Ubuntu/build.sh -fbw
./Bin/app.sh ./vbuild
# To use a different port instead:
./Bin/app.sh ./vbuild 1234
```

Open [the local test page](http://127.0.0.1:8888/) for the default port, or `http://127.0.0.1:1234/` for the example override. The launcher serves the generated test files from its own folder using Node.js, even when invoked from another working directory. It binds to `127.0.0.1`, disables caching, and sends the COOP/COEP headers required for shared Wasm memory. Keep the terminal running and stop the server with Ctrl-C when finished. Serve over HTTP with JavaScript-module and Wasm MIME types; `file://` is unsupported.

The output folder contains `app.html`, `app.mjs`, `app.wasm`, `app.debug.wasm`, executable `app.sh`, Node server `app.js`, an `index.html` symlink to `app.html`, and the configured `CPP_TARGET` (Vlpp uses `Bin/UnitTest`). The symlink makes `app.html` the default page at `/`. The target is a byte-identical copy of `app.wasm`, used by make. DWARF information is stored in `app.debug.wasm`; the Wasm file records that relative filename so LLDB and browser DWARF tools can discover it. The page loads `app.mjs`, which loads `app.wasm`. It initializes a fresh dedicated worker and awaits the sole application export, `wasm_main`, once. Console writes preserve text order, whitespace and color. Successful completion ends with one black italic `wasm_main returns 0.` line; caught C++ failures return nonzero, while module failures and runtime traps have no return value. The runner installs `globalThis.vlConsoleRead = () => undefined` in the worker, providing EOF for input. `Console::TryRead()` maps `undefined` to an empty nullable and a JavaScript string to a present `WString`, including an empty string. Custom hosts can supply a synchronous read callback; UTF-16 conversion preserves Unicode and embedded zero code units, and callback failures are reported as C++ errors.

The page retains its worker through a `pagehide` listener and terminates it when the page leaves. This prevents Firefox from collecting the worker while asynchronous fixture loading or module initialization is pending.

`--build-wasm` and `--full-build-wasm` are the long forms. All four Wasm modes require a file named `vbuild` in the current project folder containing the quoted key `"WASM=YES"`. The file is JSON, never executed. The launcher receives its path as the first argument; relative paths in that configuration resolve from its containing folder. Projects without this opt-in are rejected before building or cleaning. With the installed Tools environment, run `vmake --make` followed by the corresponding `vbuild` command. `vgo uci Vlpp` copies the canonical wrapper, helper, HTML and launcher template into Vlpp's `.github/Ubuntu` folder.

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

Use `-f` (also `-fb`) for a full Clang build or `--full-build-gcc` for a full GCC build. Native builds use `-O0` by default. Add `-o` or `--optimize` to select `-O2`, for example `build.sh -f -o` or `vbuild -b --optimize`. The option can precede or follow the build command; alone it selects an incremental native Clang build. It is rejected for Wasm builds, which currently use `-O0`. Both modes retain `-g`; optimization does not define `NDEBUG` or disable C++ assertions. `vbuild -r` / `--read` still opens the coverage report.

Every native build produces `$(CPP_TARGET).debug`. On Linux this is a separate ELF debug file and the executable contains a `.gnu_debuglink` reference. Keep the pair together for automatic LLDB discovery. On macOS it is a dSYM bundle with a `$(CPP_TARGET).dSYM` symlink for LLDB. Use `image list -s` in LLDB to inspect the loaded symbol file, or `target symbols add PATH` to load it explicitly. The native Linux tools require `llvm-objcopy`; macOS uses `dsymutil` and `strip`.

Switching compiler or effective options invalidates incompatible objects, dependencies and the target before make evaluates them. An unchanged build does not compile or link. Missing native debug files or Wasm package members, changed HTML or launcher templates, or changed shared link recipes are repaired on the next build; link/copy failures return nonzero and can be retried. A failed link or debug extraction removes the incomplete make target. The Wasm make target is published only after the HTML, executable launcher and default-page symlink are ready.

Wasm compilation and linking use `-fexceptions`; linking also uses `--bind -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=worker -sASYNCIFY=1 -sASYNCIFY_STACK_SIZE=65536 --no-entry`. Native Linux uring and macOS framework flags are excluded. A project using VlppOS threads sets `CPP_WASM_PTHREAD_POOL_SIZE=32` in `vmake`; only Wasm then adds `-pthread`, preloads that many workers, and generates `app.worker.js`. The finite pool reports exhaustion instead of silently deadlocking. Shared memory starts at 128 MiB and may grow. Missing worker output is repaired by the next build. Projects that omit this option retain single-threaded Wasm builds. Keep the SDK's 32-bit `wchar_t` and convert `WString` to UTF-16 only at JavaScript boundaries. See [Emscripten compiler options](https://emscripten.org/docs/tools_reference/emcc.html), [modularized output](https://emscripten.org/docs/compiling/Modularized-Output.html), and [C++ exceptions](https://emscripten.org/docs/porting/exceptions.html).

The initial runner verification used Linux, Emscripten 3.1.6 and Firefox 146.0.1, covering compiler switches, incremental dependencies, output repair, failure/retry, Unicode/color rendering, worker responsiveness and terminal failure reporting. The OPFS update passes 473 Vlpp, 105 VlppOS, 226 VlppRegex and 53 VlppReflection Wasm cases. Native Clang passes 467, 279, 226 and 53 cases respectively; Vlpp also passes all 467 cases with GCC. Windows and macOS were not executed in this verification.


### OPFS filesystem and fixture configuration

VlppOS supplies `OpfsFileSystemImpl` in `Source/FileSystem.Wasm.cpp` by default through the ordinary filesystem injection chain. It calls browser OPFS APIs from small `EM_ASYNC_JS` adapters; Asyncify preserves the synchronous C++ contract. Applications must link with `-sASYNCIFY=1` and await suspending Embind exports. No Emscripten C++ filesystem backend or app-specific filesystem callback is required. The browser must support OPFS in a secure context (localhost HTTP qualifies).

OPFS calls from pthread workers resume through a managed Emscripten callback before returning. This keeps workers joinable on Emscripten 3.1.6; verification includes repeated pairs of concurrent filesystem workers and the existing threading suite.

The current directory is always `/`, the origin's private root. ReadOnly and ReadWrite streams load the complete existing file into `stream::MemoryStream`; ReadWrite creates a missing file and preserves existing bytes. WriteOnly starts empty. Closing a writable stream replaces the whole OPFS file, including truncation to an empty file. Close is idempotent. Filesystem failures use the existing boolean/unavailable-stream contract; a failed writable close reports a C++ error. File and folder rename copy then remove the source because directory move is not portable; this is not atomic, and existing destinations, root moves and moves into descendants are rejected. Native filesystem behavior is unchanged.

The canonical runner files live in `Ubuntu/vl/wasm-unittest/` with their final names. `wasm.sh` copies these files unchanged; `vgo uci REPO` distributes them and removes the old flat templates.

A project-local `vbuild` can be as small as `{"WASM=YES": {}}`. For fixture-dependent tests:

```json
{
  "WASM=YES": {
    "rootFolder": "../",
    "folders": ["Output", "Empty/Nested"],
    "includes": ["Resources/**/*.txt"],
    "excludes": ["Resources/**/Excluded/*.txt"]
  }
}
```

Every field inside `WASM=YES` is optional. Without `rootFolder`, the other three fields are ignored. Without `includes`, no files are loaded. `rootFolder` maps to `/` in OPFS. Patterns use Node's built-in filesystem glob syntax; includes are combined without duplicates and excludes are subtracted. Folder names are literal relative paths, not patterns. Paths must remain under the configured root; symlinks escaping it are rejected.

`GET /OPFS` returns `{ "files": [...], "folders": [...] }` with sorted paths, listing only explicitly requested empty leaf directories; parents are inferred. `GET /OPFS/path/to/file` serves binary content only for a selected file. The server accepts GET only and never writes browser changes to disk. Before loading the Wasm module, `app.html` deletes all existing OPFS entries for its origin, creates directories, and downloads the selected files. A prefill failure prevents test execution. Reloading starts fresh; use a dedicated origin for the test runner.

Minimal library mappings: Vlpp uses `{}`; VlppOS uses `rootFolder: "../../"` and creates `/Output` in tests; VlppRegex maps `../`, creates `Output`, and includes exactly `Resources/Baseline/*.txt` (34 input files); VlppReflection maps `../../` and creates only `Metadata`, with no input files.
