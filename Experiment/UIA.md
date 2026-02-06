# UI Automation helper scripts (Experiment/)

This folder contains small PowerShell scripts for inspecting UI Automation (UIA) trees and driving simple UI actions.
They are designed to be composable: list a window → capture/overlay it → perform input operations.

## General notes

- Prefer running in STA when interacting with UIA/COM:
  - `powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File ...`
- UIA is provider-driven: if an application doesn’t expose rich semantics, many nodes will show up as generic containers
  like `Pane` with empty `Name`.
- When UIA data is poor, screenshots can still be very useful:
  - A snapshot gives human-verifiable ground truth (what the user actually sees).
  - With additional vision/OCR, you can sometimes infer labels/regions and drive actions by coordinates.
  - This is less robust than UIA (themes/DPI/layout changes break coordinate targeting), but it’s a practical fallback
    for custom-drawn or poorly-instrumented UIs.
- Cross-integrity UIA is restricted (UIPI):
  - If the target application is elevated (high integrity) and the inspector is not, the UIA tree is often shallow and
    missing important children (e.g., Task Manager tabs).
  - Run the inspector as Administrator to inspect elevated apps, or run the target app non-elevated.

## Script interfaces

### `UIA_List.ps1`

Lists visible top-level windows, or dumps a UIA subtree for one window.

- List windows:
  - `.\Experiment\UIA_List.ps1`
  - Output columns: `Name`, `RuntimeId`
  - If the script is not elevated, it also outputs `NeedsAdmin` (best-effort: `True` often means the window belongs to
    an elevated process).

- Dump a tree for one window:
  - `.\Experiment\UIA_List.ps1 -RuntimeId <id>`
  - By default outputs pretty JSON to stdout.
  - `-RawTree` outputs a raw `[pscustomobject]` tree (useful for piping / programmatic use).

Important parameters:
- `-RuntimeId <id>`: selects a top-level window by UIA RuntimeId.
- `-View Raw|Control|Content`: selects UIA view (`TreeWalker`) for traversal.
- `-MaxDepth <n>`: recursion depth limit; when exceeded, `Children` becomes `$null`.
- `-MaxChildren <n>`: limits number of expanded siblings per node (0 = unlimited).
- `-IncludeInvisible`: includes offscreen/zero-sized elements that are otherwise skipped.
- `-RawTree`: returns PowerShell objects instead of JSON.

Tree node shape (dump mode):
- `RuntimeId`: UIA runtime id joined by dots.
- `Type`: formatted as `<FrameworkId>:<ControlType>:<ClassName>`.
- `Text`: best-effort text (`Name`, `ValuePattern`, `LegacyIAccessiblePattern`).
- `AutomationId`: UIA automation id (string).
- `Bounds`: `{ X, Y, Width, Height }` in screen coordinates.
- `Children`:
  - `$null` means expansion intentionally stopped (depth limit),
  - `[]` means expanded and there were no children.

### `UIA_Capture.ps1`

Captures a screenshot of a visible top-level window by UIA RuntimeId.

- Basic capture:
  - `.\Experiment\UIA_Capture.ps1 -RuntimeId <id>`
  - Deletes `UIA_Capture.png` at startup, then writes a new one on success.
  - Prints the full path on success; prints nothing and exits non-zero on failure.

- With overlay:
  - `.\Experiment\UIA_Capture.ps1 -RuntimeId <id> -Overlay`
  - Calls `UIA_List.ps1 -RawTree` to get bounds, draws a green rectangle for each node, and prints its `RuntimeId`
    (8pt text) at the rectangle’s top-left corner.

- In-memory output:
  - `.\Experiment\UIA_Capture.ps1 -RuntimeId <id> -Base64`
  - Outputs a Base64-encoded PNG instead of writing `UIA_Capture.png`.

Overlay coordinate rule:
- UIA bounds are in screen coordinates.
- The capture image’s origin is the window’s `BoundingRectangle.X/Y`.
- A node’s rectangle is drawn at `(node.X - window.X, node.Y - window.Y)`.

### `UIA_Op.ps1`

Executes a single input operation (mouse/keyboard) described by a string.

Usage:
- `.\Experiment\UIA_Op.ps1 "<Operation>"`

Operations:
- `Move:x:y`: move mouse to screen (x,y).
- `Left:x:y` / `Right:x:y`: move to (x,y) and click.
- `Drag:x1:y1:x2:y2`: drag from (x1,y1) to (x2,y2) with left button.
- `Type:<text>`: types Unicode text into the currently focused control.
- `Press:Key1:Key2:...`: press keys down in order, then release in reverse order.
  - Example: `Press:Ctrl:C`
- `ListKey`: prints all supported key names plus aliases.

Key names:
- Primary source is `System.Windows.Forms.Keys` (case-insensitive).
- Common aliases are supported (e.g. `Ctrl`, `Alt`, `Shift`, `Win`, `Enter`, `Esc`, `PgUp`, `PgDn`, `Del`).

Reliability notes:
- `SendInput` calls are checked; on partial injection the script throws with `GetLastError`.
- Mouse move uses injected absolute move (virtual desktop), which avoids “click ignored unless moved” issues on some
  systems.

## Repeatable test: “I love .NET”

Goal: find Notepad, clear all text, type `I love .NET`, then verify by capture.

1) Find the Notepad window RuntimeId
- Call `UIA_List.ps1` and pick the row whose `Name` contains `Notepad`.

2) Focus the text editor reliably
- Use `UIA_List.ps1 -RuntimeId <id> -RawTree` to obtain the UIA tree with bounds.
- Choose a large editable surface node:
  - Prefer a node whose `Type` contains `:Document:` or `:Edit:` and has valid `Bounds`.
  - If there are multiple, choose the one with the largest `Width * Height`.
- Compute a “safe click point” inside the bounds:
  - `clickX = Bounds.X + paddingX`
  - `clickY = Bounds.Y + paddingY`
  - Choose paddings so the point is inside the client area (not on title bar/menu/scrollbar).

3) Click to focus
- Call `UIA_Op.ps1 "Left:clickX:clickY"`.

4) Select all and delete
- Call `UIA_Op.ps1 "Press:Ctrl:A"`.
- Call `UIA_Op.ps1 "Press:Delete"`.

5) Type the new content
- Call `UIA_Op.ps1 "Type:I love .NET"`.

6) Verify
- Call `UIA_Capture.ps1 -RuntimeId <id>` and visually confirm the content (title bar should be black = focused).
- Optional: use UIA `TextPattern` on Notepad’s document to programmatically read the text.
