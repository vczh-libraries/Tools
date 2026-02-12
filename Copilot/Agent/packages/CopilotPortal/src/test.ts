import { chromium, Browser, Page } from "playwright";
import { ChildProcess, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 9999;
const BASE_URL = `http://localhost:${PORT}`;

function startServer(): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
        const serverPath = path.resolve(__dirname, "..", "dist", "index.js");
        const child = spawn("node", [serverPath, String(PORT)], {
            stdio: ["pipe", "pipe", "pipe"],
        });

        child.stdout!.on("data", (data: Buffer) => {
            const msg = data.toString();
            if (msg.includes("Server running")) {
                resolve(child);
            }
        });

        child.stderr!.on("data", (data: Buffer) => {
            console.error("Server stderr:", data.toString());
        });

        child.on("error", reject);

        setTimeout(() => reject(new Error("Server failed to start in time")), 5000);
    });
}

function stopServer(child: ChildProcess): void {
    child.stdin!.write("\n");
    child.kill();
}

async function runTests(): Promise<void> {
    let server: ChildProcess | undefined;
    let browser: Browser | undefined;
    let passed = 0;
    let failed = 0;

    function assert(condition: boolean, message: string): void {
        if (condition) {
            console.log(`  PASS: ${message}`);
            passed++;
        } else {
            console.error(`  FAIL: ${message}`);
            failed++;
        }
    }

    try {
        console.log("Starting server...");
        server = await startServer();
        console.log(`Server started on port ${PORT}`);

        browser = await chromium.launch();

        // Test 1: api/test returns "Hello, world!"
        console.log("\nTest: api/test");
        {
            const page = await browser.newPage();
            const response = await page.goto(`${BASE_URL}/api/test`);
            const text = await response!.text();
            assert(response!.status() === 200, "api/test returns 200");
            assert(text === "Hello, world!", `api/test returns "Hello, world!" (got: "${text}")`);
            await page.close();
        }

        // Test 2: / serves index.html (blank page)
        console.log("\nTest: index.html");
        {
            const page = await browser.newPage();
            const response = await page.goto(`${BASE_URL}/`);
            assert(response!.status() === 200, "/ returns 200");
            const title = await page.title();
            assert(title === "Copilot Portal", `index.html title is "Copilot Portal" (got: "${title}")`);
            const bodyText = await page.textContent("body");
            assert(bodyText!.trim() === "", `index.html body is blank (got: "${bodyText!.trim()}")`);
            await page.close();
        }

        // Test 3: /index.html serves same as /
        console.log("\nTest: /index.html");
        {
            const page = await browser.newPage();
            const response = await page.goto(`${BASE_URL}/index.html`);
            assert(response!.status() === 200, "/index.html returns 200");
            await page.close();
        }

        // Test 4: test.html fetches api/test and displays content
        console.log("\nTest: test.html");
        {
            const page = await browser.newPage();
            await page.goto(`${BASE_URL}/test.html`);
            await page.waitForFunction(() => (globalThis as any).document.body.textContent!.trim().length > 0, {}, { timeout: 5000 });
            const bodyText = await page.textContent("body");
            assert(bodyText!.trim() === "Hello, world!", `test.html body shows "Hello, world!" (got: "${bodyText!.trim()}")`);
            await page.close();
        }

        // Test 5: 404 for unknown path
        console.log("\nTest: 404 for unknown path");
        {
            const page = await browser.newPage();
            const response = await page.goto(`${BASE_URL}/nonexistent.html`);
            assert(response!.status() === 404, "Unknown path returns 404");
            await page.close();
        }

        console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    } finally {
        if (browser) await browser.close();
        if (server) stopServer(server);
    }

    if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
    console.error("Test runner error:", err);
    process.exit(1);
});
