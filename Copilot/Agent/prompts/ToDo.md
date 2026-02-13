/jobs.html

Login:
  Free model for driving: default to GPT-5.1-mini
  Premium model for planning: default to GPT-5.2
  Premium model for coding: default to GPT-5.3-codex

Need to mention: `Read REPO-ROOT/AGENTS.md to interpret the following content:`
or just tag `copilot-instructions.md` and the actual prompt file directly.

JSON file as an entry to define all jobs and their availability.
The availability will be refreshed after every jobs.
- scrum problem `text` : always available
- scrum update `text` : `scrum ready`
- design problem next : `scrum ready`
- design update `text` : `task ready`
- design problem `text` : always available
- plan problem : `task ready`
- plan update `text` : `planning ready`
- summary problem : `planning ready`
- summary update `text` : `execution ready`
- execute : `execution ready`
- execute update `text` : `execution ready` and the previous job was `execute` or `verify` keyworded
- verify : `execution ready` and the previous job was `execute` or `verify` keyworded
- verify update `text` : `execution ready` and the previous job was `execute` or `verify` keyworded
- scrum learn : `execution ready` and has the "verified" mark

Lists as a table, when automate is clicked, it executes all third-column jobs from the current row to the end
| keyword | | | | |
|-|-|-|-|-|
| scrum | | problem | update |
| design | automate | problem next | update | problem |
| plan | automate | problem | update |
| summary | automate | problem | update |
| execute | automate | start | update |
| verify | automate | start | update |
| scrum | | learn |

conditions:
- scrum ready: when Copilot_Scrum.md is not just an title
- design ready: when Copilot_Task.md exists and is not just an title
- planning ready: When Copilot_Planning.md exists and is not just an title
- execution ready: When Copilot_Execution.md exists and is not just an title

all documentation jobs will:
- review `keyword`
- until all  
- review final

using review model
- GPT-5.3-codex
- opus 4.6
- Grok
- Gemini Pro 3

and summary model (premium model for planning)

Each job has its own JSON file defining a workflow with multiple tasks:
- previous tasks (array)
- task name
- prompt
- condition (satisfied and go, dissatisfied and ask for continuation)
  - when dissatisfied, the command will feed to the current driving session and ask for:
    - further verification for satisfaction
    - which criteria was not hold

Workflow progress n a job visible, each task has a separate `sessionResponse` control.
The job availability will be verified again before execution.

api:
/jobs: list all jobs name and id
/jobs/availabilities: evaluate all jobs availability
/jobs/start/`job-id`: start a job
/jobs/live/`job-id`: receiving progress updates, session start/stop (including the driving session), call copilot/session/live/`session-id` for session responses

Consider inject condition_satisfied and condition_dissatisfied tool for deterministic answer.
