import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
    jsonResponse,
} from "./sharedApi.js";
import {
    apiConfig,
    apiStop,
    apiCopilotModels,
    apiCopilotSessionStart,
    apiCopilotSessionStop,
    apiCopilotSessionQuery,
    apiCopilotSessionLive,
} from "./copilotApi.js";
import {
    apiTaskList,
    apiTaskStart,
    apiTaskStop,
    apiTaskLive,
    installJobsEntry,
    entry,
} from "./jobsApi.js";

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

// REPO-ROOT: walk up from __dirname until we find a .git folder
function findRepoRoot(startDir: string): string {
    let dir = startDir;
    while (true) {
        if (fs.existsSync(path.join(dir, ".git"))) {
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            // Reached filesystem root without finding .git; fall back to startDir
            return startDir;
        }
        dir = parent;
    }
}
const repoRoot = findRepoRoot(__dirname);

// ---- Static File Serving ----

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

// ---- API Handler ----

async function handleApi(req: http.IncomingMessage, res: http.ServerResponse, apiPath: string): Promise<void> {
    // api/test
    if (apiPath === "test") {
        jsonResponse(res, 200, { message: "Hello, world!" });
        return;
    }

    // api/config
    if (apiPath === "config") {
        await apiConfig(req, res, repoRoot);
        return;
    }

    // api/stop
    if (apiPath === "stop") {
        await apiStop(req, res, server);
        return;
    }

    // api/copilot/models
    if (apiPath === "copilot/models") {
        await apiCopilotModels(req, res);
        return;
    }

    // api/copilot/session/start/{model-id}
    const startMatch = apiPath.match(/^copilot\/session\/start\/(.+)$/);
    if (startMatch) {
        await apiCopilotSessionStart(req, res, startMatch[1]);
        return;
    }

    // api/copilot/session/{session-id}/stop
    const stopMatch = apiPath.match(/^copilot\/session\/([^\/]+)\/stop$/);
    if (stopMatch) {
        await apiCopilotSessionStop(req, res, stopMatch[1]);
        return;
    }

    // api/copilot/session/{session-id}/query
    const queryMatch = apiPath.match(/^copilot\/session\/([^\/]+)\/query$/);
    if (queryMatch) {
        await apiCopilotSessionQuery(req, res, queryMatch[1]);
        return;
    }

    // api/copilot/session/{session-id}/live
    const liveMatch = apiPath.match(/^copilot\/session\/([^\/]+)\/live$/);
    if (liveMatch) {
        await apiCopilotSessionLive(req, res, liveMatch[1]);
        return;
    }

    // api/copilot/task (list all tasks)
    if (apiPath === "copilot/task") {
        await apiTaskList(req, res);
        return;
    }

    // api/copilot/task/start/{task-name}/session/{session-id}
    const taskStartMatch = apiPath.match(/^copilot\/task\/start\/([^\/]+)\/session\/([^\/]+)$/);
    if (taskStartMatch) {
        await apiTaskStart(req, res, taskStartMatch[1], taskStartMatch[2]);
        return;
    }

    // api/copilot/task/{task-id}/stop
    const taskStopMatch = apiPath.match(/^copilot\/task\/([^\/]+)\/stop$/);
    if (taskStopMatch) {
        await apiTaskStop(req, res, taskStopMatch[1]);
        return;
    }

    // api/copilot/task/{task-id}/live
    const taskLiveMatch = apiPath.match(/^copilot\/task\/([^\/]+)\/live$/);
    if (taskLiveMatch) {
        await apiTaskLive(req, res, taskLiveMatch[1]);
        return;
    }

    jsonResponse(res, 404, { error: "Unknown API endpoint" });
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    let pathname = url.pathname;

    // API routes
    if (pathname.startsWith("/api/")) {
        const apiPath = pathname.slice("/api/".length);
        handleApi(req, res, apiPath).catch((err) => {
            console.error("API error:", err);
            jsonResponse(res, 500, { error: String(err) });
        });
        return;
    }

    // Website routes
    if (pathname === "/") {
        pathname = "/index.html";
    }

    const filePath = path.join(assetsDir, pathname);
    serveStaticFile(res, filePath);
});

// Install the jobs entry
installJobsEntry(entry);

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log("Use api/stop to stop the server.");
});
