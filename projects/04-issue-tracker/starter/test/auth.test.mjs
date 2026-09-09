import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildApp } from "../src/app.mjs";
import { TrackerStore } from "../src/store.mjs";

async function signIn(app, email) {
  const response = await app.inject({ method: "POST", url: "/session", payload: { email } });
  return response.headers["set-cookie"].split(";")[0];
}

test("requires a server-side session", async (context) => {
  const app = await buildApp(new TrackerStore());
  context.after(() => app.close());
  assert.equal((await app.inject("/api/projects")).statusCode, 401);
  const cookie = await signIn(app, "alice@example.test");
  const response = await app.inject({ url: "/api/projects", headers: { cookie } });
  assert.deepEqual(response.json(), [{ id: "project-alice", name: "Alice private project" }]);
});

test("cross-account reads and writes do not reveal private projects", async (context) => {
  const fixture = JSON.parse(await readFile(new URL("../fixtures/cross-user-private-project.json", import.meta.url), "utf8"));
  const store = new TrackerStore();
  const app = await buildApp(store);
  context.after(() => app.close());
  const cookie = await signIn(app, fixture.actorEmail);
  const read = await app.inject({ url: `/api/projects/${fixture.targetProjectId}`, headers: { cookie } });
  const write = await app.inject({ method: "POST", url: `/api/projects/${fixture.targetProjectId}/issues`, headers: { cookie }, payload: { title: "Unauthorized write" } });
  assert.equal(read.statusCode, fixture.expectedStatus);
  assert.equal(write.statusCode, fixture.expectedStatus);
  assert.equal(store.issues.length, 0);
});

test("authorized owners can create issues and prepare uploads", async (context) => {
  const app = await buildApp(new TrackerStore());
  context.after(() => app.close());
  const cookie = await signIn(app, "bob@example.test");
  const issue = await app.inject({ method: "POST", url: "/api/projects/project-bob/issues", headers: { cookie }, payload: { title: "Owner write" } });
  const upload = await app.inject({ method: "POST", url: "/api/projects/project-bob/attachments/prepare", headers: { cookie }, payload: { contentType: "image/png" } });
  assert.equal(issue.statusCode, 201);
  assert.equal(upload.statusCode, 200);
  assert.equal(upload.json().maxBytes, 5_000_000);
});
