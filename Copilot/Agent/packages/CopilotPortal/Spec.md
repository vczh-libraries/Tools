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

This is a test page, when it is loaded, it queries `api/test` and print the message field to the body.

### index.html

Put index.html specific css file in index.css.

Put index.html specific javascript file in index.js.

#### Starting an Copilot Session

When the webpage is loaded, it renders a UI in the middle to let me input:
- Model. A combo box with contents retrieved from `api/copilot/models`.
  - Items must be sorted.
  - Names instead of ids are displayed, but be aware of that other API needs the id.
  - Default to the model whose id is "gpt-5.2"
- Working Directory. A text box receiving an absolute full path.
  - When the url is `index.html?project=XXX`, the text box defaults to "C:\Code\VczhLibraries\XXX"
  - When there is no `project` argument, leave it blanks.

When I hit the "Start" button, the UI above disappears and show the session UI.
Send `api/copilot/session/start/{model-id}` to get the session id.

#### Session Interaction

The agent UI has two part.

The upper part (session part) renders what the session replies.
The lower part (request part) renders a text box to send my request to the session.
The session part and the request part should always fill the whole webpage.
Between two parts there is a bar to drag vertically to adjust the height of the request part which defaults to 300px.

After the UI is loaded,
the page must keep sending `api/copilot/session/live/{session-id}` to the server sequentially (aka not parallelly).
When a timeout happens, resend the api.
When it returns any response, process it and still keep sending the api.
Whenever `ICopilotSessionCallbacks::METHOD` is mentioned, it means a response from this api.

After "Stop" is pressed, responses from this api will be ignored and no more such api is sending.

#### Session Part

Session responses generates 3 types of message block:
- Reasoning
- Tool
- Message
Multiple of them could happen parallelly.

When `ICopilotSessionCallbacks::onStartXXX` happens, a new message block should be created.
When `ICopilotSessionCallbacks::onXXX` happens, the data should be appended to the message block.
When `ICopilotSessionCallbacks::onEndXXX` happens, the message block is completed, no data needs to append to the message block.
As an exception, `ICopilotSessionCallbacks::onEndToolExecution` will gives you an optional error message.
Responses for different message blocks are identified by its id.

A message blocks stack vertically from top to bottom in the session part.
`MessageBlock` in messageBlock.js should be used to control any message block.

You are recommended to maintain a list of message blocks in a map with key "blockType-blockId" in its rendering order.

#### Request Part

It is a multiline text box. I can type any text, and press CTRL+ENTER to send the request.

There is a "Send" button at the right bottom corner of the text box.
It does the same thing as pressing CTRL+ENTER.
When the button is disabled, pressing CTRL+ENTER should also does nothing.
`api/copilot/session/query/{session-id}` is used here.

When a request is sent, the button is disabled.
When `ICopilotSessionCallbacks::onAgentEnd` triggers, it is enabled again.

There is a "Stop" button at the left bottom corner of the text box.
It ends the session with `api/copilot/session/stop/{session-id}`, followed by an `api/stop`, do all necessary finishing work, close the webpage.

### messageBlock.js

Put messageBlock.js specific css file in messageBlock.css.

It exposes some APIs in this schema

```typescript
export class MessageBlock {
  constructor(blockType: "Reasoning" | "Tool" | "Message");
  appendData(data: string): void;
  complete(): void;
  get isCompleted(): boolean;
  get divElement(): HTMLDivElement;
}

export function getMessageBlock(div: HTMLDivElement): MessageBlock | undefined;
```

Each message block has a title, displaying: "blockType [receiving...]" or "blockType".

When a message block is created and receiving data, the height is limited to 150px, clicking the header does nothing

When a message block is completed:
- A message block will expand and others will collapse.
- Clicking the header of a completed message block switch between expanding or collapsing.
- There is no more height limit, it should expands to render all data.

Inside the `MessageBlock`, it holds a `<div/>` to change the rendering.
And it should also put itself in the element (e.g. in a field with a unique name) so that the object will not be garbage-collected.

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

This is a query to wait for one response back for this session.
Each session generates many responses, storing in a queue.
When the api comes, it pop one response and send back. Responses must be send back in its generating orders.
If there is no response, do not reply the API. If there is no response after 5 seconds, send back a time out error.
Be aware of that api requests and session responses could happen in any order.

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
