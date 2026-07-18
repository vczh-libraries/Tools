You are going to verify the complete GacUI remote-rendering path on Windows:

- GacUI core with the native Win32 renderer over HTTP.
- GacUI core with the native Win32 renderer over a named pipe.
- GacUI core with the GacJS `index.html` renderer over HTTP.
- All GacJS tests, including the Windows GacUI protocol E2E suites.

The job is not complete merely because processes start or a static page returns HTTP 200.
Every phase below must meet its observable success criteria. If a phase fails, diagnose and
fix the root cause, rerun the failed phase, and rerun every downstream phase that could be
affected. Commit and push all local changes in every repository that has them, including
reviewed changes that predated the job, when verification is complete.

If `git push` is rejected because the remote branch advanced, fetch and rebase onto that
repository's exact configured upstream branch. Do not force-push and do not push the commit to
a differently named branch. Resolve conflicts without destructive reset. Rerun verification
when source code changed during the rebase; documentation-only rebases do not require another
test run.

## Authority and Workspace Layout

Run this job from the monorepo root, where `GacUI`, `GacJS`, and `Tools` are sibling
repositories. Read these files before doing any work:

- `AGENTS.md`
- `Tools\MonoRepo.md`
- `Tools\DebugGacUIWithBrowser.md`
- `Tools\DebugGacUIWithRemoteProtocol.md`
- `GacUI\AGENTS.md`
- `GacUI\Project.md`
- `GacUI\.github\copilot-instructions.md`
- The GacUI build, run, computer-use, and debugging guidelines referenced by those files.
- `GacJS\AGENTS.md`
- `GacJS\doc\Protocol.md`
- `GacJS\doc\DOM.md`
- `GacJS\doc\Projects.md`
- `GacJS\doc\Testing_Protocol.md`

Use `GacJS\AGENTS.md` as the current GacJS instruction file. Older documentation refers to
`CLAUDE.md`, but that file does not exist. Also follow the current GacJS validation rule:
run `yarn build` and then `yarn test` from `GacJS\Gaclib`. Do not replace the full test run
with `npx vitest`, even if an older debugging document shows that command for an isolated
diagnostic.

The generic GacUI CLI runner cannot select all transport/application flag combinations used
by this job. For the remoting checks, use the exact variant-specific direct launches documented
below. Continue to use `copilotBuild.ps1` for every GacUI build; never call MSBuild directly.

## Preflight

1. Discover every child Git repository under the monorepo root. For each one, record its branch,
   configured upstream, `git status -sb`, staged changes, unstaged changes, untracked files,
   and ahead/behind counts. Preserve this initial inventory so work that predates the job can
   be distinguished from verification changes. The final commit-all instruction includes both,
   but unrelated work should use a separate honest commit instead of being hidden in a
   misleading verification-fix commit.
