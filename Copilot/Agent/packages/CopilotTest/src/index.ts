import { CopilotClient, type CopilotSession } from "@github/copilot-sdk";
import * as readline from "readline";
import * as path from "path";

interface ICopilotSession {
  get rawSection(): CopilotSession;
  sendRequest(message: string, timeout: 2147483647): Promise<void>;
}

interface ICopilotSessionCallbacks {
  // assistant.reasoning_delta with a new id
  onStartReasoning(reasoningId: string): void;
  // assistant.reasoning_delta with an existing id
  onReasoning(reasoningId: string, delta: string): void;
  // assistant.reasoning with an existing id
  onEndReasoning(reasoningId: string, completeContent: string): void;
  
  // assistant.message_delta with a new id
  onStartMessage(messageId: string): void;
  // assistant.message_delta with an existing id
  onMessage(messageId: string, delta: string): void;
  // assistant.message with an existing id
  onEndMessage(messageId: string, completeContent: string): void;

  // tool.execution_start with a new id
  onStartToolExecution(toolCallId: string, toolName: string, parentToolCallId: string | undefined): void;
  // tool.execution_partial_result with an existing id
  onToolExecution(toolCallId: string, delta: string): void;
  // tool.execution_complete with an existing id
  onEndToolExecution(toolCallId: string, result: {content: string, detailedContent?: string} | undefined, error: {message: string, code?: string} | undefined): void;

  // assistant.turn_start
  onAgentStart(turnId: string): void;

  // assistant.turn_end
  onAgentEnd(turnId: string): void;

  // session.idle
  onIdle(): void;
}

// DOCUMENT: https://github.com/github/copilot-sdk/blob/main/nodejs/README.md
async function startSession(
  client: CopilotClient,
  modelId: string,
  callback: ICopilotSessionCallbacks,
  workingDirectory?: string
): Promise<ICopilotSession> {
  const session = await client.createSession({
    model: modelId,
    streaming: true,
    workingDirectory,
  });

  const reasoningContentById = new Map<string, string>();
  const messageContentById = new Map<string, string>();
  const toolOutputById = new Map<string, string>();

  session.on("assistant.turn_start", (event) => {
    callback.onAgentStart(event.data.turnId);
  });

  session.on("assistant.turn_end", (event) => {
    callback.onAgentEnd(event.data.turnId);
  });

  session.on("assistant.reasoning_delta", (event) => {
    const existing = reasoningContentById.get(event.data.reasoningId);
    if (existing === undefined) {
      reasoningContentById.set(event.data.reasoningId, event.data.deltaContent);
      callback.onStartReasoning(event.data.reasoningId);
      callback.onReasoning(event.data.reasoningId, event.data.deltaContent);
      return;
    }

    reasoningContentById.set(
      event.data.reasoningId,
      existing + event.data.deltaContent
    );
    callback.onReasoning(event.data.reasoningId, event.data.deltaContent);
  });

  session.on("assistant.reasoning", (event) => {
    reasoningContentById.set(event.data.reasoningId, event.data.content);
    callback.onEndReasoning(event.data.reasoningId, event.data.content);
  });

  session.on("assistant.message_delta", (event) => {
    const existing = messageContentById.get(event.data.messageId);
    if (existing === undefined) {
      messageContentById.set(event.data.messageId, event.data.deltaContent);
      callback.onStartMessage(event.data.messageId);
      callback.onMessage(event.data.messageId, event.data.deltaContent);
      return;
    }

    messageContentById.set(
      event.data.messageId,
      existing + event.data.deltaContent
    );
    callback.onMessage(event.data.messageId, event.data.deltaContent);
  });

  session.on("assistant.message", (event) => {
    messageContentById.set(event.data.messageId, event.data.content);
    callback.onEndMessage(event.data.messageId, event.data.content);
  });

  session.on("tool.execution_start", (event) => {
    callback.onStartToolExecution(
      event.data.toolCallId,
      event.data.toolName,
      event.data.parentToolCallId
    );
  });

  session.on("tool.execution_partial_result", (event) => {
    const existing = toolOutputById.get(event.data.toolCallId) ?? "";
    toolOutputById.set(event.data.toolCallId, existing + event.data.partialOutput);
    callback.onToolExecution(event.data.toolCallId, event.data.partialOutput);
  });

  session.on("tool.execution_complete", (event) => {
    callback.onEndToolExecution(
      event.data.toolCallId,
      event.data.result,
      event.data.error
    );
  });

  session.on("session.idle", () => {
    callback.onIdle();
  });

  return {
    get rawSection(): CopilotSession {
      return session;
    },

    async sendRequest(message: string, timeout: 2147483647): Promise<void> {
      await session.sendAndWait({ prompt: message }, timeout);
    },
  };
}

