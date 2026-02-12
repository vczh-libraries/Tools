import { CopilotClient } from "@github/copilot-sdk";
import * as readline from "readline";
import * as path from "path";
import { startSession } from "./copilotSession.js";

// TODO:
// - Detect when the session is broken, like disconnected or something.
// - Dump all communication history including all reasoning or tool calling.
// - Create a new session but inject all history to continue.
// - Being able to switch model.

class FormatOutput {
  private readonly contentById = new Map<string, string>();
  private currentId: string | undefined = undefined;

  public constructor(private readonly write: (text: string) => void) {}

  public logStart(id: string): void {
    this.contentById.set(id, "");
    this.switchTo(id);
  }

  public log(id: string, delta: string): void {
    if (!this.contentById.has(id)) {
      this.contentById.set(id, "");
    }

    this.switchTo(id);
    this.write(delta);
    this.contentById.set(id, (this.contentById.get(id) ?? "") + delta);
  }

  public logStop(id: string, completeContent?: string): void {
    if (completeContent !== undefined) {
      if (!this.contentById.has(id)) {
        this.contentById.set(id, "");
      }

      this.switchTo(id);
      const existing = this.contentById.get(id) ?? "";
      if (completeContent.startsWith(existing)) {
        const tail = completeContent.substring(existing.length);
        if (tail.length > 0) {
          this.write(tail);
        }
      } else if (completeContent !== existing) {
        this.write(completeContent);
      }
    }

    this.contentById.delete(id);
    if (this.currentId === id) {
      this.currentId = undefined;
    }
  }

  private switchTo(id: string): void {
    if (this.currentId === id) {
      return;
    }

    this.currentId = id;
    this.write(`\n========${id}========\n`);

    const content = this.contentById.get(id);
    if (content !== undefined && content.length > 0) {
      this.write(content);
    }
  }
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
        const formatter = new FormatOutput((text) => {
          process.stdout.write(text);
        });

        const session = await startSession(
          client,
          selectedModelId,
          {
            onStartReasoning: (reasoningId) => {
              formatter.logStart(`reasoning_${reasoningId}`);
            },
            onReasoning: (reasoningId, delta) => {
              formatter.log(`reasoning_${reasoningId}`, delta);
            },
            onEndReasoning: (reasoningId, completeContent) => {
              formatter.logStop(`reasoning_${reasoningId}`, completeContent);
            },

            onStartMessage: (messageId) => {
              formatter.logStart(`message_${messageId}`);
            },
            onMessage: (messageId, delta) => {
              formatter.log(`message_${messageId}`, delta);
            },
            onEndMessage: (messageId, completeContent) => {
              formatter.logStop(`message_${messageId}`, completeContent);
            },

            onStartToolExecution: (toolCallId, parentToolCallId, toolName, toolArguments) => {
              formatter.logStart(`tool_${toolCallId}`);
              formatter.log(
                `tool_${toolCallId}`,
                `[START] ${toolName}${parentToolCallId ? ` (parent: ${parentToolCallId})` : ""}\n${toolArguments}\n`
              );
            },
            onToolExecution: (toolCallId, delta) => {
              formatter.log(`tool_${toolCallId}`, delta);
            },
            onEndToolExecution: (toolCallId, result, error) => {
              const id = `tool_${toolCallId}`;
              if (error) {
                formatter.log(
                  id,
                  `[ERROR] ${error.code ? `${error.code}: ` : ""}${error.message}\n`
                );
              } else if (result) {
                formatter.log(id, result.content);
                if (result.detailedContent) {
                  formatter.log(id, result.detailedContent);
                }
              }
              formatter.logStop(id);
            },

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
