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
- Clicking a job button renders an exclusive selected state and its `jobName` (not the `name` in the button text) becomes `selectedJobName`. The "Start Job" button is enabled.
- Clicking a selected job button unselect it, the "Start Job" button is disabled.

#### Actions of Automate Button

(to be editing...)

### User Input Part

There is a text box fills the page, and at the bottom there are buttons aligned to the right:
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

(to be editing...)

### Session Response Part

(to be editing...)
