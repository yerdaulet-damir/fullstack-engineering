import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createConnection } from "node:net";
import test from "node:test";
import { createLiveBoardServer } from "../src/server.mjs";

test("HTTP serves the product, health state, and a bounded 404", async (context) => {
  const running = await startServer();
  context.after(() => running.app.stop());

  const page = await fetch(`${running.httpUrl}/`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type"), /text\/html/);
  assert.match(await page.text(), /Relay support board/);

  const policy = await fetch(`${running.httpUrl}/client-policy.js`);
  assert.equal(policy.status, 200);
  assert.match(policy.headers.get("content-type"), /text\/javascript/);

  const health = await fetch(`${running.httpUrl}/api/health`).then((response) => response.json());
  assert.deepEqual(health, { status: "ok", sequence: 0, connectedSockets: 0, activeAgents: 0 });

  const missing = await fetch(`${running.httpUrl}/nope`);
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: "NOT_FOUND" });
});

test("WebSocket upgrade rejects a missing token", async (context) => {
  const running = await startServer();
  context.after(() => running.app.stop());

  const socket = new WebSocket(`${running.wsUrl}/ws`, "live-board.v1");
  const outcome = await new Promise((resolve) => {
    socket.addEventListener("open", () => resolve("opened"));
    socket.addEventListener("error", () => resolve("rejected"));
  });
  assert.equal(outcome, "rejected");
});

test("clients share ordered events, deduplicate retries, and resume missed work", async (context) => {
  const running = await startServer();
  context.after(() => running.app.stop());
  const first = await connect(running.wsUrl, "agent-1", "Ada");
  const second = await connect(running.wsUrl, "agent-2", "Grace");
  context.after(() => first.socket.close());
  context.after(() => second.socket.close());

  assert.equal((await first.inbox.next("sync")).mode, "snapshot");
  assert.equal((await second.inbox.next("sync")).mode, "snapshot");

  const command = {
    type: "move",
    commandId: "move-once",
    cardId: "issue-1042",
    column: "investigating",
    expectedVersion: 0
  };
  first.socket.send(JSON.stringify(command));
  const firstEvent = await first.inbox.next("event");
  const secondEvent = await second.inbox.next("event");
  assert.equal(firstEvent.event.sequence, 1);
  assert.deepEqual(secondEvent.event, firstEvent.event);

  first.socket.send(JSON.stringify(command));
  const duplicate = await first.inbox.next("command.ack");
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.event.sequence, 1);
  assert.equal(running.app.board.sequence, 1);

  second.socket.close(1000, "network change");
  await second.closed;
  first.socket.send(JSON.stringify({
    type: "move",
    commandId: "move-while-away",
    cardId: "issue-1042",
    column: "waiting",
    expectedVersion: 1
  }));
  assert.equal((await first.inbox.next("event")).event.sequence, 2);

  const resumed = await connect(running.wsUrl, "agent-2", "Grace", 1);
  context.after(() => resumed.socket.close());
  const sync = await resumed.inbox.next("sync");
  assert.equal(sync.mode, "events");
  assert.deepEqual(sync.events.map((event) => event.sequence), [2]);
  assert.equal(sync.events[0].card.column, "waiting");
});

test("a client sequence ahead of the server receives a replacement snapshot", async (context) => {
  const running = await startServer();
  context.after(() => running.app.stop());
  const client = await connect(running.wsUrl, "agent-3", "Lin", 99);
  context.after(() => client.socket.close());

  const sync = await client.inbox.next("sync");
  assert.equal(sync.mode, "snapshot");
  assert.equal(sync.snapshot.sequence, 0);
  assert.equal(sync.snapshot.cards.length, 6);
});

test("WebSocket parser rejects control payloads larger than 125 bytes", async (context) => {
  const running = await startServer();
  context.after(() => running.app.stop());
  const raw = await openRawWebSocket(running.port);
  context.after(() => raw.socket.destroy());

  raw.socket.write(encodeMaskedFrame(0x8, Buffer.alloc(126), { forceExtendedLength: true }));
  const close = await readServerClose(raw.socket, raw.remaining);
  assert.equal(close.code, 1002);
  assert.match(close.reason, /at most 125 bytes/);
});

