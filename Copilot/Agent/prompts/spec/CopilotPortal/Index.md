# Specification

Root folder of the project is `REPO-ROOT/Copilot/Agent`.
Read `README.md` to understand the whole picture of the project as well as specification organizations.

## Related Files

- `assets`
  - `index.css`
  - `index.js`
  - `index.html`

### index.css

Put index.html specific css file in index.css.

### index.js

Put index.html specific javascript file in index.js.

### index.html

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

After "Stop Server" or "Close Session" is pressed, responses from this api will be ignored and no more such api is sending.

#### Session Part

The session part div is passed to a `SessionResponseRenderer` (from `sessionResponse.js`) which handles all rendering within it.

Session responses generates 3 types of message block:
- Reasoning
- Tool
- Message
Multiple of them could happen parallelly.

When `ICopilotSessionCallbacks::onStartXXX` happens, a new message block should be created.
When `ICopilotSessionCallbacks::onXXX` happens, the data should be appended to the message block.
When `ICopilotSessionCallbacks::onEndXXX` happens, the message block is completed, no data needs to append to the message block.

The content of a "Tool" `MessageBlock` needs to be taken care of specially:
- The first line should be in its title. It is easy to tell when the `title` property is empty.
- `ICopilotSessionCallbacks::onEndToolExecution` will gives you an optional error message.
Responses for different message blocks are identified by its id.

A message blocks stack vertically from top to bottom in the session part.
`MessageBlock` in messageBlock.js should be used to control any message block.

You are recommended to maintain a list of message blocks in a map with key "blockType-blockId" in its rendering order.

When the session is generating responses (aka the "Send" button is disabled),
there must be a text at the left buttom corner of the session part saying "Awaits responses ...".
When the session finishes, this text disappears.

The session part is scrollable.

#### Request Part

It is a multiline text box. I can type any text, and press CTRL+ENTER to send the request.

There is a "Send" button at the right bottom corner of the text box.
It does the same thing as pressing CTRL+ENTER.
When the button is disabled, pressing CTRL+ENTER should also does nothing.
`api/copilot/session/query/{session-id}` is used here.

User request should generate a "User" message block, append the request and immediatelly complete it.

When a request is sent, the button is disabled.
When `ICopilotSessionCallbacks::onAgentEnd` triggers, it is enabled again.

There is a "Stop Server" and "Close Session" button (in the mentioning order) at the left bottom corner of the text box.
When "Close Session" is clicked:
- Ends the session with `api/copilot/session/stop/{session-id}`.
- Do whatever needs for finishing.
- Close the current webpage window or tab.
When "Stop Server" is clicked:
- It does what "Stop Server" does, with an extra `api/stop` to stop the server before closing the webpage.
