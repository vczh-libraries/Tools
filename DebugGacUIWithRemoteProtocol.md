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
visible text you want, then use the nearest enclosing control bounds. Send input
commands by posting to `IO` with content type `application/json; charset=utf8`.

Example:

```powershell
Invoke-WebRequest `
  -UseBasicParsing `
  -Method Post `
  -Uri http://localhost:8888/Automation/RemotingTest_Core/IO `
  -ContentType 'application/json; charset=utf8' `
  -SkipHeaderValidation `
  -Body '!LeftClick:29,50'
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

On the current Remote Protocol Test layout, these coordinates perform the same
sequence:

```powershell
$io = 'http://localhost:8888/Automation/RemotingTest_Core/IO'
Invoke-WebRequest -UseBasicParsing -Method Post -Uri $io -ContentType 'application/json; charset=utf8' -SkipHeaderValidation -Body '!LeftClick:29,50'
Invoke-WebRequest -UseBasicParsing -Method Post -Uri $io -ContentType 'application/json; charset=utf8' -SkipHeaderValidation -Body '!LeftClick:138,235'
Invoke-WebRequest -UseBasicParsing -Method Post -Uri $io -ContentType 'application/json; charset=utf8' -SkipHeaderValidation -Body '!LeftClick:277,293'
```

The known current bounds are:

| Control | Bounds | Click |
|---------|--------|-------|
| `File` menu | `(10,39)-(48,61)` | `29,50` |
| `self.Close() (InvokeInMainThread)` | `(13,223)-(264,248)` | `138,235` |
| Exit dialog `OK` | `(237,281)-(317,305)` | `277,293` |

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