function createQuestion(rl: readline.Interface) {
  return (prompt: string): Promise<string> =>
    new Promise((resolve) => {
      rl.question(prompt, (input) => resolve(input));
    });
}

function getValidatedWorkingDirectory(argv: string[]): string {
  const workingDirectory = argv[2] || process.cwd();
  const absoluteWorkingDirectory = path.resolve(workingDirectory);

  if (argv[2] && workingDirectory !== absoluteWorkingDirectory) {
    throw new Error(
      `Working directory must be an absolute path without trailing separators or relative components.\n` +
        `Received: "${workingDirectory}"\n` +
        `Expected: "${absoluteWorkingDirectory}"`
    );
  }

  return absoluteWorkingDirectory;
}

async function main() {
  // Get working directory from command line argument
  // Usage: node dist/index.js [workingDirectory]
  // If not provided, defaults to current working directory
  const absoluteWorkingDirectory = getValidatedWorkingDirectory(process.argv);

  console.log(`Working directory: ${absoluteWorkingDirectory}\n`);

  const client = new CopilotClient({
    cwd: absoluteWorkingDirectory,
  });
  await client.start();

  try {
    // List available models
    console.log("=== Available Models ===\n");
    const models = await client.listModels();
    models.forEach((model) => {
      console.log(`${model.id}: ${model.billing?.multiplier}x`);
    });

    // Create readline interface for user input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const question = createQuestion(rl);

    try {
      // Model selection loop
      let selectedModelId: string | null = null;
      while (!selectedModelId) {
        const userInput = (await question("Enter model name or ID to start: ")).trim();
        if (userInput.toLowerCase() === "exit") {
          break;
        }

        // Try to find matching model
        const matchedModel = models.find(
          (m) => m.id === userInput || m.name === userInput
        );

        if (matchedModel) {
          selectedModelId = matchedModel.id;
          console.log(
            `\n\u2713 Selected model: ${matchedModel.name} (${matchedModel.id})\n`
          );
        } else {
          console.log(
            `\n\u2717 Error: Model "${userInput}" not found. Please enter a valid model name or ID.\n`
          );
        }
      }

      if (selectedModelId) {
        const session = await startSession(
          client,
          selectedModelId,
          {
            onStartReasoning: () => {},
            onReasoning: () => {},
            onEndReasoning: () => {},

            onStartMessage: () => {},
            onMessage: (_messageId, delta) => {
              process.stdout.write(delta);
            },
            onEndMessage: () => {},

            onStartToolExecution: () => {},
            onToolExecution: () => {},
            onEndToolExecution: () => {},

            onAgentStart: () => {},
            onAgentEnd: () => {},

            onIdle: () => {
              process.stdout.write("\n\n");
            },
          },
          absoluteWorkingDirectory
        );

        console.log('Chat started! Type "exit" to quit.\n');

        while (true) {
          const message = (await question("You: ")).trim();
          if (message.toLowerCase() === "exit") {
            break;
          }

          if (!message) {
            continue;
          }

          process.stdout.write("\nAssistant: ");
          await session.sendRequest(message, 2147483647);
        }
      }
    } finally {
      rl.close();
    }
    await client.stop();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    await client.stop();
    process.exit(1);
  }
}

main();
