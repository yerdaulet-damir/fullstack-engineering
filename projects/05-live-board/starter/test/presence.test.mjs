import assert from "node:assert/strict";
import test from "node:test";
import { PresenceTracker } from "../src/presence.mjs";

test("presence is renewed by heartbeat and expires without touching board data", () => {
  let now = 1_000;
  const presence = new PresenceTracker({ ttlMs: 100, clock: () => now });

  presence.heartbeat("agent-1", "Ada");
  now = 1_090;
  presence.heartbeat("agent-1", "Ada");
  now = 1_150;
  presence.heartbeat("agent-2", "Grace");

  assert.deepEqual(presence.list().map((agent) => agent.clientId), ["agent-1", "agent-2"]);
  now = 1_191;
  assert.deepEqual(presence.sweep(), ["agent-1"]);
  assert.deepEqual(presence.list().map((agent) => agent.clientId), ["agent-2"]);
});

test("presence rejects malformed identities", () => {
  const presence = new PresenceTracker();
  assert.throws(() => presence.heartbeat("contains spaces", "Ada"), /unsupported/);
  assert.throws(() => presence.heartbeat("agent-1", ""), /1 to 48/);
});
