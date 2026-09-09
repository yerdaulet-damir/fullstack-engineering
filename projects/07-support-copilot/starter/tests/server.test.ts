import assert from "node:assert/strict";
import test from "node:test";
import { createSupportServer } from "../src/server.js";

async function withServer(run: (origin: string) => Promise<void>) {
  const server = createSupportServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address !== "string");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("serves the browser lab and health metadata", async () => {
  await withServer(async (origin) => {
    const page = await fetch(origin);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Support Copilot Lab/);
    const health = await fetch(`${origin}/api/health`);
    assert.deepEqual(await health.json(), { status: "ok", provider: "deterministic-local", corpus: "v1" });
  });
});

test("streams retrieval evidence before the completed answer", async () => {
  await withServer(async (origin) => {
    const response = await fetch(`${origin}/api/answer`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "How do I reset my password?" }),
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /application\/x-ndjson/);
    const events = (await response.text()).trim().split("\n").map((line) => JSON.parse(line));
    const types = events.map((event) => event.type);
    assert(types.indexOf("retrieval.completed") < types.indexOf("response.delta"));
    assert.equal(events.at(-1).type, "response.completed");
    assert.equal(events.at(-1).output.grounded, true);
  });
});

test("rejects empty questions before starting a model run", async () => {
  await withServer(async (origin) => {
    const response = await fetch(`${origin}/api/answer`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: " " }),
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, "INVALID_QUERY");
  });
});
