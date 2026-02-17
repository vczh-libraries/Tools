# Specification

Root folder of the project is `REPO-ROOT/Copilot/Agent`.
Read `README.md` to understand the whole picture of the project as well as specification organizations.

## Related Files

- `assets`
  - `jobs.css`
  - `jobs.js`
  - `jobs.html`
  - `jobTracking.css`
  - `jobTracking.js`
  - `jobTracking.html`

### jobs.css

Put jobs.html specific css file in jobs.css.

### jobs.js

Put jobs.html specific javascript file in jobs.js.

### jobs.html

This page should only be opened by `/index.html`'s "Jobs" button in order to obtain the working directory.
If it is directly loaded, it should redirect itself to `/index.html`.
To tell this, find the `wb` argument in the url passing from `/index.html`.

Call `api/copilot/job` to obtain jobs definition.
- `grid` defines the `matrix part` of the UI.
- `jobs` offers details for each job in order to render the tracking UI.

The webpage is splitted to two part:
- The left part is `matrix part`.
- The right part is `user input part`.
- The left and right part should always fill the whole webpage.
- Between two parts there is a bar to drag vertically to adjust the width of the right part which defaults to 800.

The look-and-feel must be similar to `/index.html`, but DO NOT share any css file.

### Matrix Part

It renders a larget table of buttons according to `grid`.
The first row is a title "Available Jobs", followed by a button "Stop Server" at the very right doing exactly what the button in `/index.html` does.
The first column shows `keyword`.
The second column shows "automate" buttons only when `automate` is true.
All other columns are for `grid[index].jobs`, `name` will be the text of the button.

If any cell has no button, leave it blanks.
The table is supposed to fill all `matrix part` but leave margins to the border and between buttons.
The table is also rendered with light color lines.

Font size should be large enough to reduce blanks, prepare to fill about 1000x1000 or a even larger space. The complete content can be read in `jobsData.ts`, it helps to guess a font size as it will but rarely changes.

Besides automate buttons, other buttons renders as buttons but it works like radio buttons:
- Clicking a job button renders an exclusive selected state.
  - Its `jobName` (not the `name` in the button text) becomes `selectedJobName`.
  - The "Start Job" button is enabled.
  - Only when `requireUserInput` is true, the text box is enabled
- Clicking a selected job button unselect it
  - The "Start Job" button is disabled.
  - The text box is disabled.

#### Actions of Automate Button

(to be editing...)

### User Input Part

There is a text box fills the page. Disabled by default.

At the bottom there are buttons aligned to the right:
- "Start Job: ${selectedJobName}" or "Job Not Selected". Disabled by default.

#### Clicking Start Job Button

When I hit the "Start Job" button, it jumpts to `/jobTracking.html`.
The selected job should be brought to `/jobs.html`.

(to be editing...)

### jobTracking.css

Put jobTracking.html specific css file in jobTracking.css.

### jobTracking.js

Put jobTracking.html specific javascript file in jobTracking.js.

### jobTracking.html

This page should only be opened by `/jobs.html`'s "Jobs" button in order to obtain the working directory.
If it is directly loaded, it should redirect itself to `/index.html`.
To tell this, find the `jobId` argument in the url passing from `/jobs.html`.

Call `api/copilot/job` to obtain the specified job's definition.

The webpage is splitted to two part:
- The left part is `job part`.
- The right part is `session response part`.
- The left and right part should always fill the whole webpage.
- Between two parts there is a bar to drag vertically to adjust the width of the right part which defaults to 800.

The look-and-feel must be similar to `/index.html`, but DO NOT share any css file.

### Job Part

You can find the `Job` definition in `jobsData.ts`.
`Job.work` is a simple control flow AST.
Render it like a flow chart expanding to fill the whole `job part`.

Read `JobsData.md` to find definitions of `Work` and draw a flow chart:
- `TaskWork`: Display the task id.
- `SequentialWork`: Draw a sequencial flow chart, showing these works are executed one after another.
- `ParallelWork`: Draw a parallel flow chart, showing these works are executed at the same timne.
- `LoopWork`: Draw a looping flow chart, but each condition should be drawn like a `AltWork`.
- `AltWork`: Draw a branching flow chart, the condition will be a node as well.

#### Flow Chart Rendering Note

**TEST-NOTE-BEGIN**
No need to create unit test to assert the chart is in a correct layout.
Ensure every `TaskWork` as a node in the flow chart.
**TEST-NOTE-END**

**TASK**: After implementing the rendering, clean this section up leaving only important information. Implementation details could be read from source code so they are not needed, but if there is any critical implementation decision, the decision still stay.

Use **ELK.js** (`elkjs` npm package, loaded via CDN `elk.bundled.js`) for automatic graph layout, combined with **DOM `<div>` nodes** for rendering and **SVG `<path>` edges** for connections.

##### Why ELK.js + DOM

