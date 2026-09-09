import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../src/errors.mjs";
import { createTeamSaas } from "../src/service.mjs";

const acmeOwner = { tenantId: "acme", userId: "alice" };
const acmeViewer = { tenantId: "acme", userId: "viv" };
const globexOwner = { tenantId: "globex", userId: "bob" };

test("lists only issues belonging to the verified tenant membership", () => {
  const app = createTeamSaas();
  assert.deepEqual(app.listIssues(acmeOwner).map((issue) => issue.id), ["issue-acme-1"]);
  assert.deepEqual(app.listIssues(globexOwner).map((issue) => issue.id), ["issue-globex-1"]);
});

test("known cross-tenant issue IDs remain unavailable for reads and writes", () => {
  const app = createTeamSaas();
  assert.throws(() => app.getIssue(acmeOwner, "issue-globex-1"), (error) => error instanceof AppError && error.status === 404);
  assert.throws(() => app.updateIssue(acmeOwner, "issue-globex-1", { status: "closed" }), (error) => error instanceof AppError && error.status === 404);
  assert.equal(app.listIssues(globexOwner)[0].status, "open");
});

test("roles come from membership and viewer writes are denied", () => {
  const app = createTeamSaas();
  assert.throws(() => app.createIssue(acmeViewer, { title: "Viewer write" }), (error) => error instanceof AppError && error.status === 403);
  assert.throws(() => app.listIssues({ tenantId: "globex", userId: "alice", role: "owner" }), (error) => error instanceof AppError && error.status === 403);
});

test("audit history is immutable and tenant-scoped", () => {
  const app = createTeamSaas();
  app.createIssue(acmeOwner, { title: "Acme-only audit" });
  app.createIssue(globexOwner, { title: "Globex-only audit" });
  const acmeAudit = app.listAudit(acmeOwner);
  assert.equal(acmeAudit.length, 1);
  assert.equal(acmeAudit[0].tenantId, "acme");
  acmeAudit[0].action = "tampered";
  assert.equal(app.listAudit(acmeOwner)[0].action, "issue.created");
});
