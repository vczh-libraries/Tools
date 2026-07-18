You are going to perform an end-to-end, monorepo/cross-repository verification
of the GacUI remote protocol. Exercise every renderer and transport combination
required for the current platform by the matrix, operate real application
features through the renderer, run the complete applicable automated suites, fix
any root cause, and repeat affected downstream verification.

Starting processes or receiving HTTP 200 is not success. A run passes only when
its applicable scenario proves that renderer-side input reaches the core and the
resulting core state is rendered back. Every `/RPT` run must also prove renderer
replacement, state transfer, and the specified intentional shutdown path.

Treat every required renderer, application, and transport tuple as a separate
run. Every readiness, interaction, and applicable replacement or shutdown
checkpoint in that run must pass. If a checkpoint fails, capture the first wrong
observable state, diagnose and fix the root cause, rerun the failed run, and
rerun every downstream run or automated suite that the fix could affect.

Use the executable's canonical, case-sensitive `/MiniHTTP`, `/Http`, and `/Pipe`
arguments in every command and test. Do not rely on the legacy `/MiniHttp`
compatibility spelling. HTTP and named pipe may be capitalized as protocol names
in prose, but `/HTTP` and `/PIPE` are not the command-line arguments.

## Authority and Workspace

Run from a monorepo root where `GacUI`, `GacJS`, `Tools`, and the other Vczh
Libraries repositories are siblings. Read before acting:

- `AGENTS.md` and `Tools/MonoRepo.md`.
- `Tools/DebugGacUIWithBrowser.md`.
- `Tools/DebugGacUIWithRemoteProtocol.md`.
- `GacUI/Project.md`, `GacUI/.github/copilot-instructions.md`, and every relevant
  build, run, unit-test, computer-use, and debugging guideline they reference.
- `GacJS/AGENTS.md`, `GacJS/doc/Protocol.md`, `GacJS/doc/DOM.md`,
  `GacJS/doc/Projects.md`, and `GacJS/doc/Testing_Protocol.md`.
- The repository instructions for every upstream project that needs a fix.

Treat both `DebugGacUIWith*.md` documents as the operation entry points. They own
executable paths, build/start/serve commands, browser selection, UI-driving and
inspection tools, readiness mechanisms, transport-specific close handling, and
current implementation status. This job owns the required forward-looking
matrix, shared operations, and success criteria. Do not duplicate or invent
platform procedures here. Include every renderer entry point in the current
platform's matrix rows, including the forward-looking native remote renderer on
Linux and macOS. A guide that documents a required renderer as not implemented
yet identifies a preflight blocker; it does not remove the row from the matrix
and must not be reported as a pass or a documented skip.

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

Select every row for the current platform, then expand each listed transport
into a separate run:

| Platform | Renderer entry point | Required transport arguments |
| --- | --- | --- |
| Linux | GacJS browser renderer | `/MiniHTTP` |
| Linux | Native remote renderer | `/MiniHTTP` |
| macOS | GacJS browser renderer | `/MiniHTTP` |
| macOS | Native remote renderer | `/MiniHTTP` |
| Windows | GacJS browser renderer | `/MiniHTTP`, `/Http` |
| Windows | Native remote renderer | `/MiniHTTP`, `/Http`, `/Pipe` |

This cross-platform matrix is normative and does not shrink to match today's
implementation status. In particular, a Linux or macOS run must retain its
native `/MiniHTTP` row even while the corresponding native renderer remains
future work. `/Pipe` is Windows-only, and the full `/Http` implementation is used
only by the Windows rows above.

Use the exact browser selected by the operation guide and record its actual name;
do not relabel an engine-compatible substitute as a different browser. Run the
shared `/RPT` manual scenario unchanged and in full for every transport in every
selected current-platform matrix row. Do not substitute a transport-specific
smoke test or omit an action. The identical scenario has two simultaneous
purposes: it proves that the GacUI remote protocol round trip works, and, by
repeating it over each transport, that each selected network protocol
implementation works. Only platform-specific startup, readiness, UI-driving,
state-inspection, and shutdown mechanics may differ as directed by the operation
guides.

