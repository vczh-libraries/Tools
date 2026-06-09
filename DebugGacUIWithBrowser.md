# MonoRepo Guide: Debugging and Changing RemotingTest_Core.exe from GacJS

This document guides you through building, running, debugging, and testing
`RemotingTest_Core.exe` using facilities available in the GacJS repository.

**Note:** This document is most useful when your working directory is the **parent
folder** of GacJS (the mono-repo root), so that both `GacJS/` and `GacUI/` are
accessible as siblings.

---

## Which GacUI to Use

Use the GacUI repository that sits next to GacJS in the workspace:

| Path | Role |
|------|------|
| `../GacUI/` | Sibling GacUI checkout used for C++ source, resources, builds, and debugging. |

Throughout this document, `<GacUI>` refers to `../GacUI` from the GacJS repo root.

---

## Essential References

Read these documents before starting any work:

| Document | Description |
|----------|-------------|
| [`<GacUI>/.github/copilot-instructions.md`](../GacUI/.github/copilot-instructions.md) | General instructions for working with the GacUI repository: environment setup, coding guidelines, and references to Building/Running/Debugging guidelines. |
| [`<GacUI>/Project.md`](../GacUI/Project.md) | GacUI project structure: the working solution (`<GacUI>/Test/GacUISrc/GacUISrc.sln`), files you must not modify, and generated folder conventions. |
| [CLAUDE.md](CLAUDE.md) | GacJS repository instructions: website build/test workflow, hosting pages, remote protocol testing, and E2E test conventions. |

---

## Building RemotingTest_Core.exe

Follow the guidelines in `<GacUI>/.github/Guidelines/Building.md`.

1. Stop any running debugger first: See `<GacUI>/.github/Guidelines/Debugging.md`

2. Build the solution:
   ```powershell
   cd <GacUI>\Test\GacUISrc
   & <GacUI>\.github\Scripts\copilotBuild.ps1
   ```
   This builds **Debug x64** by default. Override with `-Configuration` and `-Platform`.

3. Check the build log at `<GacUI>/.github/Scripts/Build.log`. Look for:
   ```
   Build succeeded.
       0 Error(s)
   ```

4. The built executable is at:
   ```
   <GacUI>\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe
   ```

**Important:** Only use `copilotBuild.ps1` — do NOT call `msbuild` directly.

---

## Running RemotingTest_Core.exe

Follow the guidelines in `<GacUI>/.github/Guidelines/Running-CLI.md`.

### Command-Line Arguments

`RemotingTest_Core.exe` accepts two categories of arguments (in any order):

| Argument | Description | Required |
|----------|-------------|----------|
| `/Http` | Use HTTP transport (port 8888) | **Yes** — `/Http` is required for GacJS testing |
| `/Pipe` | Use named-pipe transport | Not used by GacJS |
| `/FCT` | Run **FullControlTest** (index 0) — loads `<GacUI>/Test/Resources/App/FullControlTest` | Optional (default if neither is specified) |
| `/RPT` | Run **RemoteProtocolTest** (index 1) — loads `<GacUI>/Test/Resources/App/RemoteProtocolTest` | Optional |

- `/Http` and `/Pipe` are **exclusive** — exactly one must be specified. For GacJS, always use `/Http`.
- `/FCT` and `/RPT` are **exclusive** — specify at most one. If neither is given, `/FCT` is assumed.

**Changing XML resources:** If you modify any `.xml` files under `<GacUI>/Test/Resources/App/FullControlTest`
or `<GacUI>/Test/Resources/App/RemoteProtocolTest`, you must recompile them with **GacUICompiler**
before rebuilding `RemotingTest_Core`. See [`<GacUI>/Project.md`](../GacUI/Project.md) for details.

### Starting the Server

The server blocks the terminal, so launch it with `start`:

```powershell
start <GacUI>\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe /FCT /Http
```

The server prints:
```
> HTTP server created, waiting on: http://localhost:8888/GacUIRemoteProtocolHttp
```

### Stopping the Server

```powershell
Stop-Process -Name "RemotingTest_Core" -Force -ErrorAction SilentlyContinue
```

Or use the provided script:
```powershell
& (Join-Path $PSScriptRoot "scripts\stop-test-server.ps1")
```

---

## Debugging RemotingTest_Core.exe

Follow the guidelines in `<GacUI>/.github/Guidelines/Debugging.md`.

1. Start the debugger (opens in a new PowerShell window):
   ```powershell
   cd <GacUI>\Test\GacUISrc
   start powershell {& <GacUI>\.github\Scripts\copilotDebug_Start.ps1 -Executable RemotingTest_Core}
   ```

2. Send debugger commands:
   ```powershell
   & <GacUI>\.github\Scripts\copilotDebug_RunCommand.ps1 -Command "g"
   ```

3. Useful debugger commands: `g` (continue), `kn` (call stack), `dv` (variables),
   `bp FILE:LINE` (breakpoint), `p` (step over), `t` (step in), `pt` (step out).

4. Stop the debugger.

---

## Building and Running the GacJS Website

The website connects to `RemotingTest_Core.exe /Http` on `localhost:8888`.

### Build

```powershell
cd Gaclib
yarn build
```

This compiles TypeScript, copies assets, and bundles with esbuild. After a successful
build the website is accessible at `http://localhost:8896`.

**Note:** `localhost:8896` is hosted by IIS, so you do **not** need to run `npx serve`
or any manual hosting command. Just run `yarn build` and the website is automatically
available.

### Connect to RemotingTest_Core

1. Start the C++ server: `start <GacUI>\...\RemotingTest_Core.exe /FCT /Http`
2. Open `http://localhost:8896/index.html` in a browser.
3. The GacUI application UI renders in the browser via the remote protocol.

### Run E2E Tests

The E2E tests automatically start and stop `RemotingTest_Core.exe /FCT /Http` — you
do NOT need to start the server manually.

```powershell
cd Gaclib\website\entry
npx vitest run
```

Or run a specific test:
```powershell
cd Gaclib\website\entry
npx vitest run Testing_Protocol_SimpleTyping.js
```

Test files are in `Gaclib/website/entry/test/Testing_Protocol_*.js`. The shared
lifecycle (`setupProtocolTest()` in `Testing_Protocol.js`) handles server startup,
browser launch, and teardown.

---

## Git Workflow

After every piece of work, **git commit and git push to the current branch** in both
repos are required.

### Repository Layout

| Path | Type |
|------|------|
| `../GacUI/` | Normal git repository (sibling clone) |
| `./` (GacJS) | Normal git repository |

### Working with GacUI

```powershell
cd ../GacUI
git add -A
git commit -m "your message"
git push origin <current-branch-name-for-GacUI>
```

---

## Checking Core Exit Exception Rendering

To verify browser-side exception rendering, run the Remote Protocol Test variant:

```powershell
start <GacUI>\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe /Http /RPT
```

Open `http://localhost:8896/index.html`. The browser should render
`Remote Protocol Test`. Open the `File` menu, click
`self.Close() (InvokeInMainThread)`, and confirm the `Do you want to exit?`
dialog with `OK`.

After the core exits, the web page should render a visible exception message. For
the verified `/Http /RPT` exit path, the expected text is:

```text
IGacUIRenderer exited due to receiving RequestControllerConnectionStopped.
```

To check for any rendered exception, inspect the page text after confirming the
exit dialog and search for visible exception or exit text. In browser automation,
take a fresh DOM snapshot after the click and look for `IGacUIRenderer exited`
or another visible error line. Console logs can be empty; the rendered page text
is the authoritative signal for this check.
