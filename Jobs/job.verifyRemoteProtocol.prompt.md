You are going to perform an end-to-end, monorepo/cross-repository verification
of the GacUI remote protocol. Exercise every renderer-compatible transport that
the current platform provides, operate real application features through the
renderer, run the complete applicable automated suites, fix any root cause, and
repeat affected downstream verification.

Starting processes or receiving HTTP 200 is not success. A run passes only when
renderer-side input reaches the core, the resulting core state is rendered back,
renderer replacement preserves state, and the intentional shutdown path behaves
as specified below.

Use canonical, case-sensitive `/MiniHTTP` in every command and test. Do not rely
on the legacy `/MiniHttp` compatibility spelling.

## Authority and Workspace

Run from a monorepo root where `GacUI`, `GacJS`, `Tools`, and the other Vczh
Libraries repositories are siblings. Read before acting:

- `AGENTS.md` and `Tools/MonoRepo.md`.
- `Tools/DebugGacUIWithBrowser.md`.
- `Tools/DebugGacUIWithRemoteProtocol.md`.
- `GacUI/Project.md`, `GacUI/.github/copilot-instructions.md`, and every relevant
  build, run, unit-test, computer-use, and debugging guideline they reference.
- `GacJS/AGENTS.md` and `GacJS/doc/Testing_Protocol.md`.
- The repository instructions for every upstream project that needs a fix.

Treat both `DebugGacUIWith*.md` documents as platform-independent entry points.
They own executable paths, build/start commands, browser selection, automation
tools, and current platform support. This job owns the shared operations and
success criteria. Do not duplicate or invent platform startup commands here. If
a guide's platform section says a renderer or scenario is unavailable, record a
documented skip; do not report it as a pass.

The job authorizes fixes needed to make this verification pass. Respect repository
boundaries: never fix generated code or a downstream `Import` copy directly. Fix
the source repository, update its `Release` folder by the platform procedure in
`Tools/MonoRepo.md`, copy the released C++ files (not `IncludeOnly`) into each
downstream `Import`, rebuild, and rerun every affected check.

Work directly on each repository's current branch, normally `master`. Preserve
and review pre-existing local changes. At completion, commit all intended local
changes in every affected repository with honest repository-specific messages
and push each current branch to its configured upstream.

## Required Coverage

Discover availability from the two operation guides, then construct the run
matrix before testing:

| Renderer entry point | Compatible transports to exercise |
| --- | --- |
| GacJS browser renderer | `/Http` wherever the platform guide provides it, and `/MiniHTTP`; never `/Pipe`. |
| Native remote renderer | `/Pipe`, `/Http`, and `/MiniHTTP` wherever the native-renderer guide provides them. |

Use the browser named in the current platform section. A result from Playwright
WebKit is not a Safari result. Run the shared `/RPT` scenario for every matrix
entry. Run the shared `/FCT` scenario for every entry whose platform section
does not declare FullControlTest or general text input unavailable.

Each core invocation has exactly one application argument (`/FCT` or `/RPT`)
and one transport argument. The native renderer receives only the same transport
argument. GacJS is a fetch-based renderer and therefore uses the HTTP endpoint
created by the core; it has no browser-side transport switch.

## Preflight

1. Inventory every child Git repository: branch, upstream, ahead/behind count,
   staged changes, unstaged changes, and untracked files. Keep the inventory so
   temporary verification edits and pre-existing work remain distinguishable.
2. Read the source dispatch in both `RemotingTest_Core` and the native renderer.
   Confirm exact `/MiniHTTP` reaches the async-socket HTTP server/client path,
   not the full HTTP implementation.
3. Build or locate the core, native renderer, GacJS workspace, selected browser,
   browser automation, and platform computer-use tools through the operation
   guides. Install a missing browser runtime if repository instructions allow it.
4. Stop stale processes from earlier attempts, close stale renderer pages, and
   inspect ports `8888` and `8896`. Identify owners before stopping anything;
   never kill an unrelated process merely because it uses a desired port.
5. Record the exact matrix, including documented skips, before the first run.

## Build

