# Copilot Agent

A TypeScript-based application for interacting with GitHub Copilot models.

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

To start the chat application:

```bash
yarn chat
```

The application will:

1. List all available Copilot models with their multipliers
2. Prompt you to select a model by entering its name or ID
3. Start an interactive chat session
4. Stream responses from the selected model in real-time
5. Continue the conversation until you type "exit"

## Project Structure

```
Copilot/Agent/
├── package.json              # Workspace configuration
├── tsconfig.json             # TypeScript configuration
├── packages/
│   └── CopilotTest/
│       ├── package.json      # Package configuration
│       ├── tsconfig.json     # Package TypeScript config
│       └── src/
│           └── index.ts      # Main application
```

## Features

- **Model Listing**: Displays all available models and their premium request multipliers
- **Interactive Selection**: User-friendly model selection with validation
- **Streaming Responses**: Real-time response streaming from the AI model
- **Session Persistence**: Maintains conversation context until exit
- **Error Handling**: Validates model selection and provides clear error messages
