import { CopilotClient, CopilotSession } from "@github/copilot-sdk";
import * as readline from "readline";
import * as path from "path";

// DOCUMENT: https://github.com/github/copilot-sdk/blob/main/nodejs/README.md

interface ICopilotSession {
  sendRequest(message: string, timeout: 2147483647): Promise<void>;
}

interface ICopilotSessionCallbacks {
  get rawSection(): CopilotSession;

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

function startSession(client: CopilotClient, modelId: string, callback: ICopilotSessionCallbacks): ICopilotSession {

}

async function main() {
  // Get working directory from command line argument
  // Usage: node dist/index.js [workingDirectory]
  // If not provided, defaults to current working directory
  const workingDirectory = process.argv[2] || process.cwd();
  const absoluteWorkingDirectory = path.resolve(workingDirectory);

  // Ensure the input is an absolute path without trailing separators or relative components
  // The path before and after resolving must be identical (no normalization should occur)
  if (process.argv[2] && workingDirectory !== absoluteWorkingDirectory) {
    throw new Error(
      `Working directory must be an absolute path without trailing separators or relative components.\n` +
      `Received: "${workingDirectory}"\n` +
      `Expected: "${absoluteWorkingDirectory}"`
    );
  }

  console.log(`Working directory: ${absoluteWorkingDirectory}\n`);

  const client = new CopilotClient({
    cwd: absoluteWorkingDirectory
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

    // Function to prompt for model selection
    const selectModel = (): Promise<string> => {
      return new Promise((resolve) => {
        rl.question("Enter model name or ID to start: ", (input) => {
          resolve(input.trim());
        });
      });
    };

    // Model selection loop
    let selectedModelId: string | null = null;
    while (!selectedModelId) {
      const userInput = await selectModel();
      if (userInput.toLowerCase() === "exit") {
        break;
      }

      // Try to find matching model
      const matchedModel = models.find(
        (m) => m.id === userInput || m.name === userInput
      );

      if (matchedModel) {
        selectedModelId = matchedModel.id;
        console.log(`\n✓ Selected model: ${matchedModel.name} (${matchedModel.id})\n`);
      } else {
        console.log(`\n✗ Error: Model "${userInput}" not found. Please enter a valid model name or ID.\n`);
      }
    }

    if (selectedModelId) {

    // Create session with selected model
    const session = await client.createSession({
      model: selectedModelId,
      streaming: true,
      workingDirectory: absoluteWorkingDirectory,
    });

    // Listen for response chunks
    session.on("assistant.message_delta", (event) => {
      process.stdout.write(event.data.deltaContent);
    });

    session.on("session.idle", () => {
      console.log("\n");
    });

    console.log('Chat started! Type "exit" to quit.\n');

    // Chat loop
    const chat = (): Promise<void> => {
      return new Promise((resolve) => {
        rl.question("You: ", async (input) => {
          const message = input.trim();

          if (message.toLowerCase() === "exit") {
            resolve();
            return;
          }

          if (message) {
            process.stdout.write("\nAssistant: ");
            await session.sendAndWait({ prompt: message }, 2147483647);
          }

          // Continue the chat loop
          await chat();
          resolve();
        });
      });
    };

    await chat();

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
