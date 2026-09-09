import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryWebhookInbox } from "../src/webhooks.mjs";
import { createTeamSaas } from "../src/service.mjs";

test("completed webhook deliveries are processed once per tenant and source", async () => {
  const app = createTeamSaas();
  const delivery = { webhookIdentity: { kind: "webhook", tenantId: "acme", source: "billing", credentialId: "acme-billing" }, deliveryId: "delivery-1", payload: { type: "customer.updated", customerId: "customer-7" } };
  assert.equal((await app.receiveWebhook(delivery)).status, "processed");
  assert.equal((await app.receiveWebhook(delivery)).status, "duplicate");
  assert.equal(app.auditLog.list({ tenantId: "acme" }).filter((event) => event.action === "webhook.processed").length, 1);
});

test("failed webhook handling releases the delivery for a later retry", async () => {
  const inbox = new InMemoryWebhookInbox();
  const delivery = { tenantId: "acme", source: "billing", deliveryId: "delivery-2", payload: {} };
  await assert.rejects(inbox.process(delivery, async () => { throw new Error("database unavailable"); }), /database unavailable/);
  assert.equal((await inbox.process(delivery, async () => ({ accepted: true }))).status, "processed");
});
