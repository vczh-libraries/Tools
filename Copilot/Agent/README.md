# Copilot Agent

A TypeScript-based application for interacting with GitHub Copilot models, featuring both a CLI chat interface and a web-based portal.

## Prerequisites

- [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) must be installed and authenticated
- Node.js 18+ and Yarn

## Setup

From the `Copilot/Agent` directory, run:

```bash
yarn install
```

## Build

To build and test the application:

```bash
yarn build
```

This runs three steps in sequence:
1. `yarn compile` — compiles all TypeScript packages
2. `yarn testStart` — starts the portal server in the background
3. `yarn testExecute` — runs all API and Playwright tests, then stops the server

The server is always stopped via `api/stop` after tests, regardless of pass/fail.

To compile only (no tests):

```bash
yarn compile
```

## Usage

### Chat (CLI)

```bash
yarn chat
```

Interactive CLI session: lists models, lets you pick one, then streams responses in a persistent conversation.

### Portal (Web UI)

```bash
yarn portal
```

Starts an HTTP server at `http://localhost:8888` serving a web UI and RESTful API.

- Open `http://localhost:8888` to launch the portal.
- Select a model and working directory, then click Start.
- Send requests via the text box (Ctrl+Enter or Send button).
- Session responses (reasoning, tool calls, messages) appear as collapsible message blocks.
- "Close Session" ends the session and closes the tab; "Stop Server" also shuts down the server.
- Use `http://localhost:8888/index.html?project=XXX` to default working directory to the sibling folder `XXX` next to the repo root.
- Without `project` parameter, working directory defaults to the repo root.

## Specification Structure

There are two folders storing specification:
- `prompts/snapshot`: The specification that the project implemented, it reflects the current state.
- `prompts/spec`: The specification that the project need to be.

File organization in these two folders are identical:
- `CopilotPortal` folder: about `packages/CopilotPortal`
  - `JobsData.md`: Definitions of jobs data.
  - `API.md`: RESTful API, and how to start the project.
  - `Index.md`: index.html page.
  - `Test.md`: test.html page.
  - `Shared.md`: Shared components between multiple web pages.

## Project Structure

```
Copilot/Agent/
├── package.json              # Workspace configuration (yarn workspaces)
├── tsconfig.json             # Base TypeScript configuration
├── packages/
│   ├── CopilotApi/           # Copilot SDK session wrapper library
│   │   ├── src/
│   │   │   └── copilotSession.ts
│   │   └── package.json
│   ├── CopilotPortal/        # Web UI + RESTful API server
│   │   ├── src/
│   │   │   └── index.ts      # HTTP server, API routes, session management
│   │   ├── assets/           # Static website files
│   │   │   ├── index.html    # Main portal page
│   │   │   ├── index.js      # Portal JS (session interaction, live polling)
│   │   │   ├── index.css     # Portal styles
│   │   │   ├── messageBlock.js       # MessageBlock component
│   │   │   ├── messageBlock.css      # MessageBlock styles
│   │   │   ├── sessionResponse.js    # SessionResponseRenderer component
│   │   │   ├── sessionResponse.css   # SessionResponseRenderer styles
│   │   │   └── test.html     # Simple API test page
│   │   ├── test/             # Test files
│   │   │   ├── startServer.mjs       # Starts server for testing
│   │   │   ├── runTests.mjs          # Test runner (always stops server)
│   │   │   ├── api.test.mjs          # RESTful API tests
│   │   │   └── web.test.mjs          # Playwright UI tests
│   │   └── package.json
│   └── CopilotTest/          # CLI chat application
│       ├── src/
│       │   └── index.ts      # Interactive terminal chat
│       └── package.json
```

## Maintaining the Project

- **Build**: `yarn build` compiles all packages and runs tests.
- **Compile only**: `yarn compile` compiles all packages via TypeScript.
- **Run portal**: `yarn portal` starts the web server (default port 8888).
- **Run chat**: `yarn chat` starts the CLI chat.
- **Run tests only**: `yarn testStart && yarn testExecute` starts server and runs tests.
- **Playwright**: Install with `npx playwright install chromium`. Used for testing the portal UI.
- **Spec-driven**: Portal features are defined in `packages/CopilotPortal/Spec.md`.

## Features

- **Web Portal**: Browser-based UI for Copilot sessions with real-time streaming
- **Message Blocks**: User, Reasoning, Tool, and Message blocks with expand/collapse behavior
- **Markdown Rendering**: Completed message blocks (except Tool) render markdown content as formatted HTML using marked.js
- **Awaiting Status**: "Awaits responses ..." indicator shown in the session part while the agent is working
- **Lazy CopilotClient**: Client starts on demand and stops when all sessions close
- **Multiple Sessions**: Supports parallel sessions sharing a single CopilotClient
- **CLI Chat**: Terminal-based interactive chat with model selection and streaming
- **Live Polling**: Sequential long-polling for real-time session callbacks
