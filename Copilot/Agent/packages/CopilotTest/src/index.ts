import { CopilotClient } from "@github/copilot-sdk";
import * as readline from "readline";
import * as path from "path";

interface ModelInfo {
  id: string;
  name: string;
  multiplier: number;
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
    
    const modelList: ModelInfo[] = models.map((model: any) => ({
      id: model.id,
      name: model.name || model.id,
      multiplier: model.multiplier || 1
    }));

    modelList.forEach((model) => {
      console.log(`Model: ${model.name}`);
      console.log(`  ID: ${model.id}`);
      console.log(`  Multiplier: ${model.multiplier}x\n`);
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
      
      // Try to find matching model
      const matchedModel = modelList.find(
        (m) => m.id === userInput || m.name === userInput
      );

      if (matchedModel) {
        selectedModelId = matchedModel.id;
        console.log(`\n✓ Selected model: ${matchedModel.name} (${matchedModel.id})\n`);
      } else {
        console.log(`\n✗ Error: Model "${userInput}" not found. Please enter a valid model name or ID.\n`);
      }
    }

    // Create session with selected model
    const session = await client.createSession({
      model: selectedModelId,
      streaming: true,
      workingDirectory: absoluteWorkingDirectory,
    });

    // Listen for response chunks
    session.on("assistant.message_delta", (event: any) => {
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
            process.stdout.write("Assistant: ");
            await session.sendAndWait({ prompt: message });
          }

          // Continue the chat loop
          await chat();
          resolve();
        });
      });
    };

    await chat();

    rl.close();
    await client.stop();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    await client.stop();
    process.exit(1);
  }
}

main();
