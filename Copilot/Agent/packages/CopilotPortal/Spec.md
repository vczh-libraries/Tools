# Specification

This package starts an http server, serving a website as well as a set of RESTful API.

In src/index.ts it accepts an optional argument (default 8888) for the http port.

Website entry is http://localhost:port

API entry is http://localhost:port/api/...

## Starting the HTTP Server

"yarn portal" to run src/index.ts.

It starts both Website and RESTful API. Awaits for api/stop to stops.

## Website

http://localhost:port is equivalent to http://localhost:port/index.html.

In the assets folder there stores all files for the website.

Requesting for http://localhost:port/index.html returns assets/index.html.

### test.html

This is a test page, when it is loaded, it queries api/test and print the message field to the body.

### index.html

It is blank

## API

All restful read arguments from the path and returns a JSON document.

All title names below represents http://localhost:port/api/TITLE

Copilot hosting is implemented by "@github/copilot-sdk" and the CopilotApi (copilot-api) package

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

### copilot/session/stop/{session-id}

Stop the session and return in this schema

```typescript
{result:"Closed"} | {error:"SessionNotFound"}
```

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

This is a query to wait for any data sending back for this session.

Returns in this schema if any error happens

```typescript
{
  error: "SessionNotFound" | "HttpRequestTimeout"
}
```

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
