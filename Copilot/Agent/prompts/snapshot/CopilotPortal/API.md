# Specification

Root folder of the project is `REPO-ROOT/Copilot/Agent`.
Read `README.md` to understand the whole picture of the project as well as specification organizations.

## Related Files

- `src/sharedApi.ts`
- `src/copilotApi.ts`
- `src/jobsApi.ts`
- `src/index.ts`

Data structures about jobs and tasks are in `src/jobsData.ts`.
It's spec is in `JobsData.md`.

## Starting the HTTP Server

- This package starts an http server, serving a website as well as a set of RESTful API.
- In src/index.ts it accepts an optional argument (default 8888) for the http port.
- Website entry is http://localhost:port
- API entry is http://localhost:port/api/...
- "yarn portal" to run src/index.ts.

It starts both Website and RESTful API. Awaits for api/stop to stops.

## Running the Website

- http://localhost:port is equivalent to http://localhost:port/index.html.
- In the assets folder there stores all files for the website.
- Requesting for http://localhost:port/index.html returns assets/index.html.

## Helpers (copilotApi.ts)

All helper functions and types are exported and API implementations should use them.

### helperGetModels

`async helperGetModels(): Promise<ModelInfo[]>;`
- List all models.

### helperSessionStart

`async helperSessionStart(modelId: string, workingDirectory?: string): Promise<[ICopilotSession, string]>;`
- Start a session, return the session object and its id.

### helperSessionStop

`async helperSessionStop(session: ICopilotSession): Promise<void>;`
- Stop a session.

### helperGetSession

`helperGetSession(sessionId: string): ICopilotSession | undefined;`
- Get a session by its id.

### helperPushSessionResponse

`helperPushSessionResponse(session: ICopilotSession, response: LiveResponse): void;`
- Push a response to a session's response queue.

## Helpers (jobsApi.ts)

All helper functions and types are exported and API implementations should use them.

`async installJobsEntry(entry: Entry): Promise<void>;`
- Use the entry. It could be `entry` from `jobsData.ts` or whatever.
- This function should only be called once. Otherwise throw an error.

```typescript
interface ICopilotTask {
  readonly drivingSession: ICopilotSession;
  readonly status: "Executing" | "Succeeded" | "Failed";
  // stop all running sessions, no further callback issues.
  stop(): void;
}

interface ICopilotTaskCallback {
  // Called when this task succeeded
  void taskSucceeded();
  // Called when this task failed
  void taskFailed();
  // Called when a task session started. If the task session is the driving session, taskSession is undefined.
  void taskSessionStarted(taskSession: [ICopilotSession, string] | undefined);
  // Called when a task session stopped. If the task session is the driving session, taskSession is undefined.
  void taskSessionStopped(taskSession: [ICopilotSession, string] | undefined, succeeded: boolean);
}

async function startTask(
  taskName: string,
  userInput: string,
  drivingSession: ICopilotSession,
  forceSingleSessionMode: boolean,
  ignorePrerequisiteCheck: boolean,
  callback: ICopilotTaskCallback,
  taskModelIdOverride?: string,
  workingDirectory?: string
): Promise<ICopilotTask>
```
- Start a task.
- Throw an error if `installJobsEntry` has not been called.

```typescript
interface ICopilotJob {
  get runningWorkIds(): number[];
  get status(): "Executing" | "Succeeded" | "Failed";
  // stop all running tasks, no further callback issues.
  get stop();
}

interface ICopilotJobCallback {
  // Called when this job succeeded
  void jobSucceeded();
  // Called when this job failed
  void jobFailed();
  // Called when a TaskWork started
  void workStarted(workId: number);
  // Calledn when a TaskWork stopped
  void workStopped(workId: number, succeeded: boolean);
}

async function startJob(
  jobName: string,
  userInput: string,
  workingDirectory: string,
  callback: ICopilotJobCallback
): Promise<ICopilotJob>
```

## API (copilotApi.ts)

All restful read arguments from the path and returns a JSON document.

All title names below represents http://localhost:port/api/TITLE

Copilot hosting is implemented by "@github/copilot-sdk" and the CopilotApi (copilot-api) package

### config

