import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(__dirname, "..");

// Collect all test files to run
const testFiles = [
    path.join(__dirname, "api.test.mjs"),
    path.join(__dirname, "web.test.mjs"),
];

async function runTests() {
    return new Promise((resolve) => {
        const child = spawn("node", ["--test", ...testFiles], {
            stdio: "inherit",
            cwd: packageDir,
        });
        child.on("close", (code) => resolve(code ?? 1));
    });
}

let exitCode = 0;
try {
    exitCode = await runTests();
} finally {
    // Always stop the server, regardless of test outcome
    try {
        await fetch("http://localhost:8888/api/stop");
        console.log("Server stopped.");
    } catch {
        console.log("Server was already stopped or unreachable.");
    }
}
process.exit(exitCode);
