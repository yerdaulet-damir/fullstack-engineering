import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.mjs";
import { MemoryIssueRepository } from "../src/repository.mjs";

test("creates issues and exposes the route contract", async (context) => {
  const app = await buildApp(new MemoryIssueRepository());
  context.after(() => app.close());
  const created = await app.inject({ method: "POST", url: "/issues", payload: { title: "Cursor pagination" } });
  assert.equal(created.statusCode, 201);
  const feed = await app.inject({ method: "GET", url: "/issues?limit=1" });
  assert.equal(feed.json().items[0].title, "Cursor pagination");
  const spec = (await app.inject("/openapi.json")).json();
  assert.ok(spec.paths["/issues"]);
  assert.ok(spec.paths["/issues/{id}/assign"]);
});

test("returns structured validation errors with request IDs", async (context) => {
  const app = await buildApp(new MemoryIssueRepository());
  context.after(() => app.close());
  const response = await app.inject({ method: "POST", url: "/issues", payload: { title: "x" } });
  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error.code, "FST_ERR_VALIDATION");
  assert.ok(response.json().error.requestId);
});

test("assignment records the audit event", async (context) => {
  const repository = new MemoryIssueRepository();
  const app = await buildApp(repository);
  context.after(() => app.close());
  const issue = (await app.inject({ method: "POST", url: "/issues", payload: { title: "Atomic assignment" } })).json();
  const response = await app.inject({ method: "POST", url: `/issues/${issue.id}/assign`, payload: { assigneeId: "user-bob", actorId: "user-alice" } });
  assert.equal(response.statusCode, 200);
  assert.equal(repository.audit.length, 1);
  assert.equal(repository.audit[0].data.assigneeId, "user-bob");
});

test("rejects the malformed cursor fixture", async (context) => {
  const app = await buildApp(new MemoryIssueRepository());
  context.after(() => app.close());
  const fixture = JSON.parse(await (await import("node:fs/promises")).readFile(new URL("../fixtures/invalid-cursor.json", import.meta.url), "utf8"));
  const response = await app.inject(`/issues?cursor=${encodeURIComponent(fixture.cursor)}`);
  assert.equal(response.statusCode, fixture.expectedStatus);
  assert.equal(response.json().error.code, fixture.expectedCode);
});
