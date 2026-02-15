# Specification

Root folder of the project is `REPO-ROOT/Copilot/Agent`.
Read `README.md` to understand the whole picture of the project as well as specification organizations.

## Related Files

- `src/sharedApi.ts`
- `src/copilotApi.ts`
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

## API

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

Other response maps to all methods in ICopilotSessionCallbacks in CopilotApi/src/copilotSession.ts in this schema

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
