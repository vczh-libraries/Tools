# Step 1. Verify Remote Protocol with Native Renderer

- Follow `Tools/DebugGacUIWithRemoteProtocol.md` to understand how to start the native renderer with GacUI's `RemotingTest_Core` project, and how to operate the UI in the renderer.
- Follow `Tools/DebugGacUISop.md` to perform a series of manual testing on the UI to make sure everything is working.

## Using the Native/GacJS Renderer 

The remote protocol is designed to let multiple renderers exclusively connecting to one core GacUI application starting with remote protocol:
- When the core shutdown, the network protocol client in the renderer is supposed to inform an error of losing the network connection, which is expected, at this point the renderer is going to report a fatal error and exit.
- When the renderer is killed, the core is supposed to continue executing, waiting for the next renderer to connect.
  - Being killed means the renderer process exits without sending a proper shutdown message via the remote protocol, usually by terminating the process directly.
  - Proper way to exit a renderer together with the core process can be done by and not limited to:
    - Clicking the "X" button to close the window. This could also be achieved by pressing expected shortcut key, or in Windows, sending the `WM_CLOSE` message.
    - Doing any UI operation that causing the core to call main window's `Close` or `Hide`.
- When the renderer is alive, and another renderer is executed, the new renderer is supposed to take over the connection.
- "Renderer" in this section includes both native renderer and GacJS, which means a native renderer or GacJS running in a browser could take over each other by running new instances of them, but such scenario is not required in the verification.

## Quality Control

- `RemotingTest_Core` and any native renderers are designed to be a demo.
- Any network protocol used here is for test only, they are not part of the product code, no need to pursue production quality.
- The `Stop` function of `INetworkProtocol(Server|Client)` is just running a callback if there is any, to tell the core/renderer to run finalization works, and shutdown the network directly to unblock `main` or `GuiMain`. No need to pursue an elegant shutdown process inside the network protocol.
- Since the renderer is designed in that way (mentioned in `Using the Native Renderer` section), so terminating the core in any way does not need inform the renderer. The renderer is going to sense that the network connection is lost, and report a fatal error.

## Goal of the Verification

The verification is usually required to execute when the following thing is changed:
- Remote Protocol design
- `INetworkProtocol(Server|Client)` implementation

The overall target is to make sure GacUI is doing remote protocol right. This part is supposed to have production quality.
But any actual network protocol implementation is fine with demo quality, it is used to live demo the remote protocol. So no need to ensure perfection in this part in terms or dealing with any networking corner case, etc. But we need to at least make sure all required remote protocol features can run with them.

If anything in the upstream repo needs to fix, the fix should be first done in the upstream repo, and then release to GacUI for further verification.

## Step 1. Verify Remote Protocol with Native Renderer

- Follow `Tools/DebugGacUIWithRemoteProtocol.md` to understand how to start the native renderer with GacUI's `RemotingTest_Core` project, and how to operate the UI in the renderer.
- Follow `Tools/DebugGacUISop.md` to perform a series of manual testing on the UI to make sure everything is working.

### Windows Specific

You are going to verify the remote protocol with the following network protocols in order:
- `/Pipe`, using Named Pipes
- `/Http`, using http.sys with WinHttp
- `/MiniHttp`, using the mini http protocol implemented in `VlppOS` repo

`/Http` and `/MiniHttp` are supposed to be compatible with each other, which means the core and the renderer does not need to start with the same HTTP configuration, but such scenario is not required in the verification. Their compatibility is verified in the unit test in `VlppOS`.

The native renderer means the `RemotingTest_Renderer_Win32` project in GacUI.

### Linux/macOS Specific

Not supported yet.

## Step 2. Verify Remote Protocol with GacJS

- Follow `Tools/DebugGacUIWithBrowser.md` to understand how to start the native renderer with GacJS, and how to operate the UI in the renderer.
- Follow `Tools/DebugGacUISop.md` to perform a series of manual testing on the UI to make sure everything is working.

### Windows Specific

You are going to verify the remote protocol with the following network protocols in order:
- `/HTTP`, using http.sys with WinHttp
- `/MiniHttp`, using the mini http protocol implemented in `VlppOS` repo
GacJS is generally a website, it is compatible with both `/HTTP` and `/MiniHttp`.

### Linux/macOS Specific

Not supported yet.
