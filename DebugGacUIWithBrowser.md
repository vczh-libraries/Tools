# Operating GacUI Through GacJS

This guide explains how to build and start `RemotingTest_Core`, serve GacJS, and
operate the browser renderer. It intentionally keeps the verification matrix and
pass/fail scenarios in
[`Jobs/job.verifyRemoteProtocol.prompt.md`](Jobs/job.verifyRemoteProtocol.prompt.md).
Use that job when deciding what must be tested; use this guide to decide how to
start and drive a browser session.

Run from a monorepo root where `GacUI`, `GacJS`, and `Tools` are sibling
repositories. In the commands below, `<GacUI>` and `<GacJS>` mean those checkout
roots.

## Required Reading and Tools

Read the current repository instructions before changing or building code:

- `<GacUI>/Project.md`
- `<GacUI>/.github/copilot-instructions.md` and its linked build, run, debugging,
  and computer-use guidelines
- `<GacJS>/AGENTS.md`
- `<GacJS>/doc/Testing_Protocol.md`

The useful UI tools are a normal browser, the in-app browser controller when it
is available, and the Playwright installation in `<GacJS>/Gaclib`. Use the
actual named browser when a result is browser-specific.

## Core and Website Model

`RemotingTest_Core` accepts one application selector (default `/FCT`) and
requires one transport selector:

| Argument | Meaning |
| --- | --- |
| `/FCT` | FullControlTest. This is the default application. |
| `/RPT` | RemoteProtocolTest. |
| `/Http` | The full HTTP transport, when supplied by the current platform. |
| `/MiniHTTP` | The async-socket MiniHTTP transport. Use this exact spelling. |
| `/Pipe` | Named-pipe transport. A fetch-based browser cannot use it. |

The GacJS transport contract is platform-specific:

| Platform | Compatible transport arguments | Core implementation status |
| --- | --- | --- |
| Windows | `/MiniHTTP`, `/Http` | Available |
| Linux | `/MiniHTTP` | Future core assumed by this guide |
| macOS | `/MiniHTTP` | Future core assumed by this guide |

`/Pipe` is not compatible with GacJS on any platform. This table describes the
transport contract and current implementation status; the verification job
defines the required applications and shared manual scenario for each transport.

`/FCT` and `/RPT` are exclusive. The transport arguments are also exclusive.
Start the core before opening `http://localhost:8896/index.html`.

The core protocol endpoint is fixed at port `8888`. The GacJS files are served
separately on port `8896`; `RemotingTest_Core` is not a static-file server. In
MiniHTTP mode the socket server exclusively owns port `8888`. This does not
prevent Playwright or browser tools from operating the page served on port
`8896`.

Only one remote renderer is active at a time. Opening another `index.html` tab
or browser transfers the existing application state to the new renderer and
detaches the old one. This is expected and is useful for testing reconnection.
Use a fresh core process between transport or application combinations.

## Build and Serve GacJS

Build from the GacJS workspace root:

```text
cd <GacJS>/Gaclib
yarn build
```

The static website is generated in
`<GacJS>/Gaclib/website/entry/lib/dist`. Serve that directory at
`http://localhost:8896` using the platform instructions below, then open
`http://localhost:8896/index.html`.

The complete repository test command is:

```text
cd <GacJS>/Gaclib
yarn test
```

The shared protocol lifecycle is `setupProtocolTest()` in
`Gaclib/website/entry/test/Testing_Protocol.js`. It starts the core, launches a
browser, and performs teardown. The verification job explains when to run it
and how to repeat it for each HTTP implementation.

## Operating the Browser

Drive input through the rendered page, not through Core `/IO`. A click or key
event sent to the page and reflected in a visible state change exercises both
directions of the remote protocol.

For interactive operation:

1. Open `index.html` and wait until the application title and main content are
   visible, not merely until the page returns HTTP 200.
2. Inspect fresh visible DOM state before every action. Menus, dialogs, and tab
   contents change the active tree.
3. Click the enclosing interactive element rather than a child text node. For
   text input, focus the intended editor and type through the browser keyboard.
4. After every operation, verify the expected visible state and capture a
   screenshot when the result is ambiguous.

For Playwright-based operation:

