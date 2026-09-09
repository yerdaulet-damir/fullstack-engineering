import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { AppError, badRequest, notFound, unauthorized } from "./errors.mjs";
import { renderDemoPage } from "./ui.mjs";
import { createDemoWebhookCredentialStore } from "./webhook-credentials.mjs";

function sendJson(response, status, body, requestId) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "x-request-id": requestId });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64 * 1024) throw badRequest("Request body exceeds 64 KiB");
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw badRequest("Request body must be valid JSON");
  }
}

function principalFrom(request) {
  const userId = request.headers["x-user-id"];
  const tenantId = request.headers["x-tenant-id"];
  if (typeof userId !== "string" || typeof tenantId !== "string") throw unauthorized();
  return { userId, tenantId };
}

export function createHttpServer({ service, webhookCredentials = createDemoWebhookCredentialStore() }) {
  return createServer(async (request, response) => {
    const requestId = typeof request.headers["x-request-id"] === "string" ? request.headers["x-request-id"] : randomUUID();
    const url = new URL(request.url ?? "/", "http://localhost");
    try {
      if (request.method === "GET" && url.pathname === "/") {
        response.writeHead(200, { "content-type": "text/html; charset=utf-8", "x-request-id": requestId });
        response.end(renderDemoPage());
        return;
      }
      if (request.method === "GET" && url.pathname === "/health") return sendJson(response, 200, { status: "ok" }, requestId);
      if (request.method === "GET" && url.pathname === "/api/context") return sendJson(response, 200, { data: service.getContext(principalFrom(request)) }, requestId);
      if (request.method === "GET" && url.pathname === "/api/issues") return sendJson(response, 200, { data: service.listIssues(principalFrom(request)) }, requestId);
      if (request.method === "POST" && url.pathname === "/api/issues") return sendJson(response, 201, { data: service.createIssue(principalFrom(request), await readJson(request)) }, requestId);
      const issueMatch = url.pathname.match(/^\/api\/issues\/([^/]+)$/);
      if (request.method === "GET" && issueMatch) return sendJson(response, 200, { data: service.getIssue(principalFrom(request), decodeURIComponent(issueMatch[1])) }, requestId);
      if (request.method === "PATCH" && issueMatch) return sendJson(response, 200, { data: service.updateIssue(principalFrom(request), decodeURIComponent(issueMatch[1]), await readJson(request)) }, requestId);
      if (request.method === "POST" && url.pathname === "/api/digests") return sendJson(response, 202, { data: service.queueDigest(principalFrom(request), await readJson(request)) }, requestId);
      if (request.method === "POST" && url.pathname === "/api/jobs/run") return sendJson(response, 200, { data: await service.runNextJob(principalFrom(request)) }, requestId);
      if (request.method === "GET" && url.pathname === "/api/dead-letters") return sendJson(response, 200, { data: service.listDeadLetters(principalFrom(request)) }, requestId);
      if (request.method === "GET" && url.pathname === "/api/audit") return sendJson(response, 200, { data: service.listAudit(principalFrom(request)) }, requestId);
      const webhookMatch = url.pathname.match(/^\/api\/webhooks\/([^/]+)$/);
      if (request.method === "POST" && webhookMatch) {
        const webhookIdentity = webhookCredentials.authenticate({
          tenantId: request.headers["x-tenant-id"],
          source: decodeURIComponent(webhookMatch[1]),
          secret: request.headers["x-webhook-secret"]
        });
        if (!webhookIdentity) throw unauthorized();
        const outcome = await service.receiveWebhook({ webhookIdentity, deliveryId: request.headers["x-delivery-id"], payload: await readJson(request) });
        return sendJson(response, outcome.status === "duplicate" ? 200 : 202, { data: outcome }, requestId);
      }
      throw notFound("Route");
    } catch (error) {
      const known = error instanceof AppError;
      sendJson(response, known ? error.status : 500, { error: { code: known ? error.code : "INTERNAL_ERROR", message: known ? error.message : "The request could not be completed", requestId, ...(known && error.details ? { details: error.details } : {}) } }, requestId);
    }
  });
}
