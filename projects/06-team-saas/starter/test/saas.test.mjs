import assert from "node:assert/strict";
import test from "node:test";
import { TeamSaas } from "../src/saas.mjs";

test("isolates tenant data and denies viewer writes", () => {
  const app = new TeamSaas();
  app.createIssue({ tenantId: "acme", role: "member", title: "A", actorId: "u1" });
  app.createIssue({ tenantId: "globex", role: "member", title: "B", actorId: "u2" });
  assert.deepEqual(app.listIssues({ tenantId: "acme", role: "viewer" }).map((issue) => issue.title), ["A"]);
  assert.throws(() => app.createIssue({ tenantId: "acme", role: "viewer", title: "C", actorId: "u3" }), /FORBIDDEN/);
  assert.equal(app.audit.length, 2);
});

test("dead-letters failed jobs after bounded retries", () => {
  const app = new TeamSaas();
  app.enqueue({ id: "digest-1", tenantId: "acme" });
  assert.equal(app.runNext(() => { throw new Error("mail down"); }, 2), "retrying");
  assert.equal(app.runNext(() => { throw new Error("mail down"); }, 2), "dead-lettered");
  assert.equal(app.deadLetters.length, 1);
});

test("deduplicates webhook deliveries", () => {
  const app = new TeamSaas();
  let calls = 0;
  assert.equal(app.receiveWebhook("delivery-1", () => calls++), "processed");
  assert.equal(app.receiveWebhook("delivery-1", () => calls++), "duplicate");
  assert.equal(calls, 1);
});