Build GacUI through the platform procedure in the operation guides. On Windows,
only `GacUI/.github/Scripts/copilotBuild.ps1` is supported; never call MSBuild
directly. Require the platform's authoritative build log to report success and
zero errors, and require every executable needed by the matrix to exist.

Build GacJS before browser testing or any GacJS test run:

```text
cd GacJS/Gaclib
yarn build
```

Do not treat successful static hosting on port `8896` as protocol readiness.
`index.html` must render the selected core application through port `8888`.

## Per-Run Procedure

Use a separate clean core process for every application, renderer, and transport
combination:

1. Confirm port `8888` is free and no old renderer is active.
2. Start the core with the exact application and transport arguments.
3. Wait for transport readiness, then start or open the renderer by following
   its operation guide.
4. Require the core to remain alive and report a renderer connection. Require
   the renderer to show the application title and content before operating it.
5. Execute the applicable shared scenario below through the renderer surface.
6. Retain console output, screenshots, and fresh state/DOM reads needed to prove
   every transition.
7. Complete the intentional shutdown or stop only the retained processes. Verify
   port `8888` is released before the next run.

All input used to prove the round trip must originate at the renderer surface:
browser mouse/keyboard, native mouse/keyboard, or native renderer `/IO`. Core
`/IO` alone bypasses the renderer-to-core network path and is diagnostic only.
When automation trees are available, use Core `Controls` to corroborate state and
native renderer `Dom` to corroborate rendering.

Never reuse stale bounds across tab, menu, dialog, or renderer transitions.
Never count `Queued`, a listening port, a persistent hidden DOM catalog entry, or
a process that merely stays alive as success. Prefer renderer idle/state events
over arbitrary sleeps; bounded polling delays are acceptable only for process or
port startup.

## Shared `/RPT` Scenario

Perform these exact operations for every renderer/transport combination. The UI
actions are deliberately identical between GacJS and a native renderer.

1. Require the title `Remote Protocol Test` and the `Home`, `DataGrid`, and
   `Document` tabs.
2. On `Home`, click `Click Me!` and require the same button to change to
   `You have clicked!`.
3. Open `DataGrid`, click `Add 3 Rows`, and require three populated rows under
   the `Name`, `Title`, and `Description` headers. Click `Clear` and require the
   rows to disappear while the headers remain.
4. Open `Document`, click `RIGHT NOW`, and require a dialog containing
   `Pretend to be starting!`. Click its `OK` button and require the dialog to
   disappear without a disconnect.
5. While the core remains alive, start a second renderer of the same kind and
   transport: another `index.html` renderer for GacJS or another native renderer
   instance. Require the new renderer to take over, render the existing window,
   and preserve application state: `You have clicked!` must still appear on
   `Home`. Require the old renderer to detach; only one renderer is active.
6. In the replacement renderer, open `File`, click
   `self.Close() (InvokeInMainThread)`, require `Do you want to exit?`, and click
   `OK`.

The button and data-grid changes prove renderer-to-core input followed by
core-to-renderer updates. The document dialog adds document content and modal
handling. Replacement proves reconnection and state transfer. The final sequence
proves menu, invoke-in-main-thread, confirmation, and connection shutdown.

For GacJS, intentional core shutdown must produce a visible terminal state. The
full HTTP implementation renders
`IGacUIRenderer exited due to receiving RequestControllerConnectionStopped.`;
MiniHTTP can render `Failed to fetch` after its socket server closes. Record the
exact text and fail a silently frozen page. For a native renderer, the core and
active renderer must exit; follow its guide for any documented transport-specific
close dialog. An error, disconnect, or renderer exit before the confirmed close
is always a failure.

## Shared `/FCT` Scenario

Perform this scenario wherever the platform guide says FullControlTest text input
is available:

1. Require `Complete Control Showcase` and the expected top-level tabs, including
   `List` and `Control`.
2. On the default list page, click `Add 10 items`. Require items `0` through `9`
   to appear in both visible lists. Click `Clear` and require them to disappear.
3. Open `Control` and select `Document Editor (Ribbon)` if it is not already
   selected. Focus the largest rich-edit area in the center and type a unique,
   short printable marker containing the renderer and transport names. Do not
   use clipboard injection; send real keyboard input.
