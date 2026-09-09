import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryDigestSender, InMemoryJobQueue } from "../src/jobs.mjs";
import { createTeamSaas } from "../src/service.mjs";

const acmeOwner = { tenantId: "acme", userId: "alice" };
const globexOwner = { tenantId: "globex", userId: "bob" };

test("idempotency keys deduplicate queued work within a tenant", () => {
  const app = createTeamSaas();
  const first = app.queueDigest(acmeOwner, { idempotencyKey: "daily-1" });
  const duplicate = app.queueDigest(acmeOwner, { idempotencyKey: "daily-1" });
  const otherTenant = app.queueDigest(globexOwner, { idempotencyKey: "daily-1" });
  assert.equal(first.duplicate, false);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.job.id, first.job.id);
  assert.equal(otherTenant.duplicate, false);
});

test("failed jobs retry to a limit and then dead-letter inside their tenant", async () => {
  let sequence = 0;
  const app = createTeamSaas({ jobQueue: new InMemoryJobQueue({ newId: () => `job-${++sequence}` }), digestSender: new InMemoryDigestSender({ failuresBeforeSuccess: 5 }) });
  app.queueDigest(acmeOwner, { idempotencyKey: "failing-digest" });
  assert.equal((await app.runNextJob(acmeOwner)).status, "retrying");
  assert.equal((await app.runNextJob(acmeOwner)).status, "retrying");
  assert.equal((await app.runNextJob(acmeOwner)).status, "dead-lettered");
  assert.equal(app.listDeadLetters(acmeOwner).length, 1);
  assert.equal(app.listDeadLetters(globexOwner).length, 0);
});

test("a transient provider failure retries and records one digest delivery", async () => {
  const sender = new InMemoryDigestSender({ failuresBeforeSuccess: 1 });
  const app = createTeamSaas({ digestSender: sender });
  app.queueDigest(acmeOwner, { idempotencyKey: "recovering-digest" });
  assert.equal((await app.runNextJob(acmeOwner)).status, "retrying");
  assert.equal((await app.runNextJob(acmeOwner)).status, "completed");
  assert.equal(sender.deliveries({ tenantId: "acme" }).length, 1);
});
