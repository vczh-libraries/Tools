# /jobs.html

Continue to update `jobsData.ts`

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

## Auto Review

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

## Job Workflow

A simple control flow AST

## API

api:
/jobs: list all jobs name and id
/jobs/availabilities: evaluate all jobs availability
/jobs/start/`job-id`: start a job
/jobs/live/`job-id`: receiving progress updates, session start/stop (including the driving session), call copilot/session/live/`session-id` for session responses

Consider inject condition_satisfied and condition_dissatisfied tool for deterministic answer.

# /index.html

Offer to run tasks from `jobsData.ts` but everything will be in the same session.
Generated user prompt will also be pushed to the webpage.
A session could report a generated prompt and it renders as user prompt.