2. Stop stale remoting processes before a build or a new phase:

   ```powershell
   Get-Process RemotingTest_Core,RemotingTest_Rendering_Win32 -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

3. Inspect ports 8888 and 8896:

   ```powershell
   Get-NetTCPConnection -LocalPort 8888,8896 -ErrorAction SilentlyContinue
   ```

   Port 8888 must be free before starting a remoting pair. Port 8896 is normally owned by
   IIS/System and serves the GacJS build. Identify an unexpected owner instead of killing an
   unrelated process.
4. Confirm Node.js, Yarn, Visual Studio C++ tools, and the Playwright Chromium installation
   are present. Install a missing dependency when necessary and record what was installed.

Wrong preflight state includes an unknown process on port 8888, multiple old core/renderer
processes, or an unreviewed dirty worktree. These conditions can create false protocol failures.

## Phase 1: Build GacUI

Run only the supported build script:

```powershell
Set-Location GacUI\Test\GacUISrc
& (Resolve-Path ..\..\.github\Scripts\copilotBuild.ps1)
Set-Location ..\..\..
```

The authoritative result is `GacUI\.github\Scripts\Build.log` after the script returns.

Right means all of the following are true:

- The final build summary contains `Build succeeded.`, `0 Warning(s)`, and `0 Error(s)`.
- `Build.log.unfinished` does not remain.
- Both executables exist in `GacUI\Test\GacUISrc\x64\Debug`:
  `RemotingTest_Core.exe` and `RemotingTest_Rendering_Win32.exe`.

Wrong means the script returns nonzero, any error is reported, the success trailer is absent,
an unfinished log remains, or either executable is missing. If linking reports a locked image,
stop the remoting processes/debugger and rebuild.

## Phase 2: Native Remote Protocol

Verify HTTP and named-pipe transport in separate clean runs. Start the core first, then its
renderer. For automated runs, keep background processes hidden and retain their process IDs:

```powershell
$bin = (Resolve-Path GacUI\Test\GacUISrc\x64\Debug).Path
$core = Start-Process -FilePath (Join-Path $bin 'RemotingTest_Core.exe') -ArgumentList '/Http','/RPT' -WindowStyle Hidden -PassThru
$deadline = (Get-Date).AddSeconds(15)
do {
    Start-Sleep -Milliseconds 100
    $core.Refresh()
    $listener = Get-NetTCPConnection -LocalPort 8888 -State Listen -ErrorAction SilentlyContinue
} until ($core.HasExited -or $listener -or (Get-Date) -gt $deadline)
if ($core.HasExited -or -not $listener) { throw 'HTTP core did not become ready.' }
$renderer = Start-Process -FilePath (Join-Path $bin 'RemotingTest_Rendering_Win32.exe') -ArgumentList '/Http' -WindowStyle Hidden -PassThru
```

After the HTTP run is fully cleaned up, launch the pipe pair:

```powershell
$core = Start-Process -FilePath (Join-Path $bin 'RemotingTest_Core.exe') -ArgumentList '/Pipe','/RPT' -WindowStyle Hidden -PassThru
Start-Sleep -Milliseconds 750
$core.Refresh()
if ($core.HasExited) { throw 'Pipe core exited before renderer launch.' }
$renderer = Start-Process -FilePath (Join-Path $bin 'RemotingTest_Rendering_Win32.exe') -ArgumentList '/Pipe' -WindowStyle Hidden -PassThru
```

When a visible console is available, use the named-pipe-created line as the pre-renderer
readiness signal. In a hidden automated run, the startup delay is only a launch aid, never the
readiness proof: after starting the renderer, poll the read-only automation state for at most
30 seconds and fail immediately if either process exits. Short waits between readiness polls
are only for OS process startup; never add sleep-based UI synchronization to GacJS tests.

When a visible console is used, the expected creation/connection sequence is:

- HTTP: `HTTP server created, waiting on: http://localhost:8888/GacUIRemoteProtocolHttp`
- Pipe: `Named pipe created, waiting on: GacUIRemoteProtocolNamedPipe`
- Then `Waiting for a renderer ...` and `Renderer connected: 2`

Do not rely on console text alone. Poll these read endpoints with HTTP GET, using a 30-second
overall timeout and short intervals:

- `http://localhost:8888/Automation/RemotingTest_Core/Controls`
- `http://localhost:8888/Automation/RemotingTest_Rendering_Win32/Dom`

The IO endpoints are POST-only command endpoints; do not GET them as a readiness probe:

- `http://localhost:8888/Automation/RemotingTest_Core/IO`
- `http://localhost:8888/Automation/RemotingTest_Rendering_Win32/IO`

Right means `Controls` and `Dom` both return HTTP 200, `Controls` reports the main window title
`Remote Protocol Test`, the renderer response's top-level `Title` field matches it, and both
processes stay alive until the intentional exit sequence. This proves a renderer connection
more strongly than a listening port alone.

Wrong means either endpoint never becomes ready, the trees are empty or disagree about the
application, one process exits early, or only the HTTP.sys listener owned by System is visible
without a working automation tree.

### Automation Clicks

Use the current `Controls` JSON to find each visible `elementText`. Walk upward to the nearest
enclosing object with a `control` field, then use that object's bounds. Re-read `Controls` after
opening every menu or dialog because hidden controls do not have current interactive bounds.

Calculate the center and convert it to integer logical coordinates before posting:

```text
x = floor((x1 + x2) / 2)
y = floor((y1 + y2) / 2)
```

```powershell
Invoke-WebRequest `
  -UseBasicParsing `
  -Method Post `
  -Uri http://localhost:8888/Automation/RemotingTest_Core/IO `
  -ContentType 'application/json; charset=utf8' `
  -SkipHeaderValidation `
  -Body '!LeftClick:<integer-x>,<integer-y>'
