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
  - `flowChartELK.css`
  - `flowChartELK.js`
  - `flowChartMermaid.js`

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

When I hit the "Start Job" button, it jumpts to `/jobTracking.html` in a new window.
The selected job and the working directory should be brought to `/jobTracking.html`.

(to be editing...)

### jobTracking.css

Put jobTracking.html specific css file in jobTracking.css.

### jobTracking.js

Put jobTracking.html specific javascript file in jobTracking.js.

### jobTracking.html

This page should only be opened by `/jobs.html`'s "Start Job" button in order to obtain the working directory.
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

You can find the `Job` definition in `jobsDef.ts`.
`Job.work` is a simple control flow AST.
Render it like a flow chart expanding to fill the whole `job part`.#### Flow Chart Rendering Note

#### Flow Chart Rendering

**TEST-NOTE-BEGIN**
No need to create unit test to assert the chart is in a correct layout.
Ensure every `TaskWork` has a `ChartNode` with `TaskNode` hint.
**TEST-NOTE-END**

The `api/copilot/job` has an extra `chart` node which is a `ChartGraph`.
It is already a generated flow chart but has no layout information.

Each `ChartNode` is a node in the flow chart, and each hint maps to a graph:
- `TaskNode`: A blue rectangle with the task id, the text would be the `TaskWork` with that `workIdInJob`.
- `ParBegin`, `ParEnd`: A small black rectangle bar.
- `AltEnd`: A small pink rectangle bar.
- `CondBegin`: A small yellow rectangle bar.
- `CondEnd`: A small yellow diamind.
- `LoopEnd`: A small gray circle.

Each graph must have a border, and the background color would be lighter, except the black rectangle bar which has the same border and background color.

There will be multiple arrows connecting between nodes:
- `ChartArrow.id` is the target `ChartNode` with that `id`.
- When `ChartArrow.loopBack` is true, it hints a arrow pointing upwards. All others should be downwards.
- `ChartArrow.label` is the label attached to the arrow.

Arrows would be gray.

#### Rendering with ELK

Implementation stores in:
- `flowChartELK.css`
- `flowChartELK.js`

Activate this renderer by using URL argument `renderer=elk` or not setting `renderer`.

Use [ELK.js](https://github.com/kieler/elkjs) (loaded from CDN as `elk.bundled.js`) for automatic graph layout:
- Build an ELK graph with `children` (nodes) and `edges` from the `ChartGraph`.
- Use `elk.algorithm: "layered"` with `elk.direction: "DOWN"` for top-to-bottom flow.
- Use `elk.edgeRouting: "SPLINES"` for less turning routing.
- Use `elk.layered.considerModelOrder.strategy: "NODES_AND_EDGES"` and `elk.layered.crossingMinimization.forceNodeModelOrder: "true"` to respect the node ordering from the chart data.
- Use `elk.layered.cycleBreaking.strategy: "MODEL_ORDER"` so ELK uses node model order (sequential IDs) to identify back-edges—any edge from a higher-order node to a lower-order node is reversed.
- Use `elk.layered.nodePlacement.strategy: "NETWORK_SIMPLEX"` for better node centering.
- Each `ChartNode` becomes an ELK node; each `ChartArrow` becomes an ELK edge.
- After `elk.layout(graph)`, render the positioned nodes and routed edges into an SVG.
- Node visual styles (colors, borders) are defined in `flowChartELK.css` using CSS classes per hint type.

#### Rendering with Mermaid

Implementation stores in:
- `flowChartMermaid.js`

No separate CSS file is needed; node styles are embedded as inline Mermaid `style` directives in the generated definition.

Activate this renderer by using URL argument `renderer=mermaid`.

Use [Mermaid.js](https://mermaid.js.org/) (loaded from CDN) for declarative flowchart rendering:
- Initialize Mermaid with `startOnLoad: false` so rendering is controlled programmatically.
- Build a Mermaid `graph TD` definition string from the `ChartGraph`.
- Each `ChartNode` becomes a Mermaid node with shape syntax matching its hint (rectangles, diamonds `{}`, circles `(())`).
- Each `ChartArrow` becomes a Mermaid edge with optional label.
- Per-node inline `style` directives set fill, stroke, and text color matching the same palette as ELK.
- Call `mermaid.render("mermaid-chart", definition)` to produce an SVG, then insert it into the container.

#### Interaction with `ChartNode` which has a `TaskNode` hint

Clicking it bold (exclusive) or unbold the text.

### Session Response Part

Print `JSON.stringify(jobToRender and chartToRender, undefined, 4)` inside a `<pre>` element.
