import Fastify from "fastify";
import swagger from "@fastify/swagger";

const issueSchema = {
  type: "object",
  required: ["id", "title", "status", "assigneeId", "createdAt"],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    status: { type: "string", enum: ["open", "closed"] },
    assigneeId: { anyOf: [{ type: "string" }, { type: "null" }] },
    createdAt: { type: "string" }
  }
};

export async function buildApp(repository, options = {}) {
  const app = Fastify({ logger: options.logger ?? false, genReqId: () => crypto.randomUUID() });
  await app.register(swagger, { openapi: { info: { title: "Issue API", version: "1.0.0" } } });

  app.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      error: { code: error.code ?? (statusCode === 400 ? "INVALID_REQUEST" : "INTERNAL_ERROR"), message: error.message, requestId: request.id }
    });
  });

  app.get("/health", { schema: { response: { 200: { type: "object", required: ["status"], properties: { status: { const: "ok" } } } } } }, async () => ({ status: "ok" }));
  app.get("/users", async () => repository.listUsers());
  app.get("/issues", {
    schema: {
      querystring: { type: "object", properties: { cursor: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 50, default: 20 } } },
      response: { 200: { type: "object", required: ["items", "nextCursor"], properties: { items: { type: "array", items: issueSchema }, nextCursor: { anyOf: [{ type: "string" }, { type: "null" }] } } } }
    }
  }, async (request) => repository.listIssues(request.query));
  app.post("/issues", {
    schema: { body: { type: "object", additionalProperties: false, required: ["title"], properties: { title: { type: "string", minLength: 3, maxLength: 160 } } }, response: { 201: issueSchema } }
  }, async (request, reply) => reply.status(201).send(await repository.createIssue(request.body)));
  app.post("/issues/:id/comments", {
    schema: { params: { type: "object", required: ["id"], properties: { id: { type: "string" } } }, body: { type: "object", additionalProperties: false, required: ["body"], properties: { body: { type: "string", minLength: 1, maxLength: 2000 } } } }
  }, async (request, reply) => reply.status(201).send(await repository.addComment(request.params.id, request.body.body)));
  app.post("/issues/:id/assign", {
    schema: { params: { type: "object", required: ["id"], properties: { id: { type: "string" } } }, body: { type: "object", additionalProperties: false, required: ["assigneeId", "actorId"], properties: { assigneeId: { type: "string" }, actorId: { type: "string" } } } }
  }, async (request) => repository.assignIssue(request.params.id, request.body.assigneeId, request.body.actorId));
  app.get("/openapi.json", { schema: { hide: true } }, async () => app.swagger());
  app.addHook("onClose", async () => repository.close?.());
  await app.ready();
  return app;
}