```

The response `Queued` only means the command was accepted. Verify the expected next UI state.
Fractional coordinates can also return `Queued` while failing to activate the target, so a 200
response by itself is not success.

### Verify Both IO Directions

Before the exit test, verify the core-to-renderer update path and the renderer-to-core event
path for both HTTP and named-pipe transport:

1. Derive the integer center of `File` from current `Controls`.
2. POST the click to Core `IO`. With a bounded wait, require the open menu item
   `self.Close() (InvokeInMainThread)` in current `Controls` and in the active renderer `Dom`
   tree. Click a verified point outside the menu through Core `IO` and require the menu to be
   absent from both active trees again.
3. POST the same `File` click to renderer `IO`. Require the same synchronized open state in
   both trees, then close it through renderer `IO` and require the same synchronized closed
   state.

The renderer JSON has a persistent `Elements` catalog that can include currently hidden text.
Check whether the matching element ID is present in the active `Dom` tree; a raw substring in
the `Elements` catalog is not proof that the menu is rendered. Any direction that returns
`Queued` without the same state appearing in both active trees is wrong.

For both transports perform this exact exit sequence:

1. Click `File`.
2. Refresh `Controls`, then click `self.Close() (InvokeInMainThread)`.
3. Confirm that `Do you want to exit?` is rendered.
4. Click `OK`.

For both transports, Core `Controls` and Core `IO` must remain usable through discovery and
activation of the confirmation `OK`. Loss of Core automation before intentional shutdown is
wrong. Renderer `Dom`/`IO` may be used to collect diagnostics or clean up a stuck run, but that
fallback does not turn the failed Core-automation criterion into a pass.

For HTTP, right means both the core and Win32 renderer exit after `OK`.

After the named-pipe core exits, the renderer may show a native dialog titled
`ERROR from GacUI Core` with `ReadFile failed because the named pipe was closed.` This one
specific close-time message is expected, not a protocol failure. Inspect it with the Win32
window-enumeration procedure in
`GacUI\.github\Guidelines\Running-ComputerUse.md`. Current code appends
`Do you want to close the renderer?`; click `Yes` (standard button id 6). Click `OK` only when
an actually observed legacy one-button dialog offers `OK`. Require the renderer to exit. Any
different native error, or a renderer that remains after acknowledging the expected dialog,
is wrong.

Always clean both processes in a `finally`-style cleanup before the next phase.

## Phase 3: Build and Serve GacJS

From the monorepo root run:

```powershell
Set-Location GacJS\Gaclib
yarn build
Set-Location ..\..
```

Right means the command returns zero, all five workspace packages that define a build script
report successful builds, and
`GacJS\Gaclib\website\entry\lib\dist\index.html` plus `index.js` exist. Request
`http://localhost:8896/index.html` and require HTTP 200.

IIS normally serves the site, so do not start another server when port 8896 already works. If
the URL is unavailable, serve exactly `GacJS\Gaclib\website\entry\lib\dist` on port 8896 and
retain the launcher PID plus the actual port-owner PID for cleanup:

```powershell
$dist = (Resolve-Path GacJS\Gaclib\website\entry\lib\dist).Path
$fallbackLauncher = Start-Process -FilePath 'npx.cmd' -ArgumentList '--yes','serve@14.2.6','-l','8896','.' -WorkingDirectory $dist -WindowStyle Hidden -PassThru
# Poll http://localhost:8896/index.html for at most 30 seconds, then record the
# unique listener PID from Get-NetTCPConnection -LocalPort 8896 -State Listen.
```

Fail if the fallback cannot return `/index.html` with HTTP 200 on port 8896. A server on a
default port such as 3000, or rooted at another folder, is wrong because later code is hardcoded
to port 8896 and the HTML refers to `/index.js`.

## Phase 4: Verify the GacJS Index Page

### FullControlTest Interaction

1. Ensure no native renderer is running.
2. Start only the core with `/FCT /Http`:

   ```powershell
   $corePath = (Resolve-Path GacUI\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe).Path
   $core = Start-Process -FilePath $corePath -ArgumentList '/FCT','/Http' -WindowStyle Hidden -PassThru
   ```