test("WebSocket parser rejects one-byte close payloads", async (context) => {
  const running = await startServer();
  context.after(() => running.app.stop());
  const raw = await openRawWebSocket(running.port);
  context.after(() => raw.socket.destroy());

  raw.socket.write(encodeMaskedFrame(0x8, Buffer.from([0])));
  const close = await readServerClose(raw.socket, raw.remaining);
  assert.equal(close.code, 1002);
  assert.match(close.reason, /one-byte payload/);
});

async function startServer() {
  const app = createLiveBoardServer({ port: 0, token: "test-token", logger: null });
  const address = await app.start();
  return {
    app,
    port: address.port,
    httpUrl: `http://127.0.0.1:${address.port}`,
    wsUrl: `ws://127.0.0.1:${address.port}`
  };
}

async function openRawWebSocket(port) {
  const socket = createConnection({ host: "127.0.0.1", port });
  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("error", reject);
  });
  const key = randomBytes(16).toString("base64");
  socket.write([
    "GET /ws?token=test-token HTTP/1.1",
    `Host: 127.0.0.1:${port}`,
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Key: ${key}`,
    "Sec-WebSocket-Version: 13",
    "Sec-WebSocket-Protocol: live-board.v1",
    "",
    ""
  ].join("\r\n"));

  let response = Buffer.alloc(0);
  while (!response.includes("\r\n\r\n")) response = Buffer.concat([response, await readSocketChunk(socket)]);
  const boundary = response.indexOf("\r\n\r\n") + 4;
  assert.match(response.subarray(0, boundary).toString(), /^HTTP\/1\.1 101 /);
  return { socket, remaining: response.subarray(boundary) };
}

function encodeMaskedFrame(opcode, payload, { forceExtendedLength = false } = {}) {
  const mask = Buffer.from([0x11, 0x22, 0x33, 0x44]);
  const extended = forceExtendedLength || payload.length >= 126;
  const header = Buffer.alloc(extended ? 4 : 2);
  header[0] = 0x80 | opcode;
  header[1] = 0x80 | (extended ? 126 : payload.length);
  if (extended) header.writeUInt16BE(payload.length, 2);
  const masked = Buffer.from(payload);
  for (let index = 0; index < masked.length; index += 1) masked[index] ^= mask[index % 4];
  return Buffer.concat([header, mask, masked]);
}

async function readServerClose(socket, initial) {
  let buffer = initial;
  while (buffer.length < 2) buffer = Buffer.concat([buffer, await readSocketChunk(socket)]);
  const length = buffer[1] & 0x7f;
  assert.equal(buffer[0] & 0x0f, 0x8);
  assert.ok(length <= 125);
  while (buffer.length < 2 + length) buffer = Buffer.concat([buffer, await readSocketChunk(socket)]);
  const payload = buffer.subarray(2, 2 + length);
  return {
    code: payload.readUInt16BE(0),
    reason: payload.subarray(2).toString()
  };
}

function readSocketChunk(socket) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timed out waiting for socket data")), 2_000);
    socket.once("data", (chunk) => {
      clearTimeout(timeout);
      resolve(chunk);
    });
    socket.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function connect(baseUrl, clientId, name, lastSequence = null) {
  const socket = new WebSocket(`${baseUrl}/ws?token=test-token`, "live-board.v1");
  const inbox = createInbox(socket);
  const closed = new Promise((resolve) => socket.addEventListener("close", resolve, { once: true }));
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  socket.send(JSON.stringify({ type: "hello", clientId, name, lastSequence }));
  return { socket, inbox, closed };
}

function createInbox(socket) {
  const messages = [];
  const waiters = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    const waiterIndex = waiters.findIndex((waiter) => waiter.type === message.type);
    if (waiterIndex >= 0) {
      const [waiter] = waiters.splice(waiterIndex, 1);
      clearTimeout(waiter.timeout);
      waiter.resolve(message);
    } else {
      messages.push(message);
    }
  });

  return {
    next(type, timeoutMs = 2_000) {
      const index = messages.findIndex((message) => message.type === type);
      if (index >= 0) return Promise.resolve(messages.splice(index, 1)[0]);
      return new Promise((resolve, reject) => {
        const waiter = { type, resolve, timeout: null };
        waiter.timeout = setTimeout(() => {
          const current = waiters.indexOf(waiter);
          if (current >= 0) waiters.splice(current, 1);
          reject(new Error(`Timed out waiting for ${type}; queued: ${messages.map((message) => message.type).join(", ")}`));
        }, timeoutMs);
        waiters.push(waiter);
      });
    }
  };
}
