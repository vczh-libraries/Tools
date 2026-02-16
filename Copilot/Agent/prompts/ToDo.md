# /jobs.html

Lists as a table, when automate is clicked, it executes all third-column jobs from the current row to the end
| keyword | | | | |
|-|-|-|-|-|
| scrum | | problem | update |
| design | automate | problem next | update | problem |
| plan | automate | problem | update |
| summary | automate | problem | update |
| execute | automate | start | update |
| verify | automate | start | update |
| scrum | automate | learn |
| refine | | start |

Text box will be on the right side, select a job and click start, a job starts.
A control flow graph shows what tasks are running, covering the left side. "Start" button turned to "Stop".

Clicking a task covers the right side with tabs showing all session responses:
- Driving
- Task #N
- ...

Clicking the selected task again closes the tab and return to a text box.
The "Stop" button will not be covered by the tab.