The shared `/FCT` scenario is additional coverage. Run it for every transport in
every selected current-platform row whose guide does not declare FullControlTest
or general text input unavailable.

Each core invocation has exactly one application argument (`/FCT` or `/RPT`)
and one transport argument. The native renderer receives only the same transport
argument. GacJS is a fetch-based renderer and therefore uses the HTTP endpoint
created by the core; it has no browser-side transport switch.

## Preflight

1. Inventory every child Git repository: branch, upstream, ahead/behind count,
   staged changes, unstaged changes, and untracked files. Keep the inventory so
   temporary verification edits and pre-existing work remain distinguishable.
   Review every dirty worktree before testing; an unknown change can invalidate
   the result even when the protocol appears to pass.
2. Read the source dispatch in both `RemotingTest_Core` and the native renderer.
   Confirm exact `/MiniHTTP` reaches the async-socket HTTP server/client path,
   not the full HTTP implementation.
3. Build or locate the core, native renderer, GacJS workspace, selected browser,
   browser automation, and platform computer-use tools through the operation
   guides. Install a missing browser runtime if repository instructions allow it.
4. Close stale renderer pages and identify stale test processes from earlier
   attempts before stopping them. Inspect ports `8888` and `8896`, identify every
   owner, and never stop an unrelated process merely because it uses a desired
   port.
5. Require port `8888` to be free before each new core run. Confirm that no old
   renderer can take over the single-renderer session. For browser runs, confirm
   that port `8896` serves the intended GacJS build rather than a different site.
6. Record the exact current-platform matrix, including the renderer, actual
   browser when applicable, application, transport, preflight blockers, and
   supplementary scenario skips before the first run. Prepare a place to retain
   the evidence and result of every checkpoint.

Wrong preflight state includes an unknown owner of port `8888`, multiple stale
core or renderer processes, a stale browser renderer, an unintended site on port
`8896`, an unreviewed dirty worktree, or a matrix entry whose actual transport
dispatch has not been confirmed. Resolve the ambiguity before testing.

## Build

Build GacUI through the procedure in the operation guides. Require the build
command to succeed, the authoritative build result or log to be complete and
report zero errors, any unfinished-build marker used by that procedure to be
absent, and every core or native-renderer artifact needed by the matrix to exist.
An old executable left behind by a failed build is not a valid build result.

Build GacJS before browser testing or any GacJS test run:

```text
cd GacJS/Gaclib
yarn build
```

Require `yarn build` to return zero and every workspace package that is expected
to build to report success. Require both
`GacJS/Gaclib/website/entry/lib/dist/index.html` and `index.js` to exist. Serve
exactly that `dist` directory on port `8896` by following the browser operation
guide, then require `/index.html` to return HTTP 200.

This proves only that the current static build is reachable. It does not prove
protocol readiness. A different site root or default port is wrong because the
page loads `/index.js` and connects to the core through port `8888`.

## Manual Verification: Per-Run Checklist

Use a separate clean core process for every application, renderer, and transport
combination. Do not combine two matrix entries into one process lifetime.

### 1. Establish a Clean Run

1. Select one recorded matrix row. Record the exact application and transport
   arguments that the core will receive. For a native-renderer run, record that
   the renderer will receive the same transport and no application argument.
2. Close the previous renderer and stop only processes retained from the previous
   run. Require port `8888` and the single-renderer session to be released before
   continuing.
3. Start the core by following the appropriate operation guide. Retain its exact
   process identity and output. Use the guide's readiness signal with a bounded
   deadline; fail immediately if the process exits or the selected transport
   never becomes ready.
4. Start or open exactly one renderer through its operation guide. Do not leave a
   stale browser page or native renderer able to take over the session.

### 2. Prove a Live Core-to-Renderer Connection

