# Operating GacUI Through GacJS

This guide explains how to build and start `RemotingTest_Core`, serve GacJS,
and operate the browser renderer. The required verification matrix and scenarios
are in
[`Jobs/job.verifyRemoteProtocol.prompt.md`](Jobs/job.verifyRemoteProtocol.prompt.md).
Use that job to decide what must be tested and this guide to start and drive
each browser session.

Run from a monorepo root where `GacUI`, `GacJS`, and `Tools` are sibling
repositories. In the commands below, `<GacUI>` and `<GacJS>` mean those checkout
roots.

## Required Reading

Read the current repository instructions before changing or building code:

- `<GacUI>/Project.md`
- `<GacUI>/.github/copilot-instructions.md` and its linked build, run, debugging,
  and computer-use guidelines
- `<GacJS>/AGENTS.md`
- `<GacJS>/doc/Testing_Protocol.md`

`Testing_Protocol.md` and the checked-in GacJS protocol E2E harness currently
describe the Windows executable lifecycle and Playwright Chromium. Use the
platform sections below for portable core startup and static hosting.

## Core and Website Model

`RemotingTest_Core` accepts one application selector (default `/FCT`) and
requires one transport selector:

| Argument | Meaning |
| --- | --- |
| `/FCT` | FullControlTest. This is the default application. |
| `/RPT` | RemoteProtocolTest. |
| `/Http` | The Windows full-HTTP transport. |
| `/MiniHttp` | The portable async-socket MiniHTTP transport. Use this exact spelling. |
| `/Pipe` | The Windows named-pipe transport. A fetch-based browser cannot use it. |

The GacJS transport matrix is:

| Platform | Compatible core transport |
| --- | --- |
| Windows | `/Http`, `/MiniHttp` |
| Linux | `/MiniHttp` |
| macOS | `/MiniHttp` |

`/FCT` and `/RPT` are exclusive, as are the transport arguments. Start the core
before opening `http://localhost:8896/index.html`.

The protocol endpoint is fixed at port `8888`. In MiniHTTP mode, the core also
registers its `/Automation/RemotingTest_Core/...` routes on that listener. GacJS
is a separate static website served on port `8896`; `RemotingTest_Core` does not
host it.

Only one remote renderer is active at a time. Opening another browser instance
transfers the existing application state to the new renderer and detaches the
old one. Use a fresh core process between transport or application
combinations unless renderer replacement is the scenario being tested.

## Build and Test GacJS

Build from the GacJS workspace root:

```text
cd <GacJS>/Gaclib
yarn build
```

The website is generated in `<GacJS>/Gaclib/website/entry/lib/dist`. That
directory must be the static server's document root because the generated HTML
uses root-relative asset URLs.

Run the repository test command from the same directory:

```text
npm run test
```

On Windows this includes the checked-in protocol E2E tests. On Linux and macOS,
the website-entry package reports that the Windows-only E2E tests are skipped;
the portable renderer and remote-protocol unit-test packages still run. This
successful skip is not live browser verification.

## Operating the Browser

Drive input through the rendered page, not through Core `/IO`. A click or key
event sent to the page and reflected in a visible state change exercises both
directions of the remote protocol.

For interactive operation:

1. Open `index.html` and wait for the application title and live main content,
   not merely an HTTP 200 response.
2. Inspect fresh visible DOM state before every action. Tabs, menus, dialogs,
   and renderer replacement change the active tree.
3. Click the enclosing interactive element rather than a child text node. Focus
   the intended editor before typing through the browser keyboard.
4. Require the expected visible state after every action and capture a
   screenshot when the result is ambiguous.

For programmatic Playwright operation:

- Register dialog, console-error, and page-error handlers before `page.goto()`.
- Register the GacJS renderer-idle and caret-blink callbacks before navigation.
- Wait for the first renderer-idle event and substantial GacUI content before
  acting. Wait for renderer idle after each click or keystroke.
- Re-query the DOM after tabs, menus, dialogs, and renderer replacement.
- Do not use arbitrary sleeps for UI synchronization.

A normal renderer replacement or intentional application shutdown produces a
terminal disconnect in the old renderer. It must settle without an uncontrolled
fatal alert or retry loop. Retain the core output and browser diagnostics when
investigating a failure.

