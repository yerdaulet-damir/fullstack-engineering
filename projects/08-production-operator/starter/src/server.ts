import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http";
import { OperatorError, toOperatorError } from "./errors.js";
import { approvalUi } from "./ui.js";
import { OperatorService } from "./workflow.js";

type JsonObject = Record<string, unknown>;

async function readJson(request: IncomingMessage): Promise<JsonObject> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > 64 * 1024) throw new OperatorError("BODY_TOO_LARGE", "Request body exceeds 64 KiB", 413);
    chunks.push(buffer);
  }
  if (chunks.length === 0) return {};
  try {
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("object required");
    return parsed as JsonObject;
  } catch {
    throw new OperatorError("INVALID_JSON", "Request body must be a JSON object", 400);
  }
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(`${JSON.stringify(body, null, 2)}\n`);
}

function requiredString(body: JsonObject, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new OperatorError("INVALID_REQUEST", `${key} must be a non-empty string`, 422);
  }
  return value.trim();
}

export function createOperatorServer(service: OperatorService) {
  return createHttpServer(async (request, response) => {
    try {
      const method = request.method ?? "GET";
      const url = new URL(request.url ?? "/", "http://localhost");

      if (method === "GET" && url.pathname === "/") {
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        response.end(approvalUi);
        return;
      }

      if (method === "GET" && url.pathname === "/api/workflows") {
        sendJson(response, 200, await service.list());
        return;
      }

      if (method === "POST" && url.pathname === "/api/workflows") {
        const body = await readJson(request);
        const requestedAmountCents = body.requestedAmountCents;
        if (!Number.isInteger(requestedAmountCents)) {
          throw new OperatorError("INVALID_REQUEST", "requestedAmountCents must be an integer", 422);
        }
        const workflow = await service.prepare({
          accountId: requiredString(body, "accountId"),
          issue: requiredString(body, "issue"),
          requestedAmountCents: Number(requestedAmountCents)
        });
        sendJson(response, 201, workflow);
        return;
      }

      const match = url.pathname.match(/^\/api\/workflows\/([^/]+)(?:\/(approve|reject|execute|retry|cancel))?$/);
      if (!match?.[1]) throw new OperatorError("ROUTE_NOT_FOUND", "Route not found", 404);
      const workflowId = decodeURIComponent(match[1]);
      const action = match[2];

      if (method === "GET" && !action) {
        sendJson(response, 200, await service.get(workflowId));
        return;
      }
      if (method !== "POST" || !action) throw new OperatorError("ROUTE_NOT_FOUND", "Route not found", 404);

      const body = await readJson(request);
      if (action === "approve") {
        sendJson(
          response,
          200,
          await service.approve(
            workflowId,
            requiredString(body, "reviewerId"),
            requiredString(body, "proposalDigest")
          )
        );
      } else if (action === "reject") {
        sendJson(
          response,
          200,
          await service.reject(workflowId, requiredString(body, "reviewerId"), requiredString(body, "reason"))
        );
      } else if (action === "execute") {
        sendJson(response, 200, await service.execute(workflowId));
      } else if (action === "retry") {
        sendJson(response, 200, await service.retry(workflowId));
      } else {
        sendJson(response, 200, await service.cancel(workflowId));
      }
    } catch (error) {
      const failure = toOperatorError(error);
      sendJson(response, failure.statusCode, {
        error: { code: failure.code, message: failure.message, retryable: failure.retryable }
      });
    }
  });
}