1. With a bounded deadline, take fresh visible-state reads until the selected
   application replaces the renderer's startup state. Require the exact window
   title and the initial controls listed in the applicable shared scenario.
2. Require the core to stay alive and complete a renderer connection. Require the
   renderer to stay alive and responsive. A server-created message or listening
   port corroborates readiness but does not prove a live application.
3. When the operation guide provides independent core and renderer state trees,
   require both to be nonempty, describe the same title and application, and show
   the expected controls in their active trees. Text retained only in a hidden or
   historical element catalog is not rendered state.
4. For GacJS, require the remote UI to replace
   `Starting GacUI HTML Renderer ...`. Fail a blank or static shell, fatal/error
   mask, browser alert, premature `Failed to fetch`, missing controls, or a page
   that serves successfully but never becomes interactive.
5. Retain the core connection evidence and the renderer's fresh visible state.
   Capture a screenshot when text/state evidence alone is ambiguous.

### 3. Apply This Rule to Every Manual Action

1. Read fresh active UI state before acting. Locate the enclosing interactive
   control, not merely a child text or a matching hidden element. Recompute its
   current bounds after every tab, menu, dialog, or renderer transition.
2. Send the proving input through the renderer surface by the method selected in
   its operation guide. Core-side input is useful for diagnosis, but by itself it
   bypasses the renderer-to-core path and cannot pass a round-trip checkpoint.
   For typing checks, send real keyboard input rather than clipboard injection.
3. Wait for the renderer's idle/state signal when the chosen tool exposes one.
   Otherwise use bounded fresh-state polling for a manual session. Never add an
   arbitrary sleep as UI synchronization in automated tests.
4. Read fresh active UI state after the action. Require the exact expected new
   state and the disappearance of any menu, dialog, or data that should have
   closed or cleared. When independent state trees are available, corroborate the
   same transition in both.
5. After every non-shutdown action, require the core and active renderer to remain
   alive, the UI to remain responsive, and no new alert, fatal overlay, transport
   error, or disconnect to appear.

An accepted or queued input response, HTTP 200, a listening port, an unchanged
screenshot, a raw string in a hidden catalog, or processes that merely remain
alive is never sufficient. The expected live state transition is the proof.

### 4. Finish and Reset the Run

1. Complete the scenario's intentional shutdown when one is specified. Otherwise
   close the renderer and stop only the exact retained processes for that run.
2. Verify the expected terminal state or process exits. Preserve the first wrong
   response, exception, exit, alert, or state transition if shutdown fails.
3. Require port `8888` to be released and no renderer from the completed run to
   remain active before starting the next matrix row.

## Shared `/RPT` Manual Scenario

Perform every subsection for every required renderer/transport combination. The
same UI operations and observable criteria apply to GacJS and native renderers;
only the driving and inspection mechanics come from their operation guides.

### A. Verify the Initial Application

1. Require the exact title `Remote Protocol Test`.
2. Require the `Home`, `DataGrid`, and `Document` tabs and the `File` menu to be
   present in the active UI. Do not infer the application only from core output.
3. Require `Home` to expose `Click Me!`. There must be no startup mask, error
   overlay, unexpected modal dialog, or disconnected renderer.

### B. Prove a Button Event and State Update

1. Make `Home` active and read fresh state containing `Click Me!`.
2. Activate that exact button through the renderer surface.
3. Require the active button text to become exactly `You have clicked!`; require
   `Click Me!` to be absent from that active button state.
4. Keep `You have clicked!` as the state-transfer sentinel for the renderer
   replacement check. Do not restart the core before that check.

This transition proves renderer-to-core event delivery followed by a
core-to-renderer property update. A successful click call without the new text
is a failure.

### C. Prove Collection Mutation and Clearing

1. Activate `DataGrid`. Require the `Name`, `Title`, and `Description` headers,
   `Add 3 Rows`, and `Clear` in the current active view. On this fresh application
   run, require no populated data rows before adding them.