For low-level protocol diagnosis, temporarily enable `PRINT_PROTOCOL_JSON` in
`<GacUI>/Test/GacUISrc/RemotingTest_Core/CoreChannel.cpp`. Rebuild, reproduce,
and revert the logging change before committing.

## Windows

Build the GacUI solution only through the supported script:

```powershell
Set-Location <GacUI>\Test\GacUISrc
& <GacUI>\.github\Scripts\copilotBuild.ps1
```

The executable is
`<GacUI>\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe`. The following examples
are separate runs:

```powershell
$coreExe = '<GacUI>\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe'

# Portable MiniHTTP implementation
$core = Start-Process -FilePath $coreExe -ArgumentList '/MiniHttp','/FCT' -PassThru

# Full Windows HTTP implementation
$core = Start-Process -FilePath $coreExe -ArgumentList '/Http','/FCT' -PassThru
```

Substitute `/RPT` when required by the verification job. Exercise `/Http` and
`/MiniHttp` as separate GacJS runs. Do not call MSBuild directly.

After `yarn build`, IIS normally serves the website at `localhost:8896`. If it
does not, serve `<GacJS>\Gaclib\website\entry\lib\dist` with a static-file
server. The checked-in automated protocol harness uses the Windows Debug x64
core and Playwright Chromium.

Core automation is available at
`http://localhost:8888/Automation/RemotingTest_Core/...`. Port `8889` is for
native-renderer automation and is not used by GacJS.

Close the browser and stop only the retained core:

```powershell
if ($core -and -not $core.HasExited) { Stop-Process -Id $core.Id -Force }
```

## Linux and macOS

The portable build entry is shared by Linux and macOS. Build and start the core,
then start the static server from the same shell so both retained process
identifiers remain available for cleanup:

```bash
cd <GacUI>/Test/Linux/RemotingTest_Core
../../../.github/Ubuntu/build.sh
./Bin/RemotingTest_Core /MiniHttp /FCT &
core_pid=$!

cd <GacJS>/Gaclib
python3 -m http.server 8896 \
  --bind 127.0.0.1 \
  --directory website/entry/lib/dist &
site_pid=$!
```

Substitute `/RPT` when required.

Open `http://localhost:8896/index.html` only after the core reports that its
MiniHTTP server is waiting on port `8888`. The static server should report
successful requests for `index.html`, `global.css`, and `index.js`, and the core
should report that a renderer connected.

After closing the browser, stop only the retained processes:

```bash
kill "$site_pid" "$core_pid"
wait "$site_pid" "$core_pid" 2>/dev/null || true
```

### Linux

Use the Linux build, hosting, and cleanup commands above. Install the desired
Playwright browser runtime from `<GacJS>/Gaclib` and verify through a browser
page, not by relying on the non-Windows E2E skip:

```bash
yarn playwright install chromium
yarn playwright open --browser=chromium http://localhost:8896/index.html
```

These Linux instructions share the portable macOS path but were not executed
during the macOS investigation that introduced the build entry.

### macOS

Install Playwright's Chromium and WebKit runtimes:

```bash
cd <GacJS>/Gaclib
yarn playwright install chromium webkit
```

Verify Chromium first:

```bash
yarn playwright open --browser=chromium http://localhost:8896/index.html
```

The `playwright open` commands are interactive sessions. When automating the
scenario in a Playwright script, use the programmatic idle, blink, and error
handling rules above.

Close it, stop the core, and start a fresh `/MiniHttp` core before verifying
Playwright WebKit:

```bash
yarn playwright open --browser=webkit http://localhost:8896/index.html
```

For both engines, require live GacUI content, focus an editor, type through the
browser keyboard, and require the exact text to render with no dialog, page
error, or console error.

Playwright WebKit provides WebKit compatibility coverage but is not actual
Safari. Real Safari remains a separate manual check. Keep or restart the static
server, stop the WebKit core, and start a fresh `/MiniHttp` core before running:

```bash
open -a Safari http://localhost:8896/index.html
```

Run that command only when interactive Safari permissions are available.
