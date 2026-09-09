import assert from "node:assert/strict";
import test from "node:test";
import { ReconnectPolicy, validatedIdentity } from "../public/client-policy.js";

test("reconnect attempts reset only when the session is marked ready", () => {
  const policy = new ReconnectPolicy({ random: () => 0.5 });

  assert.equal(policy.nextDelay(), 400);
  assert.equal(policy.attempt, 1);
  assert.equal(policy.nextDelay(), 800);
  assert.equal(policy.attempt, 2);

  policy.markSessionReady();
  assert.equal(policy.attempt, 0);
  assert.equal(policy.nextDelay(), 400);
});

test("persisted identity is accepted only when ID and name satisfy protocol constraints", () => {
  assert.deepEqual(validatedIdentity({ clientId: "agent_01-safe", name: "  Ada  " }), {
    clientId: "agent_01-safe",
    name: "Ada"
  });
  assert.equal(validatedIdentity({ clientId: "agent with spaces", name: "Ada" }), null);
  assert.equal(validatedIdentity({ clientId: "agent-1", name: "   " }), null);
  assert.equal(validatedIdentity({ clientId: "agent-1", name: "x".repeat(49) }), null);
  assert.equal(validatedIdentity(JSON.parse("null")), null);
});
