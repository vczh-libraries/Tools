# TODO

## Task Execution

When the driving session is created in the task, it is better to always spawn new driving sessions for checking availability and criteria.
Whenever a driving session or a task session crashed, spawn a new session to replace it.

## Job Execution

Needs to support multiple client watching for the same job running.
A client can make a random guid and the server would treat them separately.
Data will be deleted after all guids drain all responses or 5 minutes after the target is closed.

## UI Fixing

```
I think you need to leave a little space between the svg and the container because otherwise the emoji at the very left node would also clip.

also implements that if I ctrl+scrolling at the flow chart area it zooms (update the spec with this feature)
```