Returns the repo root path (detected by walking up from the server's directory until a `.git` folder is found).

```typescript
{
  repoRoot: string;
}
```

### test

Returns `{"message":"Hello, world!"}`

### stop

Stop any running sessions.
Returns `{}` and stops.

### copilot/models

Returns all copilot sdk supported models in this schema

```typescript
{
  models: {
    name: string;
    id: string;
    multiplier: number;
  }[]
}
```

### copilot/session/start/{model-id}

The body will be an absolute path for working directory

Start a new copilot session and return in this schema

```typescript
{
  sessionId: string;
}
```

or when error happens:

```typescript
{
  error: "ModelIdNotFound" | "WorkingDirectoryNotAbsolutePath" | "WorkingDirectoryNotExists"
}
```

Multiple sessions could be running parallelly, start a `CopilotClient` if it is not started yet, it shares between all sessions.

### copilot/session/{session-id}/stop

Stop the session and return in this schema

```typescript
{result:"Closed"} | {error:"SessionNotFound"}
```

If all session is closed, close the `CopilotClient` as well.

### copilot/session/{session-id}/query

The body will be the query prompt string.

Send the query to the session, and the session begins to work.

Returns in this schema

```typescript
{
  error?:"SessionNotFound"
}
```

### copilot/session/{session-id}/live

This is a query to wait for one response back for this session.
Each session generates many responses, storing in a queue.
When the api comes, it pop one response and send back. Responses must be send back in its generating orders.
If there is no response, do not reply the API. If there is no response after 5 seconds, send back a time out error.
Be aware of that api requests and session responses could happen in any order.

This api does not support parallel calling on the same id.
If a call with a session-id is pending,
the second call with the same session-id should return an error.

Returns in this schema if any error happens

```typescript
{
  error: "SessionNotFound" | "HttpRequestTimeout" | "ParallelCallNotSupported"
}
```

TEST-NOTE: Can't trigger "HttpRequestTimeout" stably in unit test so it is not covered.
It requires the underlying copilot agent to not generate any response for 5 seconds,
which is almost impossible.

Returns in this schema if an exception it thrown from inside the session

```typescript
{
  sessionError: string
}
```

Other response maps to all methods in `ICopilotSessionCallbacks` in `CopilotApi/src/copilotSession.ts` in this schema

```typescript
{
  callback: string,
  argument1: ...,
  ...
}
```

For example, when `onReasoning(reasoningId: string, delta: string): void;` is called, it returns

```typescript
{
  callback: "onReasoning",
  reasoningId: string,
  delta: string
}
```

When running a task, any driving session generated prompts will be reported in this schema

```typescript
{
  callback: "onGeneratedUserPrompt",
  prompt: string
}
```

## API (jobsApi.ts)

TEST-NOTE: DO NOT use the exported `entry` in unit testing because all required files do not present in this repo. Make up your own `Entry` value.
You can make up a test specific entry which loads an entry from a JSON file in `test`.
`validateEntry` must be called before passing it to `installJobsEntry`.

### copilot/task

List all tasks passed to `installJobsEntry` in this schema:
```typescript
{
  tasks: {
    name: string;
    requireUserInput: boolean;
  }[]
}
```

### copilot/task/start/{task-name}/session/{session-id}

The body will be user input.

Start a new task and return in this schema.
Single session mode is forced with an existing session id.
Prerequisite checking is skipped.

After the task finishes, it stops automatically, the task id will be unavailable immediately.
Keep the session alive.

```typescript
{
  taskId: string;
}
```

or when error happens:

```typescript
{
  error: "SessionNotFound"
}
```

### copilot/task/{task-id}/stop

The API will ignore the action and return `TaskCannotClose` if the task is started forcing single session mode.
Be aware of that it is possible that a task runs in single session mode but it is not forced.

A task will automatically stops when finishes,
this api forced the task to stop.

Stop the task and return in this schema.

```typescript
{
  result: "Closed"
}
```

or when error happens:

```typescript
{
  error: "TaskNotFound" | "TaskCannotClose"
}
```

### copilot/task/{task-id}/live

It works likes `copilot/session/{session-id}/live` but it reacts to `ICopilotTaskCallback`.
They should be implemented in the same way, but only response in schemas mentioned below.

Returns in this schema if any error happens

```typescript
{
  error: "TaskNotFound" | "HttpRequestTimeout" | "ParallelCallNotSupported"
}
```

TEST-NOTE: Can't trigger "HttpRequestTimeout" stably in unit test so it is not covered.
It requires the underlying copilot agent to not generate any response for 5 seconds,
which is almost impossible.

Returns in this schema if an exception it thrown from inside the session

```typescript
{
  taskError: string
}
```

Other response maps to all methods in `ICopilotTaskCallback` in `src/jobsApi.ts`.

### copilot/job

List all jobs passed to `installJobsEntry` in this schema:
```typescript
{
  jobs: ({name: string} & Job)[]
}
```

### copilot/job/start/{job-name}

The first line will be an absolute path for working directory
The rest of the body will be user input.

Start a new job and return in this schema.

```typescript
{
  jobId: string;
}
```

or when error happens:

```typescript
{
  error: "JobNotFound"
}
```

### copilot/job/{job-id}/stop

A job will automatically stops when finishes,
this api forced the job to stop.

Stop the job and return in this schema.

```typescript
{
  result: "Closed"
}
```

or when error happens:

```typescript
{
  error: "JobNotFound"
}
```

### copilot/job/{job-id}/live

It works likes `copilot/session/{session-id}/live` but it reacts to `ICopilotJobCallback`.
They should be implemented in the same way, but only response in schemas mentioned below.

Returns in this schema if any error happens

```typescript
{
  error: "JobNotFound" | "HttpRequestTimeout" | "ParallelCallNotSupported"
}
```

TEST-NOTE: Can't trigger "HttpRequestTimeout" stably in unit test so it is not covered.
It requires the underlying copilot agent to not generate any response for 5 seconds,
which is almost impossible.

Returns in this schema if an exception it thrown from inside the session

```typescript
{
  jobError: string
}
```

Other response maps to all methods in `ICopilotJobCallback` in `src/jobsApi.ts`.
