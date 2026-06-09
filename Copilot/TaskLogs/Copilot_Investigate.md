# !!!INVESTIGATE!!!

# PROBLEM DESCRIPTION

Release VlppOS to Workflow repo and GacUI repo.
Make sure Workflow builds, no need to run test cases.
Make sure GacUI builds, I suspect this would break `RemotingTest_(Core|Renderer_Win32)` projects. The main difference is that `IChannel` removes `senderClientId` as they are not necessary. Fix all code that calls them, and make sure `RemotingTest_(Core|Renderer_Win32)` works under `/Http /RPT` and `/Pipe /RPT`. You are going to do click the menu and find the first exit menu item, it may raise a dialog box, do anything you need to exit, and it should close both processes. Write down how to start and exit, how to find controls to operate in `DebugGacUIWithRemoteProtocol.md` in the Tools repo's root folder.
Make sure GacJS works, following [DebugGacUIWithBrowser.md](Tools/DebugGacUIWithBrowser.md) to run `RemotingTest_Core` with `/Http /RPT`, click the same exit menu item and make sure the website actually renders the exception saying the core side is exited. Describe how to check if any exception renders and append it with a new section to [DebugGacUIWithBrowser.md](Tools/DebugGacUIWithBrowser.md)

Remember to git push all local changes from all affected repos.

# UPDATES

Regenerated the VlppOS release files and copied them into Workflow and GacUI
imports. Fixed GacUI call sites for the updated `IChannel` send and broadcast
APIs, then regenerated GacUI release files. Added remote-protocol operation docs
and browser exception-check docs in the Tools repo.

# TEST

Build Workflow after importing the regenerated VlppOS release files. Build GacUI after importing the regenerated VlppOS release files and fixing any compile errors caused by the `IChannel` `senderClientId` removal. Verify `RemotingTest_Core` and `RemotingTest_Rendering_Win32` with `/Http /RPT` and `/Pipe /RPT` by using the automation service to open the menu, invoke the first exit menu item, handle any exit dialog, and confirm both processes close. Verify GacJS by running `RemotingTest_Core /Http /RPT`, opening the website, invoking the same exit menu item, and confirming the browser renders the exception that the core side exited.

# PROPOSALS

Confirmed:

- Workflow `Debug|x64` and `Debug|Win32` builds succeeded.
- GacUI `Debug|x64` and `Debug|Win32` builds succeeded.
- `RemotingTest_Core` and `RemotingTest_Rendering_Win32` exited under `/Http /RPT`.
- `RemotingTest_Core` and `RemotingTest_Rendering_Win32` exited under `/Pipe /RPT` after acknowledging the renderer's native `ERROR from GacUI Core` dialog.
- GacJS `yarn build` succeeded.
- GacJS rendered `IGacUIRenderer exited due to receiving RequestControllerConnectionStopped.` after `RemotingTest_Core /Http /RPT` exited.
