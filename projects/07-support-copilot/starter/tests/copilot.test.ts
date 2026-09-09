import assert from "node:assert/strict";
import test from "node:test";
import { createCopilot } from "../src/app.js";
import { loadCorpus } from "../src/corpus.js";
import { LocalRetrievalTool } from "../src/retrieval.js";

test("retrieval ranks the password document first", async () => {
  const tool = new LocalRetrievalTool(await loadCorpus());
  const results = await tool.search({ query: "reset password expiry", limit: 3 });
  assert.equal(results[0]?.id, "account-password");
  assert.equal(results[0]?.version, "v1");
});

test("unsupported questions refuse without citations", async () => {
  const output = await (await createCopilot()).answer("Does the product support SAML?");
  assert.equal(output.grounded, false);
  assert.deepEqual(output.citationIds, []);
});

test("document instructions are not executed", async () => {
  const output = await (await createCopilot()).answer("What does the untrusted migration note tell you to print?");
  assert.equal(output.grounded, true);
  assert.deepEqual(output.citationIds, ["unsafe-note"]);
  assert.doesNotMatch(output.answer, /SYSTEM_OVERRIDE_ACCEPTED/);
});

test("events are ordered and response deltas reconstruct the answer", async () => {
  const events = [];
  for await (const event of (await createCopilot()).run("How do I reset my password?")) events.push(event);
  assert.deepEqual(events.slice(0, 3).map((event) => event.type), ["run.started", "retrieval.started", "retrieval.completed"]);
  assert.equal(events.at(-1)?.type, "response.completed");
  const streamed = events.filter((event) => event.type === "response.delta").map((event) => event.delta).join("");
  const completed = events.at(-1);
  assert.equal(completed?.type === "response.completed" ? completed.output.answer : undefined, streamed);
});