- ELK's `layered` algorithm natively handles DAGs, back-edges (loops), fork/join (parallel), and branching (if-else).
- Using real DOM `<div>` elements (not SVG `foreignObject` or canvas) allows full HTML interactivity inside each node — buttons, expanded content, sub-UIs.
- When a node is clicked and expands/collapses, its `width`/`height` in the ELK graph is updated and `elk.layout()` is re-run to recalculate all positions. All node `<div>` positions and edge `<path>` elements are then updated (animated if desired).

##### Architecture

The flow chart container has `position: relative`. Inside it:
- Each flow chart node is a `<div>` with `position: absolute; left: Xpx; top: Ypx` based on ELK layout output.
- An SVG overlay (`<svg>` covering the full container, `pointer-events: none`) draws edges as `<path>` elements between nodes. Use the edge bend points returned by ELK to draw orthogonal or spline routes.
- Edge labels (e.g. `"true"` / `"false"`) are rendered via SVG `<text>` or as small absolutely-positioned `<div>` elements.

##### Mapping Work Types to ELK Graph

Recursively convert the `Work<number>` AST into ELK graph nodes and edges. Each `Work` node gets a unique ELK `id` (e.g. derived from its path in the AST or `workIdInJob` for `TaskWork`).

- **`TaskWork`** (`kind: "Ref"`):
  - A single leaf node displaying `taskId`.
  - The node div may show additional info (model override, status) when expanded.

- **`SequentialWork`** (`kind: "Seq"`):
  - Render each child in `works[]` as its own sub-graph.
  - Connect them with sequential edges: `works[0] → works[1] → works[2] → ...`
  - If `works` is empty, render a single "pass" node indicating immediate success.

- **`ParallelWork`** (`kind: "Par"`):
  - Create a **fork node** (small diamond or bar) and a **join node**.
  - Each child in `works[]` gets an edge from the fork node and an edge to the join node.
  - ELK will lay out the children side-by-side between the fork and join.
  - If `works` is empty, render a single "pass" node indicating immediate success.

- **`LoopWork`** (`kind: "Loop"`):
  - Structure: `[preCondition] → body → [postCondition] → (back-edge to preCondition or body)`
  - If `preCondition` is defined, render it as an `AltWork`-style diamond node at the entry. The first tuple element (`boolean`) indicates whether `true` means "enter loop" or "skip loop". Label the edges accordingly (e.g. "enter" / "skip"). The second tuple element is the condition `Work` sub-graph.
  - If `postCondition` is defined, render it the same way after the body. The back-edge goes from `postCondition` back to the entry (before `preCondition` if it exists, or before body otherwise). ELK handles back-edges automatically as feedback edges routed around the graph.
  - If `body` fails, the loop exits — no edge from body-failure to postCondition.

- **`AltWork`** (`kind: "Alt"`):
  - Render `condition` as a diamond-shaped decision node.
  - Edge labeled `"true"` goes to `trueWork` (if defined), edge labeled `"false"` goes to `falseWork` (if defined).
  - Both branches converge at a **merge node** after completion.
  - If `trueWork` or `falseWork` is undefined, the `"true"` or `"false"` edge goes directly to the merge node (immediate success for that branch).

##### ELK Layout Options

```js
const graph = {
  id: "root",
  layoutOptions: {
    "elk.algorithm": "layered",
    "elk.direction": "DOWN",
    "elk.edgeRouting": "ORTHOGONAL",
    "elk.layered.spacing.nodeNodeBetweenLayers": "40",
    "elk.spacing.nodeNode": "20"
  },
  children: [ /* nodes with { id, width, height, labels } */ ],
  edges: [ /* { id, sources: [sourceId], targets: [targetId], labels? } */ ]
};
const layout = await elk.layout(graph);
```

Each node in `layout.children` will have computed `x`, `y` coordinates. Each edge in `layout.edges` will have `sections[].startPoint`, `sections[].endPoint`, and `sections[].bendPoints` for drawing the SVG path.

##### Node Click Expand/Collapse

Each node `<div>` has a collapsed state (showing just the type label, e.g. task id) and an expanded state (showing additional content).
On click:
1. Toggle the node's expanded state.
2. Update the corresponding ELK node's `width` and `height` to match the new content size (measure the DOM element).
3. Re-run `await elk.layout(graph)`.
4. Update all node `<div>` positions (`left`, `top`) and redraw all SVG edge `<path>` elements.

##### Visual Conventions

- **TaskWork nodes**: Rounded rectangle.
- **Condition/decision nodes** (in `AltWork`, `LoopWork` pre/post conditions): Diamond shape (achieved via CSS `transform: rotate(45deg)` on an inner element, or clip-path).
- **Fork/join nodes** (in `ParallelWork`): Small horizontal bar or filled circle.
- **Merge nodes** (in `AltWork`): Small diamond or circle.
- **Edge labels**: `"true"` / `"false"` near branching edges; `"enter"` / `"skip"` / `"repeat"` / `"exit"` for loop edges.
- **Back-edges** (loop): ELK routes them automatically. Style with a distinct color or dashed line to make loops visually obvious.

### Session Response Part

(to be editing...)
