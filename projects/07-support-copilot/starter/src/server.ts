import { createServer as createNodeServer, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createCopilot } from "./app.js";

const assets = {
  "/": { file: "../public/index.html", type: "text/html; charset=utf-8" },
  "/app.js": { file: "../public/app.js", type: "text/javascript; charset=utf-8" },
  "/styles.css": { file: "../public/styles.css", type: "text/css; charset=utf-8" },
} as const;

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readJson(request: NodeJS.ReadableStream) {
  let raw = "";
  for await (const chunk of request) raw += chunk;
  if (raw.length > 10_000) throw new Error("REQUEST_TOO_LARGE");
  return JSON.parse(raw || "{}");
}

export function createSupportServer() {
  return createNodeServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");

    if (request.method === "GET" && url.pathname in assets) {
      const asset = assets[url.pathname as keyof typeof assets];
      response.writeHead(200, { "content-type": asset.type });
      response.end(await readFile(new URL(asset.file, import.meta.url)));
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, { status: "ok", provider: "deterministic-local", corpus: "v1" });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/answer") {
      try {
        const body = await readJson(request);
        const query = typeof body.query === "string" ? body.query.trim() : "";
        if (query.length < 3 || query.length > 500) {
          sendJson(response, 400, { error: { code: "INVALID_QUERY", message: "Query must contain 3–500 characters." } });
          return;
        }

        response.writeHead(200, {
          "content-type": "application/x-ndjson; charset=utf-8",
          "cache-control": "no-cache, no-transform",
          connection: "keep-alive",
        });
        const copilot = await createCopilot();
        for await (const event of copilot.run(query)) response.write(`${JSON.stringify(event)}\n`);
        response.end();
      } catch (error) {
        if (!response.headersSent) {
          sendJson(response, 400, { error: { code: "INVALID_REQUEST", message: error instanceof Error ? error.message : "Invalid request" } });
        } else {
          response.end(`${JSON.stringify({ type: "run.failed", message: "The stream failed." })}\n`);
        }
      }
      return;
    }

    sendJson(response, 404, { error: { code: "NOT_FOUND", message: "Route not found." } });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 3007);
  createSupportServer().listen(port, () => console.log(`Support copilot: http://localhost:${port}`));
}