2. Activate `Add 3 Rows` exactly once through the renderer.
3. Require exactly three data rows. Each row must contain a nonempty value under
   each of the three headers; the headers alone or three empty row containers do
   not pass.
4. Activate `Clear` through the renderer.
5. Require all three data rows and their cell values to disappear while the
   `Name`, `Title`, and `Description` headers and grid control remain rendered.

When independent state trees are available, require the same populated and
cleared states in both active trees. A stale element catalog containing removed
cell strings does not mean the rows are still rendered.

### D. Prove Document Content and Modal Handling

1. Activate `Document`. Require document content and the interactive text
   `RIGHT NOW` in the active view.
2. Activate `RIGHT NOW` through the renderer.
3. Require an active modal dialog containing exactly
   `Pretend to be starting!`. The base window must not disappear or disconnect.
4. Locate the `OK` belonging to that active dialog, activate it through the
   renderer, and require the dialog text and modal surface to disappear.
5. Require the `Document` view to be active and responsive again, with the core
   and renderer still connected.

### E. Prove Renderer Replacement and State Transfer

1. Keep the same core alive. Start a second renderer of the same kind and
   transport by following its operation guide: another `index.html` renderer for
   GacJS or another native-renderer instance.
2. With bounded fresh-state reads, require the second renderer to take over the
   session, show `Remote Protocol Test`, and render live application content.
3. In the second renderer, activate `Home` and require
   `You have clicked!`. This must be transferred state from subsection B, not a
   newly repeated click.
4. Confirm through the guide's connection evidence or the old surface's detached
   state that the first renderer is no longer active. Exactly one renderer may
   drive the core; two live-looking surfaces are not proof of successful takeover.
5. Re-read all active state and recompute all interaction targets in the second
   renderer. Never reuse coordinates or handles from the first renderer.

### F. Prove Menu, Confirmation, and Intentional Shutdown

Perform the shutdown through the replacement renderer:

1. Activate `File` and require its menu to be actively rendered.
2. From fresh menu state, locate and activate exactly
   `self.Close() (InvokeInMainThread)`. A matching string outside the active menu
   is not a usable menu item.
3. Require an active confirmation dialog containing exactly
   `Do you want to exit?`. The core, active renderer, and input/state channel must
   remain usable through discovery of the confirmation button; an earlier
   disconnect is a failure.
4. Locate the `OK` belonging to the confirmation dialog and activate it through
   the replacement renderer.
5. Require the core to exit within a bounded deadline.

For GacJS, require the active replacement page to enter a visible terminal state.
The full HTTP implementation must render exactly:

```text
IGacUIRenderer exited due to receiving RequestControllerConnectionStopped.
```

MiniHTTP may render `Failed to fetch` only after the confirmed close has shut down
its socket server. Record the exact terminal text. A silently frozen application,
missing terminal state, different unclassified exception, alert, or core that
remains alive is wrong; a quiet browser console does not override visible failure.

For a native renderer, require the core and active renderer to exit. Follow the
operation guide for any explicitly documented transport-specific post-close
handling. Such handling is acceptable only after the confirmed close; any error,
disconnect, or renderer exit before confirmation is a protocol failure.

The complete `/RPT` run proves initial rendering, renderer-to-core input,
core-to-renderer updates, collection mutation, modal operation, reconnection and
state transfer, menu invocation, confirmation, and connection shutdown. Missing
any subsection means the matrix row did not pass.

## Shared `/FCT` Manual Scenario

Perform this scenario wherever the operation guide says FullControlTest and
general text input are available.

### A. Verify the Initial Application

1. Require the exact title `Complete Control Showcase`.
2. Independently require the top-level `List`, `Control`, `Misc`, and
   `Window Manager` tabs. The title alone is not enough.
3. Require the startup state to be replaced by live controls and require no
   alert, fatal/error overlay, or disconnect.

### B. Prove Two Collection Views Update and Clear