- Register dialog handlers and `setupIdleTracking(page)` before `page.goto()`.
- Use `waitUntilIdle(page)` for initial rendering and `waitForIdle(page)` after
  input. Use the caret/blink helpers for caret assertions.
- Re-query the DOM after tabs, menus, dialogs, and renderer replacement.
- Never add arbitrary sleeps for UI synchronization. The GacJS helpers wait for
  remote renderer idle and caret events.

Rendered page text is the authoritative browser-side error signal. A normal
core exit through the full HTTP implementation renders
`IGacUIRenderer exited due to receiving RequestControllerConnectionStopped.`;
MiniHTTP can render `Failed to fetch` after its socket server closes. Install a
browser-dialog handler before actions that can raise an alert, and retain the
core console output when diagnosing a failure.

For low-level protocol diagnosis, temporarily enable `PRINT_PROTOCOL_JSON` in
`<GacUI>/Test/GacUISrc/RemotingTest_Core/CoreChannel.cpp`. Rebuild, reproduce,
and revert the logging change before committing.

## Windows Specific

Build the GacUI solution only through the supported script:

```powershell
Set-Location <GacUI>\Test\GacUISrc
& <GacUI>\.github\Scripts\copilotBuild.ps1
```

The executable is
`<GacUI>\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe`. Retain the returned
process so cleanup targets only the process started for the run:

```powershell
$coreExe = '<GacUI>\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe'

# Async-socket MiniHTTP implementation
$core = Start-Process -FilePath $coreExe -ArgumentList '/MiniHTTP','/RPT' -PassThru

# Full Windows HTTP implementation, as a separate run
$core = Start-Process -FilePath $coreExe -ArgumentList '/Http','/RPT' -PassThru
```

The examples are separate runs; start only one core at a time. Substitute `/FCT`
for `/RPT` when required by the verification job. Exercise both `/MiniHTTP` and
`/Http` as separate Windows GacJS runs. Do not call MSBuild directly.

After `yarn build`, IIS normally serves the website at `localhost:8896`. If it
does not, serve `<GacJS>\Gaclib\website\entry\lib\dist` with a local static-file
server. The checked-in automated protocol harness currently uses the Windows
Debug x64 core executable and Playwright Chromium.

The optional Windows HTTP automation service also uses port `8888`; it is
unavailable while MiniHTTP owns that port.

Stop the retained core process after closing the page:

```powershell
if ($core -and -not $core.HasExited) { Stop-Process -Id $core.Id -Force }
```

## Linux Specific

Assume the future core project is available at
`<GacUI>/Test/Linux/RemotingTest_Core` and build it from that directory:

```bash
cd <GacUI>/Test/Linux/RemotingTest_Core
../../../.github/Ubuntu/build.sh
./Bin/RemotingTest_Core /MiniHTTP /RPT &
core_pid=$!
```

Serve the built GacJS directory and use Firefox:

```bash
python3 -m http.server 8896 --bind 127.0.0.1 --directory <GacJS>/Gaclib/website/entry/lib/dist &
site_pid=$!
```

If Playwright Firefox is used, install its browser runtime from the GacJS
workspace with `npx playwright install firefox`. Kill only the retained
`core_pid` and `site_pid` after the run. `/MiniHTTP` is the browser transport for
the assumed future core on this platform.

## macOS Specific

Assume the future core project is available at
`<GacUI>/Test/Linux/RemotingTest_Core` and build it from that directory:

```bash
cd <GacUI>/Test/Linux/RemotingTest_Core
../../../.github/Ubuntu/build.sh
./Bin/RemotingTest_Core /MiniHTTP /RPT &
core_pid=$!
python3 -m http.server 8896 --bind 127.0.0.1 --directory <GacJS>/Gaclib/website/entry/lib/dist &
site_pid=$!
open -a Safari http://localhost:8896/index.html
```

Use actual Safari for Safari verification; Playwright WebKit is useful WebKit
coverage, but it is not Safari. The current GacUI project plan limits macOS
coverage to `/RPT` until general text-box support is available. Kill only the
retained `core_pid` and `site_pid` after the run. `/MiniHTTP` is the browser
transport for the assumed future core on this platform.