3. Before opening a browser, wait at most 15 seconds for the core process to remain alive and
   port 8888 to listen. A transient startup delay is not a protocol failure, but an exited core
   or missing listener at the deadline is.
4. Keep only one active `index.html` renderer and open
   `http://localhost:8896/index.html` in the available browser automation surface.
5. For up to 30 seconds, take fresh visible-DOM snapshots until remote controls appear, or fail
   with the last DOM and any JavaScript dialog. Generic browser sessions do not automatically
   receive the test-only idle bindings installed by `Testing_Protocol.js`; do not wait forever
   for a callback that was never registered.
6. Require browser/document title `Complete Control Showcase`, then independently require the
   visible top-level tabs such as `List`, `Control`, `Misc`, and `Window Manager`.
7. Click the unique `Control` tab and require the Control-page content, including `Search:`.
8. Click the Search text box, send a unique short string, and use bounded fresh-DOM polling to
   require that exact string. Inside E2E source, continue to use the renderer idle/blink events
   instead of polling or sleeps.

Right means the remote UI replaces `Starting GacUI HTML Renderer ...`, tab switching changes
the rendered controls, keyboard input is reflected by the core and rendered back into the
page, and no JavaScript alert/fatal overlay appears.

Wrong includes a page stuck at `Starting GacUI HTML Renderer ...`, `Failed to fetch`, a blank
or static shell, a fatal/error mask, a browser alert, missing expected controls, or clicks and
keyboard events that never produce a new remote UI state. Static-file HTTP 200 is not enough.

### RemoteProtocolTest Exit Rendering

Stop the exact FCT core PID, wait up to 10 seconds for it to exit, and wait up to 10 seconds for
port 8888 to stop listening. Do not launch the next variant while HTTP.sys is still unwinding.
Then run:

```powershell
$corePath = (Resolve-Path GacUI\Test\GacUISrc\x64\Debug\RemotingTest_Core.exe).Path
$core = Start-Process -FilePath $corePath -ArgumentList '/Http','/RPT' -WindowStyle Hidden -PassThru
```

Wait at most 15 seconds for the new core to remain alive and port 8888 to listen, then reload a
single `index.html` tab. Use the same 30-second bounded fresh-DOM rule.

1. Require browser/document title `Remote Protocol Test` and visible `File` menu content.
2. Click `File`.
3. Click the unique `self.Close() (InvokeInMainThread)` item.
4. Require the `Do you want to exit?` dialog and click `OK`.
5. Take a fresh visible DOM snapshot after the core exits.

The authoritative right result is this visible page text:

```text
IGacUIRenderer exited due to receiving RequestControllerConnectionStopped.
```

An empty browser console is acceptable; the rendered page is the source of truth. A missing
message, a different unclassified exception, or a core process that remains alive is wrong.

Close the test browser tab and clean all remoting processes before automated tests.

## Phase 5: Run All GacJS Tests and Protocol E2E

Do not manually start `RemotingTest_Core`; the E2E lifecycle owns it. From the monorepo root,
run the repository-level commands in the required order:

```powershell
Set-Location GacJS\Gaclib
yarn build
yarn test
Set-Location ..\..
```

`yarn test` must run the remote-protocol package tests, renderer tests, and the Windows website
protocol E2E suites. The E2E global setup ensures a usable sibling GacUI executable, building it
when required; the suites run serially because they share the stateful server.

Before accepting the result, enumerate the current
`GacJS\Gaclib\website\entry\test\Testing_Protocol_*.js` suites and confirm every suite was
executed and passed, not skipped. At the time this SOP was verified, the website result was
`6 passed` test files and `44 passed` tests; treat those counts as a reference baseline, not a
permanent cap when new tests are added.

Right means all package commands return zero, every current protocol suite appears in the
output, there are no skipped Windows protocol suites, no `[CRASH]` browser dialog is reported,
all test summaries are green, and no `RemotingTest_Core` process remains after teardown.

Wrong means any failed, timed-out, or skipped protocol suite; a GacUI build failure in global
setup; Playwright/IIS connection errors; `[CRASH]`; a test count smaller than the current suite
inventory; or a leaked core process. Do not classify skipped E2E as success merely because
Vitest itself returned zero.

