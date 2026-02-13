import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverScript = path.resolve(__dirname, "..", "dist", "index.js");

// Spawn server as detached process so it runs independently of this script
const child = spawn("node", [serverScript], {
    detached: true,
    stdio: "ignore",
    cwd: path.resolve(__dirname, ".."),
});
child.unref();

// Wait for server to be ready by polling api/test
const maxRetries = 30;
for (let i = 0; i < maxRetries; i++) {
    try {
        const res = await fetch("http://localhost:8888/api/test");
        if (res.ok) {
            console.log("Server is ready at http://localhost:8888");
            process.exit(0);
        }
    } catch {
        // Not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
}

console.error("Server failed to start within timeout");
process.exit(1);
