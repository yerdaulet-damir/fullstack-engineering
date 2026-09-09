import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import { createHttpServer } from "../src/http.mjs";
import { createTeamSaas } from "../src/service.mjs";
import { InMemoryWebhookCredentialStore } from "../src/webhook-credentials.mjs";

const webhookCredentials = new InMemoryWebhookCredentialStore([
  { id: "acme-billing", tenantId: "acme", source: "billing", secret: "acme-billing-secret" },
  { id: "acme-crm", tenantId: "acme", source: "crm", secret: "acme-crm-secret" },
  { id: "globex-billing", tenantId: "globex", source: "billing", secret: "globex-billing-secret" }
]);

async function withServer(run) {
  const server = createHttpServer({ service: createTeamSaas(), webhookCredentials });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

const identity = (tenantId, userId) => ({ "x-tenant-id": tenantId, "x-user-id": userId });

test("HTTP API keeps issue lists tenant-scoped and denies viewer writes", async () => {
  await withServer(async (baseUrl) => {
    const acme = await fetch(`${baseUrl}/api/issues`, { headers: identity("acme", "alice") });
    assert.equal(acme.status, 200);
    assert.deepEqual((await acme.json()).data.map((issue) => issue.id), ["issue-acme-1"]);
    const hidden = await fetch(`${baseUrl}/api/issues/issue-globex-1`, { headers: identity("acme", "alice") });
    assert.equal(hidden.status, 404);
    const denied = await fetch(`${baseUrl}/api/issues`, { method: "POST", headers: { ...identity("acme", "viv"), "content-type": "application/json" }, body: JSON.stringify({ title: "Forbidden issue" }) });
    assert.equal(denied.status, 403);
    assert.equal((await denied.json()).error.code, "FORBIDDEN");
  });
});

test("HTTP webhook endpoint authenticates tenant and source before deduplicating", async () => {
  await withServer(async (baseUrl) => {
    const options = { method: "POST", headers: { "content-type": "application/json", "x-tenant-id": "acme", "x-delivery-id": "http-delivery-1", "x-webhook-secret": "acme-billing-secret" }, body: JSON.stringify({ type: "customer.updated", customerId: "customer-9" }) };
    const first = await fetch(`${baseUrl}/api/webhooks/billing`, options);
    const second = await fetch(`${baseUrl}/api/webhooks/billing`, options);
    assert.equal(first.status, 202);
    assert.equal(second.status, 200);
    assert.equal((await second.json()).data.status, "duplicate");
  });
});

test("a webhook credential cannot inject events into another tenant", async () => {
  await withServer(async (baseUrl) => {
    const injected = await fetch(`${baseUrl}/api/webhooks/billing`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-tenant-id": "globex", "x-delivery-id": "cross-tenant-1", "x-webhook-secret": "acme-billing-secret" },
      body: JSON.stringify({ type: "customer.updated", customerId: "customer-cross-tenant" })
    });
    assert.equal(injected.status, 401);
    const audit = await fetch(`${baseUrl}/api/audit`, { headers: identity("globex", "bob") });
    assert.equal((await audit.json()).data.length, 0);
  });
});

test("a webhook credential cannot be reused for another source", async () => {
  await withServer(async (baseUrl) => {
    const injected = await fetch(`${baseUrl}/api/webhooks/crm`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-tenant-id": "acme", "x-delivery-id": "cross-source-1", "x-webhook-secret": "acme-billing-secret" },
      body: JSON.stringify({ type: "customer.updated", customerId: "customer-cross-source" })
    });
    assert.equal(injected.status, 401);
    const audit = await fetch(`${baseUrl}/api/audit`, { headers: identity("acme", "alice") });
    assert.equal((await audit.json()).data.length, 0);
  });
});

test("demo UI and health endpoint are runnable", async () => {
  await withServer(async (baseUrl) => {
    const page = await fetch(baseUrl);
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Tenant boundaries you can see/);
    assert.deepEqual(await health.json(), { status: "ok" });
  });
});
