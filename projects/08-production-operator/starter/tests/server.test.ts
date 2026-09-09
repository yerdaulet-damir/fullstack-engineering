import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { createOperatorServer } from "../src/server.js";
import { createHarness } from "./helpers.js";

test("HTTP flow exposes evidence, exact approval, execution, and persisted reads", async (context) => {
  const { service, gateway } = await createHarness();
  const server = createOperatorServer(service);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => server.close());
  const address = server.address() as AddressInfo;
  const origin = `http://127.0.0.1:${address.port}`;

  const page = await fetch(origin);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Approve exact proposal/);

  const createdResponse = await fetch(`${origin}/api/workflows`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      accountId: "acct-api",
      issue: "Duplicate API charge",
      requestedAmountCents: 1900
    })
  });
  assert.equal(createdResponse.status, 201);
  const created = (await createdResponse.json()) as { id: string; status: string; proposalDigest: string; evidence: unknown[] };
  assert.equal(created.status, "awaiting_approval");
  assert.equal(created.evidence.length, 1);

  const wrongApproval = await fetch(`${origin}/api/workflows/${created.id}/approve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reviewerId: "api-reviewer", proposalDigest: "wrong" })
  });
  assert.equal(wrongApproval.status, 409);

  const approved = await fetch(`${origin}/api/workflows/${created.id}/approve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reviewerId: "api-reviewer", proposalDigest: created.proposalDigest })
  });
  assert.equal(approved.status, 200);

  const executed = await fetch(`${origin}/api/workflows/${created.id}/execute`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}"
  });
  assert.equal(executed.status, 200);
  const completed = (await executed.json()) as { status: string; result: { amountCents: number } };
  assert.equal(completed.status, "completed");
  assert.equal(completed.result.amountCents, 1900);
  assert.equal(await gateway.count(), 1);

  const persisted = await fetch(`${origin}/api/workflows/${created.id}`);
  assert.equal((await persisted.json()).status, "completed");
});