1. Make `List` and its default `TextList` page active. Require both visible list
   controls and the `Add 10 items` and `Clear` buttons. On a fresh core, require
   numbered items `0` through `9` to be absent before the action.
2. Activate `Add 10 items` exactly once through the renderer.
3. Require the complete sequence `0` through `9` in each of the two visible
   lists. Each list must contain all ten items; seeing the sequence in only one
   list does not pass.
4. Activate `Clear` through the renderer.
5. Require all ten numbered items to be absent from both active lists while both
   list controls, `Add 10 items`, and `Clear` remain rendered and usable.

### C. Prove Focus, Keyboard Input, and Persistent Text Rendering

1. Activate the top-level `Control` tab, then activate
   `Document Editor (Ribbon)` if it is not already the current subpage. Require
   `Search:`, its associated text box, and the large central rich-edit surface.
2. Focus the text box associated with `Search:` and type a unique, short,
   printable search marker containing the renderer and transport names through
   real renderer keyboard input. Require that exact marker to be visibly rendered
   in the text box with no missing, duplicated, or reordered characters.
3. Focus the large central rich-edit surface, not the Search text box. Type a
   different unique, short, printable marker through real renderer keyboard
   input. Do not paste either marker or inject it through the core.
4. Require the exact rich-edit marker to be visibly rendered with no missing,
   duplicated, or reordered characters.
5. Switch to top-level `List` and require its content to render. Switch back to
   `Control`, restore `Document Editor (Ribbon)` if necessary, and require both
   the search marker and rich-edit marker to remain without retyping them.
6. Require the core and renderer to remain connected and responsive throughout
   both typing operations and the tab changes.

Do not replace this scenario with a screenshot-only check. It requires collection
mutation in two views, clearing, tab and subpage navigation, focus, real keyboard
input in two text controls, text rendering, and application-state persistence.
Missing any observable transition means the `/FCT` matrix row did not pass.

## GacJS Automated E2E

After manual browser coverage, run the complete GacJS tests, not only selected
protocol files. Follow `GacJS/AGENTS.md`: `yarn build` must precede `yarn test`,
and `npx vitest` is not a substitute for the full validation command.

Before the first automated run:

1. Close the manual browser renderers and stop every manually started core. The
   automated lifecycle owns its core process; a manually retained core can make
   the suite exercise the wrong process or transport.
2. Enumerate the current
   `GacJS/Gaclib/website/entry/test/Testing_Protocol_*.js` files and record which
   suites the selected harness supports. Use this live inventory when evaluating
   the output; do not rely on an old fixed file or test count.
3. Record each browser-compatible transport that the operation guide and checked-
   in harness support. An unsupported automated combination is a documented skip,
   not a pass, and does not remove its mandatory manual coverage.

The shared lifecycle in
`GacJS/Gaclib/website/entry/test/Testing_Protocol.js` selects the core arguments.
For every browser-compatible transport supported by the selected harness:

1. Make the lifecycle launch exact `/FCT /Http` or `/FCT /MiniHTTP` as required.
   Prefer an existing transport override; otherwise make the smallest temporary
   change to the lifecycle default.
2. Confirm from the spawned command or core output that the intended server path
   actually ran. An unchanged `/Http` launch does not verify MiniHTTP, even if all
   tests pass.
3. From `GacJS/Gaclib`, run `yarn build` and require it to pass. Then run
   `yarn test` and require the complete workspace suite, not only protocol files,
   to pass.
4. Reconcile the output with the live suite inventory. Require every applicable
   protocol suite to be collected, executed, and passed, with no unexpected skip,
   failure, or timeout. A zero test-runner exit code with skipped protocol E2E is
   not success.
5. Require all package summaries to be green, no `[CRASH]` browser dialog, no
   core build/setup, hosting, browser-connection, or Playwright error, and no
   leaked core process after lifecycle teardown.
6. Record the executed file count and test count for this run, then repeat the
   complete build and test suite for the other supported browser HTTP transport.

