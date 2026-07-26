# Verify Remote Protocol

The remote protocol allows one renderer at a time to connect exclusively to a
headless GacUI core application. Run the native-renderer and GacJS sections
below when remote-protocol design or `INetworkProtocol(Server|Client)` changes.

If an upstream repository needs a fix, make the fix there, update its `Release`
folder, and then update GacUI's imported copy before continuing.

## Shared Renderer Behavior

- When a renderer is killed without a protocol shutdown, the core must continue
  waiting for another renderer.
- When another renderer connects, it must take over the application session and
  preserve its state. The old renderer must detach.
- Closing the application through its UI may end both the core and renderer.
- An intentional core shutdown or renderer replacement causes a terminal
  disconnect. The detached renderer must settle without an uncontrolled fatal
  alert or retry loop.
- Replacing a native renderer with GacJS, or the reverse, is supported but is
  not required by this verification.

`RemotingTest_Core` and the transport-specific renderer programs are demos.
Their network shutdown paths do not need production-quality recovery. The
remote-protocol implementation and all required protocol features do.

## Step 1. Verify with the Native Renderer

Follow `Tools/DebugGacUIWithRemoteProtocol.md` to build, start, replace, and
stop the native renderer. Follow `Tools/DebugGacUISop.md` for the required UI
operations and observable results.

### Windows

Use `RemotingTest_Core` with `RemotingTest_Rendering_Win32`. Verify these
transports in order, using a fresh core for each run:

1. `/Pipe`, using Windows named pipes.
2. `/Http`, using http.sys with WinHTTP.
3. `/MiniHttp`, using the portable MiniHTTP implementation in VlppOS.

`/Http` and `/MiniHttp` are wire-compatible, so the core and renderer can use
different HTTP implementations. That cross-combination is covered by VlppOS
unit tests and is not required here.

### Linux and macOS

The native remote renderer is not implemented on Linux or macOS. Do not count a
GacJS run as native-renderer coverage.

## Step 2. Verify with GacJS

Follow `Tools/DebugGacUIWithGacJS.md` to build and host GacJS, start the core,
select a browser engine, and clean up retained processes. Follow
`Tools/DebugGacUISop.md` for the required UI operations and observable results.

For every transport and browser combination below, run both the `/RPT` and
`/FCT` sections of the SOP. Start a fresh core for each application.

GacJS is the browser renderer; it is not the native Win32 renderer. `/Pipe`
cannot be used by a fetch-based browser.

Run `npm run test` from `GacJS/Gaclib` before live browser verification. On
Linux and macOS, the website-entry package skips its Windows-only protocol E2E
tests while the portable unit-test packages still run. That skip is expected,
but it does not count as live GacJS coverage.

### Windows

Verify these transports in order, using a fresh core for each run:

1. `/Http`, using http.sys with WinHTTP.
2. `/MiniHttp`, using the portable MiniHTTP implementation in VlppOS.

GacJS is compatible with both `/Http` and `/MiniHttp`.

### macOS

Use `/MiniHttp` and the portable
`GacUI/Test/Linux/RemotingTest_Core/Bin/RemotingTest_Core`:

1. Run both application scenarios with Playwright Chromium.
2. Repeat both application scenarios with Playwright WebKit.
3. Repeat both application scenarios in actual Safari when interactive browser
   permissions are available.

Playwright WebKit is WebKit compatibility coverage, not actual Safari
verification. Do not report it as Safari.

### Linux

Use `/MiniHttp`, the portable
`GacUI/Test/Linux/RemotingTest_Core/Bin/RemotingTest_Core`, and the static
hosting instructions in `Tools/DebugGacUIWithGacJS.md`. Run the complete GacJS
scenario in an installed Playwright browser.

The Linux path shares the portable build and hosting design with macOS, but it
must be executed on Linux before Linux support is reported as verified.
