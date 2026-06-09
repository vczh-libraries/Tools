# Debugging GacUI With Remote Protocol Tests

This document describes the verified manual workflow for running
`RemotingTest_Core.exe` with `RemotingTest_Rendering_Win32.exe`, finding controls
through the automation service, and exiting cleanly.

## Start The Processes

Build GacUI first:

```powershell
cd C:\Code\VczhLibraries\GacUI\Test\GacUISrc
& C:\Code\VczhLibraries\GacUI\.github\Scripts\copilotBuild.ps1
```

For HTTP transport:

```powershell
start C:\Code\VczhLibraries\GacUI\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe /Http /RPT
start C:\Code\VczhLibraries\GacUI\Test\GacUISrc\x64\Debug\RemotingTest_Rendering_Win32.exe /Http
```

For named-pipe transport:

```powershell
start C:\Code\VczhLibraries\GacUI\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe /Pipe /RPT
start C:\Code\VczhLibraries\GacUI\Test\GacUISrc\x64\Debug\RemotingTest_Rendering_Win32.exe /Pipe
```

Start the core first. The core console should print either:

```text
> HTTP server created, waiting on: http://localhost:8888/GacUIRemoteProtocolHttp
> Waiting for a renderer ...
> Renderer connected: 2
```

or:

```text
> Named pipe created, waiting on: GacUIRemoteProtocolNamedPipe
> Waiting for a renderer ...
> Renderer connected: 2
```

## Find Controls

When `/RPT` is enabled, the core exposes an automation service on port `8888`.
Use these endpoints:

```text
http://localhost:8888/Automation/RemotingTest_Core/Controls
http://localhost:8888/Automation/RemotingTest_Core/IO
http://localhost:8888/Automation/RemotingTest_Rendering_Win32/Dom
```

`Controls` returns JSON with element text and bounds. Search the JSON for the
visible text you want, then read the nearest enclosing object's `bounds` object.
The bounds object has `x1`, `y1`, `x2`, and `y2` fields. Click the center point:

```text
x = (x1 + x2) / 2
y = (y1 + y2) / 2
```

If the visible text is inside an `elementText` label, walk upward to the nearest
enclosing node that has a `control` field and use that node's bounds. Send input
commands by posting to `IO` with content type `application/json; charset=utf8`.

Example:

```powershell
Invoke-WebRequest `
  -UseBasicParsing `
  -Method Post `
  -Uri http://localhost:8888/Automation/RemotingTest_Core/IO `
  -ContentType 'application/json; charset=utf8' `
  -SkipHeaderValidation `
  -Body '!LeftClick:<x>,<y>'
```

The coordinates are logical GacUI coordinates. Re-read `Controls` after opening
menus or dialogs, because their bounds are only present after they are visible.

## Exit The Remote Protocol Test

The verified `/RPT` sequence is:

1. Open the File menu.
2. Click the first close item: `self.Close() (InvokeInMainThread)`.
3. Confirm the `Do you want to exit?` dialog with `OK`.
4. If the renderer shows a native `ERROR from GacUI Core` dialog, click its `OK`
   button too.
5. Confirm both `RemotingTest_Core` and `RemotingTest_Rendering_Win32` have
   exited.

Use the automation service to calculate every click point from the current
`Controls` response:

1. Read `Controls` and search for the `File` menu text.
2. Use the nearest enclosing control bounds and post `!LeftClick:<x>,<y>` to
   open the menu.
3. Read `Controls` again and search for
   `self.Close() (InvokeInMainThread)`.
4. Use that menu item's enclosing control bounds and post its center point.
5. Read `Controls` again and search for the `OK` button in the
   `Do you want to exit?` dialog.
6. Use that button's enclosing control bounds and post its center point.

```powershell
$io = 'http://localhost:8888/Automation/RemotingTest_Core/IO'
Invoke-WebRequest -UseBasicParsing -Method Post -Uri $io -ContentType 'application/json; charset=utf8' -SkipHeaderValidation -Body '!LeftClick:<x>,<y>'
```

For `/Http /RPT`, both processes should exit after the exit dialog `OK`.

For `/Pipe /RPT`, `RemotingTest_Rendering_Win32` may show a native error dialog
titled `ERROR from GacUI Core` with the message:

```text
ReadFile failed because the named pipe was closed.
```

Click `OK` in that native dialog. The renderer should then close.

## Cleanup

If a run is interrupted, stop both processes:

```powershell
Get-Process RemotingTest_Core,RemotingTest_Rendering_Win32 -ErrorAction SilentlyContinue | Stop-Process -Force
```