4. Require the exact marker to be visible. Switch to `List`, switch back to
   `Control`, and require the marker to remain in the rich editor.

Do not replace this scenario with a screenshot-only check. Collection mutation,
tab switching, focus, keyboard input, text rendering, and state persistence are
all required.

## GacJS Automated E2E

After manual browser coverage, run the complete GacJS tests, not only selected
protocol files. Follow `GacJS/AGENTS.md`: `yarn build` must precede `yarn test`,
and `npx vitest` is not a substitute for the full validation command.

The shared lifecycle in
`GacJS/Gaclib/website/entry/test/Testing_Protocol.js` selects the core arguments.
For every browser-compatible transport supported by that platform and harness:

1. Make the lifecycle launch exact `/FCT /Http` or `/FCT /MiniHTTP` as required.
   Prefer an existing transport override; otherwise make the smallest temporary
   change to the lifecycle default.
2. Confirm from the spawned command or core output that the intended server path
   actually ran. A skipped platform suite or unchanged `/Http` launch does not
   verify MiniHTTP.
3. From `GacJS/Gaclib`, run `yarn test` and require the full suite to pass.
4. Repeat the complete suite for the other available browser HTTP transport.

Use the platform-selected real browser for manual compatibility coverage. If the
checked-in automated harness does not support that platform or browser, record
the automated portion as unsupported rather than calling a skipped suite a pass;
the manual shared scenarios remain mandatory.

After the last run, restore the checked-in E2E default to `/FCT /Http` and revert
every temporary browser/transport or diagnostic change. Confirm with Git diff
that no temporary change remains.

## Failure Isolation and Cross-Repo Fixes

Use the matrix to localize failures before editing:

- `/Http` passes but `/MiniHTTP` fails with both renderers: investigate the
  VlppOS async socket, MiniHTTP server, network protocol server, and channel
  server stack first.
- Native MiniHTTP passes but GacJS MiniHTTP fails: investigate HTTP/fetch framing,
  headers, connection lifetime, and browser compatibility.
- GacJS MiniHTTP passes but the native renderer fails: investigate the native
  MiniHTTP client and renderer-side channel path.
- Both transports fail in the same application operation: investigate the GacUI
  core or shared remote protocol.
- Only `/Pipe` fails: investigate the named-pipe path without weakening HTTP
  expectations.

Capture the first wrong response, process exit, exception, or state transition.
Fix the root implementation, add or improve an automated regression test when
practical, and follow all validation triggers in the affected repository.

If VlppOS changes, update its `Release`, propagate the released files to GacUI's
`Import`, rebuild GacUI, rerun the upstream VlppOS tests required by its
instructions, and rerun the complete downstream remote-protocol matrix. If a
GacUI C++ source changes, run the full required GacUI unit-test command in
addition to this job's E2E checks. If GacJS changes, rerun `yarn build` followed
by the complete `yarn test` matrix.

## Cleanup, Commit, Push, and Report

Before committing:

1. Close browser renderers and stop only the retained core/native/static-server
   processes. Confirm port `8888` is released and no test renderer remains.
2. Restore `/FCT /Http` in the GacJS E2E lifecycle and restore protocol logging
   or other temporary diagnostics.
3. Inspect every affected repository's complete diff. Preserve valid pre-existing
   work, separate unrelated changes into honest commits, and do not commit build
   output or temporary logs.
4. Confirm each required test result corresponds to the final source, imports,
   generated release, and E2E configuration.
5. Commit all intended local changes on each current branch and push to its
   configured upstream. If a push is rejected because the upstream advanced,
   fetch and rebase onto that exact upstream without force-pushing. Rerun affected
   verification if the rebase changes source code.

Report:

- Platform, real browser, renderer, application, and transport for every run.
- Each shared operation and its observed result, including renderer replacement
  and shutdown.
- Full automated suite commands and pass counts; list documented skips plainly.
- Root causes and fixes, including every release/import propagation.
- Final clean/dirty status, commit hash, branch, and push result for every
  affected repository.
