# Specification

Root folder of the project is `REPO-ROOT/Copilot/Agent`.
Read `README.md` to understand the whole picture of the project as well as specification organizations.

## Related Files

- `src/index.ts`

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

### copilot/session/stop/{session-id}

Stop the session and return in this schema

```typescript
{result:"Closed"} | {error:"SessionNotFound"}
```

If all session is closed, close the `CopilotClient` as well.

### copilot/session/query/{session-id}

The body will be the query prompt string.

Send the query to the session, and the session begins to work.

Returns in this schema

```typescript
{
  error?:"SessionNotFound"
}
```

### copilot/session/live/{session-id}

This is a query to wait for one response back for this session.
Each session generates many responses, storing in a queue.
When the api comes, it pop one response and send back. Responses must be send back in its generating orders.
If there is no response, do not reply the API. If there is no response after 5 seconds, send back a time out error.
Be aware of that api requests and session responses could happen in any order.
**BUG**: The current implementation seem to just wait for 5 seconds if it can't pop a session response at the call begins. My intent was that, before this 5 seconds of waiting ending, if a session response is generated, it should stop waiting and response the RESTful call immediately.

Returns in this schema if any error happens

```typescript
{
  error: "SessionNotFound" | "HttpRequestTimeout"
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
