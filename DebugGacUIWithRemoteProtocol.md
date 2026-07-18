# Operating GacUI With a Native Remote Renderer

This guide explains how to start a native renderer, inspect its remote UI, and
send real renderer-side input. The required transport matrix, shared UI
operations, and pass/fail criteria are defined in
[`Jobs/job.verifyRemoteProtocol.prompt.md`](Jobs/job.verifyRemoteProtocol.prompt.md).
Use this document as the native-renderer operation entry point on every
platform; its platform section states the currently available implementation.

The core must start before the renderer. The application selector (`/FCT` or
`/RPT`) belongs only to the core, while the renderer receives the matching
transport selector. Run one core/renderer pair at a time and retain both process
identifiers for cleanup.

The native-renderer transport contract is:

| Platform | Transport arguments | Current implementation status |
| --- | --- | --- |
| Windows | `/MiniHTTP`, `/Http`, `/Pipe` | Available |
| Linux | `/MiniHTTP` | Native renderer not implemented yet |
| macOS | `/MiniHTTP` | Native renderer not implemented yet |

This guide reports current implementation status honestly. The verification job
is deliberately forward-looking and keeps the Linux and macOS `/MiniHTTP` rows
in its required matrix even though their native renderers are not available yet.

## Windows

Read `GacUI/Project.md`, `GacUI/.github/copilot-instructions.md`, and the linked
build, run, debugging, and computer-use guidelines before starting. Build only
through the supported script:

```powershell
Push-Location GacUI\Test\GacUISrc
try {
    & ..\..\.github\Scripts\copilotBuild.ps1
}
finally {
    Pop-Location
}
```

The executables are:

```text
GacUI\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe
GacUI\Test\GacUISrc\x64\Debug\RemotingTest_Rendering_Win32.exe
```

Start a pair from the monorepo root. These examples use `/RPT`; substitute
`/FCT` when required by the verification job.

```powershell
$bin = (Resolve-Path GacUI\Test\GacUISrc\x64\Debug).Path

# Full Windows HTTP implementation
$core = Start-Process -FilePath (Join-Path $bin 'RemotingTest_Core.exe') -ArgumentList '/Http','/RPT' -PassThru
$renderer = Start-Process -FilePath (Join-Path $bin 'RemotingTest_Rendering_Win32.exe') -ArgumentList '/Http' -PassThru

# Async-socket MiniHTTP implementation
$core = Start-Process -FilePath (Join-Path $bin 'RemotingTest_Core.exe') -ArgumentList '/MiniHTTP','/RPT' -PassThru
$renderer = Start-Process -FilePath (Join-Path $bin 'RemotingTest_Rendering_Win32.exe') -ArgumentList '/MiniHTTP' -PassThru

# Named pipe implementation
$core = Start-Process -FilePath (Join-Path $bin 'RemotingTest_Core.exe') -ArgumentList '/Pipe','/RPT' -PassThru
$renderer = Start-Process -FilePath (Join-Path $bin 'RemotingTest_Rendering_Win32.exe') -ArgumentList '/Pipe' -PassThru
```

The examples are separate runs, not one script. Start the selected core, wait
for its server-created message, and only then start the matching renderer. A
successful connection prints:

```text
> Waiting for a renderer ...
> Renderer connected: 2
```

HTTP creation reports
`http://localhost:8888/GacUIRemoteProtocolHttp`; MiniHTTP reports the same URL
with `Mini HTTP server created`; named pipe reports
`GacUIRemoteProtocolNamedPipe`.

### HTTP Automation for `/Http` and `/Pipe`

The Windows HTTP automation service is available during `/Http` and `/Pipe`
runs:

```text
GET  http://localhost:8888/Automation/RemotingTest_Core/Controls
POST http://localhost:8888/Automation/RemotingTest_Core/IO
GET  http://localhost:8888/Automation/RemotingTest_Rendering_Win32/Dom
POST http://localhost:8888/Automation/RemotingTest_Rendering_Win32/IO
```

`Controls` describes logical GacUI controls; `Dom` describes what the native
renderer received. Search the latest JSON for the visible text, walk upward to
the nearest enclosing interactive object with bounds, and click the integer
center:

```text
x = floor((x1 + x2) / 2)
y = floor((y1 + y2) / 2)
```

Post commands as `application/json; charset=utf8`:

```powershell
Invoke-WebRequest `
  -UseBasicParsing `
  -Method Post `
  -Uri http://localhost:8888/Automation/RemotingTest_Rendering_Win32/IO `
  -ContentType 'application/json; charset=utf8' `
  -SkipHeaderValidation `
  -Body '!LeftClick:<integer-x>,<integer-y>'
```

Use renderer `/IO`, or actual native mouse and keyboard input, for the shared
verification scenario. Renderer-side input crosses the network to the core;
Core `/IO` alone bypasses that half of the path. Core `/IO` remains useful for
diagnosis and for deliberately checking the opposite direction.

Re-read both trees after opening a tab, menu, or dialog. A response of `Queued`
only means the input was accepted; require the expected state change. The
renderer response can retain hidden entries in its `Elements` catalog, so also
require the matching element to be reachable from the active `Dom` tree.

### Native Input for `/MiniHTTP`

MiniHTTP's raw socket server exclusively owns port `8888`. Both processes
therefore disable the Windows HTTP automation listener in this mode, and none of
the `/Automation/...` endpoints above are available.

Keep the renderer window visible and drive it with actual Win32 mouse and
keyboard input, using the computer-use tooling described by the GacUI
guidelines. Locate the window by the retained renderer PID and current title,
bring it to the foreground, capture a fresh screenshot, and derive click points
from the current UI instead of reusing fixed coordinates. Re-inspect after each
tab, menu, or modal transition. Native message boxes, including a transport
error shown during shutdown, also require native input.

### Debugging and Cleanup

Keep both consoles available when investigating connection or shutdown errors.
If a debugger is needed, use the scripts in `GacUI/.github/Scripts` as directed
by `GacUI/.github/Guidelines/Debugging.md`.

After a normal close, `/Pipe` can show an `ERROR from GacUI Core` dialog saying
that `ReadFile` failed because the named pipe was closed. Dismiss it and confirm
the renderer exits. Do not treat any earlier disconnect or dialog as success.

Clean up only the processes retained for the run:

```powershell
if ($renderer -and -not $renderer.HasExited) { Stop-Process -Id $renderer.Id -Force }
if ($core -and -not $core.HasExited) { Stop-Process -Id $core.Id -Force }
```

If process identifiers were lost, first inspect all matching processes and their
start times before using a name-based fallback.

## Linux Specific

The planned native-renderer transport for Linux is `/MiniHTTP`; `/Http` and
`/Pipe` are not part of the planned platform contract. Native remote rendering is
not implemented yet, so the equivalent renderer and its concrete
start/inspection procedure must be provided by another repository before the job
can run. Do not attempt to run `RemotingTest_Rendering_Win32` on Linux.

## macOS Specific

The planned native-renderer transport for macOS is `/MiniHTTP`; `/Http` and
`/Pipe` are not part of the planned platform contract. Native remote rendering is
not implemented yet, so the equivalent renderer and its concrete
start/inspection procedure must be provided by another repository before the job
can run. Do not attempt to run `RemotingTest_Rendering_Win32` on macOS.
