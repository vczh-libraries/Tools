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

To build the application:

```bash
yarn build
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
- Use `http://localhost:8888/index.html?project=XXX` to default working directory to `C:\Code\VczhLibraries\XXX`.

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
│   │   │   ├── messageBlock.js   # MessageBlock component
│   │   │   ├── messageBlock.css  # MessageBlock styles
│   │   │   └── test.html     # Simple API test page
│   │   └── package.json
│   └── CopilotTest/          # CLI chat application
│       ├── src/
│       │   └── index.ts      # Interactive terminal chat
│       └── package.json
```

## Maintaining the Project

- **Build**: `yarn build` compiles all packages via TypeScript.
- **Run portal**: `yarn portal` starts the web server (default port 8888).
- **Run chat**: `yarn chat` starts the CLI chat.
- **Playwright**: Install with `npx playwright install chromium`. Used for testing the portal UI.
- **Spec-driven**: Portal features are defined in `packages/CopilotPortal/Spec.md`.

## Features

- **Web Portal**: Browser-based UI for Copilot sessions with real-time streaming
- **Message Blocks**: User, Reasoning, Tool, and Message blocks with expand/collapse behavior
- **Lazy CopilotClient**: Client starts on demand and stops when all sessions close
- **Multiple Sessions**: Supports parallel sessions sharing a single CopilotClient
- **CLI Chat**: Terminal-based interactive chat with model selection and streaming
- **Live Polling**: Sequential long-polling for real-time session callbacks
