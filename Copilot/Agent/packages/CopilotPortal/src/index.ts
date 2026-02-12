import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = parseInt(process.argv[2] ?? "8888", 10);

const mimeTypes: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
};

// assets folder is at packages/CopilotPortal/assets, __dirname is packages/CopilotPortal/dist
const assetsDir = path.resolve(__dirname, "..", "assets");

function serveStaticFile(res: http.ServerResponse, filePath: string): void {
    if (!fs.existsSync(filePath)) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] ?? "application/octet-stream";
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
}

function handleApi(req: http.IncomingMessage, res: http.ServerResponse, apiPath: string): void {
    if (apiPath === "test") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Hello, world!" }));
        return;
    }

    if (apiPath === "stop") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({}));
        console.log("Shutting down...");
        server.close(() => {
            process.exit(0);
        });
        return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unknown API endpoint" }));
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    let pathname = url.pathname;

    // API routes
    if (pathname.startsWith("/api/")) {
        const apiPath = pathname.slice("/api/".length);
        handleApi(req, res, apiPath);
        return;
    }

    // Website routes
    if (pathname === "/") {
        pathname = "/index.html";
    }

    const filePath = path.join(assetsDir, pathname);
    serveStaticFile(res, filePath);
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log("Use api/stop to stop the server.");
});