## Failure Triage

- Build failures: use `GacUI\.github\Scripts\Build.log`; stop locked processes and follow the
  GacUI build/debugging guidelines.
- Port or hosting failures: identify the owner of 8888/8896, verify IIS document root and the
  built `lib\dist` files, and avoid running two renderers against the single core session.
- Native transport failures: compare the core `Controls` tree with the renderer `Dom` tree and
  determine whether creation, connection, UI update, input, or shutdown is the first broken
  boundary.
- Browser failures: trust the fresh visible DOM and any alert text. A quiet console does not
  override a visible page error.
- E2E failures: rerun the full `yarn test` after a fix. An isolated suite may be used while
  diagnosing, but it does not replace the final full run.

If a GacUI `.h` or `.cpp` file changes while fixing a failure, rerun Phase 1 and verify the new
Build.log first. Then run the required GacUI unit test through the supported runner before
repeating downstream remoting checks:

```powershell
Set-Location GacUI\Test\GacUISrc
& (Resolve-Path ..\..\.github\Scripts\copilotExecute.ps1) -Mode UnitTest -Executable UnitTest
Set-Location ..\..\..
```

Apply every additional generation, metadata, and test trigger in `GacUI\Project.md` for the
actual changed files. Any required unit-test or generator failure is part of this job and must
be fixed.

Before editing code, reread the affected repository's instructions and relevant design docs.
Do not edit generated GacUI/GacJS packages or any `Import`/`Release` copy directly; fix the
source generator/original repository and regenerate through the documented process. If GacUI
XML resources change, run the required GacUI_Compiler generation before rebuilding. Never add
sleep-based UI synchronization to protocol tests; use the renderer idle/blink events described
in `GacJS\doc\Testing_Protocol.md`.

## Final Cleanup, Git, and Report

1. Close the browser tab. Stop the remoting PIDs started by this job and verify port 8888 is no
   longer held by the test application. If the IIS fallback was needed, stop both its recorded
   listener PID and its launcher PID (or their verified process tree), and only after validating
   process identity and start time against the recorded values. Verify no job-owned listener
   remains on port 8896. Never stop IIS/System or an unrelated port-8896 owner.
2. Run `& (Resolve-Path Tools\Tools\CheckRepo.ps1) CheckAll` as an informational summary, then
   independently inspect every child Git repository. The script catches some failures, assumes
   `master`, and is not an authoritative clean/synchronized success gate.
3. Synchronize the workspace-root `AGENTS.md` from `Tools\MonoRepo.md` if they differ. The root
   file is outside the child Git repositories, so report that fact separately.
4. In every dirty repository, review `git diff`, `git diff --cached`, deleted files, and all
   untracked files. Check for secrets and unintended generated/build artifacts. Stage explicit
   paths repository by repository, commit all legitimate local changes with clear
   repository-specific messages, and use separate commits for unrelated pre-existing work.
5. For every repository that is dirty or ahead of its upstream, record the current branch and
   exact configured upstream, fetch the remote named by that upstream, and rebase onto that
   upstream when behind or diverged. Push the same local branch normally; never force-push.
   `gh` is generally unavailable and is not required.
6. Fetch once more after pushing. Require `git status --porcelain=v1` to be empty in every child
   repository. For each repository committed or pushed by this job, also require
   `git rev-list --left-right --count '@{upstream}...HEAD'` to report exactly `0 0`. Record the
   ahead/behind state of untouched repositories without pulling or otherwise mutating them.
   Do not rely only on `git status -sb` or the exit code from `CheckRepo.ps1`.

Report a compact verification matrix containing:

- GacUI build result and Build.log trailer.
- Conditional GacUI unit-test/generation result when GacUI source or resources changed.
- Native HTTP connection, automation, exit result.
- Native pipe connection, automation, expected-dialog handling, exit result.
- GacJS build and IIS/index reachability.
- FCT render/click/typing result.
- Browser RPT exact exit text.
- Package and protocol E2E file/test counts, with explicit confirmation that none were skipped.
- Cleanup result.
- Each committed repository, commit hash, branch, and push result.
- Every inspected repository's final clean state and upstream comparison, with explicit `0 0`
  confirmation for repositories committed or pushed by this job.
