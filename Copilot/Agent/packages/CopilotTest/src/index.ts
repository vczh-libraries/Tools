import { CopilotClient } from "@github/copilot-sdk";
import * as readline from "readline";
import * as path from "path";
import { startSession } from "./copilotSession.js";

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