An isolated protocol suite may be used to diagnose a failure, but after any fix
rerun `yarn build` followed by the complete `yarn test` for every affected
transport. Diagnostic success never replaces the final full-suite result.

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

For every failure, identify the first broken boundary before editing: build,
server creation, renderer connection, initial state transfer, renderer-originated
input, core mutation, rendering, tab/menu/modal transition, renderer replacement,
or shutdown. Preserve the first wrong response, process exit, exception, alert,
or state transition instead of diagnosing from a later cascade.

- For a build failure, use the authoritative build result selected by the
  operation guide and reject stale artifacts from an earlier successful build.
- For a port or hosting failure, identify the owner, verify the exact GacJS
  `dist` root and required files, and ensure a stale renderer is not taking over
  the single-renderer session.
- For a native-renderer failure, compare independent core and active-renderer
  state when the guide exposes it and find the first point where they disagree.
- For a browser failure, trust the fresh visible page state and any alert text.
  A quiet console does not override a visible error or frozen application.
- For an automated E2E failure, an isolated suite can shorten diagnosis, but the
  final result must come from the complete build-and-test matrix.

Fix the root implementation, add or improve an automated regression test when
practical, and follow all validation triggers in the affected repository. Never
weaken a shared success criterion to accommodate one transport or renderer.

If VlppOS changes, update its `Release`, propagate the released files to GacUI's
`Import`, rebuild GacUI, rerun the upstream VlppOS tests required by its
instructions, and rerun the complete downstream remote-protocol matrix. If a
GacUI C++ source changes, run the full required GacUI unit-test command in
addition to this job's E2E checks. If GacJS changes, rerun `yarn build` followed
by the complete `yarn test` matrix.

## Cleanup, Commit, Push, and Report

Before committing:

1. Close every browser renderer. Stop only the retained core, native-renderer,
   and job-owned static-server processes. Confirm port `8888` is released and no
   test renderer remains. Stop a port-`8896` server only when this job started and
   retained it; do not stop an unrelated site owner.
2. Restore `/FCT /Http` in the GacJS E2E lifecycle and restore protocol logging,
   browser/transport overrides, and every other temporary diagnostic change.
   Confirm with complete diffs that none remain.
3. Compare workspace-root `AGENTS.md` with `Tools/MonoRepo.md` and synchronize the
   root copy if they differ, as required by the monorepo instructions.
4. Inspect every affected repository's complete staged, unstaged, deleted, and
   untracked diff. Preserve valid pre-existing work, separate unrelated changes
   into honest commits, check for secrets, and do not commit build output,
   screenshots, temporary logs, or other verification artifacts.
5. Confirm each required result corresponds to the final source, generated files,
   release/import copies, GacJS build, and restored E2E configuration. A result
   obtained before a later source or generated-file change is stale.
6. Commit all intended local changes on each current branch and push that same
   branch to its configured upstream. If a push is rejected because the upstream
   advanced, fetch and rebase onto that exact upstream without force-pushing or
   changing branch names. Rerun affected verification if the rebase changes
   source code.
7. Require every affected repository to have the intended final clean/dirty state.
   For each repository committed or pushed by this job, fetch once more and
   require its local branch and configured upstream to have zero commits on both
   sides of the comparison.

Report:

- A matrix row for every required current-platform run: platform, actual browser
  when applicable, renderer, application, transport, readiness, result, preflight
  blocker, and any supplementary scenario skip.
- Each shared manual checkpoint and its observed state, including button update,
  collection add/clear, modal handling, text input/persistence, renderer
  replacement, exact terminal state, and shutdown.
- GacUI and GacJS build results and required artifact checks.
- Full automated suite commands, transport selected, executed file/test counts,
  teardown result, and all documented or unexpected skips.
- Root causes and fixes, including every release/import propagation.
- Cleanup and port-release result.
- Final clean/dirty status, commit hash, branch, configured upstream,
  ahead/behind comparison, and push result for every affected repository.
