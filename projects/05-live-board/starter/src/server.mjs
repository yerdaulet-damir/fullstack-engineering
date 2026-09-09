import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { LiveBoard, BoardError, seedCards } from "./board.mjs";
import { PresenceTracker } from "./presence.mjs";
import { acceptWebSocket, rejectUpgrade } from "./websocket.mjs";

const PROTOCOL = "live-board.v1";
const publicDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const staticFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/client-policy.js", ["client-policy.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]]
]);

export function createLiveBoardServer({
  board = new LiveBoard(seedCards()),
  host = "127.0.0.1",
  port = 3005,
  token = "local-development-token",
  presenceTtlMs = 15_000,
  presenceSweepMs = 1_000,
  logger = console
} = {}) {
  const presence = new PresenceTracker({ ttlMs: presenceTtlMs });
  const peers = new Set();
  const peersByClient = new Map();

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return sendJson(response, 200, {
        status: "ok",
        sequence: board.sequence,
        connectedSockets: peers.size,
        activeAgents: presence.list().length
      });
    }

    if (request.method === "GET" && url.pathname === "/api/snapshot") {
      return sendJson(response, 200, { ...board.snapshot(), presence: presence.list() });
    }

    const staticFile = request.method === "GET" ? staticFiles.get(url.pathname) : null;
    if (staticFile) {
      try {
        const body = await readFile(join(publicDirectory, staticFile[0]));
        response.writeHead(200, {
          "Content-Type": staticFile[1],
          "Content-Length": body.length,
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff"
        });
        return response.end(body);
      } catch {
        return sendJson(response, 500, { error: "STATIC_FILE_UNAVAILABLE" });
      }
    }

    return sendJson(response, 404, { error: "NOT_FOUND" });
  });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    if (url.pathname !== "/ws") return rejectUpgrade(socket, 400, "Unknown WebSocket endpoint");
    if (url.searchParams.get("token") !== token) return rejectUpgrade(socket, 401, "Invalid board token");

    const peer = acceptWebSocket(request, socket, head, { protocol: PROTOCOL });
    if (!peer) return;

    peers.add(peer);
    let session = null;
    const helloTimeout = setTimeout(() => peer.close(1008, "hello message required"), 5_000);
    helloTimeout.unref();

    peer.on("message", (text) => {
      let message;
      try {
        message = JSON.parse(text);
      } catch {
        return peer.sendJSON({ type: "protocol.error", code: "INVALID_JSON", message: "Message must be JSON" });
      }

      if (!session) {
        if (message?.type !== "hello") return peer.close(1008, "hello message required");
        try {
          presence.heartbeat(message.clientId, message.name);
        } catch (error) {
          return peer.close(1008, error.message);
        }

        session = { clientId: message.clientId, name: message.name.trim() };
        clearTimeout(helloTimeout);
        const previous = peersByClient.get(session.clientId);
        if (previous && previous !== peer) previous.close(4001, "replaced by a newer connection");
        peersByClient.set(session.clientId, peer);
        sendRecovery(peer, message.lastSequence);
        broadcastPresence();
        return;
      }

      try {
        if (message?.type === "heartbeat") {
          presence.heartbeat(session.clientId, session.name);
          return peer.sendJSON({ type: "heartbeat.ack", now: Date.now() });
        }
        if (message?.type === "sync.request") return sendRecovery(peer, message.lastSequence);
        if (message?.type === "move") {
          presence.heartbeat(session.clientId, session.name);
          const result = board.move({
            commandId: message.commandId,
            actorId: session.clientId,
            cardId: message.cardId,
            column: message.column,
            expectedVersion: message.expectedVersion
          });
          if (result.duplicate) {
            return peer.sendJSON({ type: "command.ack", duplicate: true, event: result.event });
          }
          broadcast({ type: "event", event: result.event });
          return;
        }
        peer.sendJSON({ type: "protocol.error", code: "UNKNOWN_MESSAGE", message: "Unknown message type" });
      } catch (error) {
        if (error instanceof BoardError) {
          peer.sendJSON({
            type: "command.rejected",
            commandId: message?.commandId ?? null,
            code: error.code,
            message: error.message,
            ...error.details
          });
          return;
        }
        logger?.error?.(error);
        peer.sendJSON({ type: "protocol.error", code: "INTERNAL_ERROR", message: "Command failed" });
      }
    });

    peer.on("close", () => {
      clearTimeout(helloTimeout);
      peers.delete(peer);
      if (session && peersByClient.get(session.clientId) === peer) peersByClient.delete(session.clientId);
    });
  });

  const presenceTimer = setInterval(() => {
    if (presence.sweep().length > 0) broadcastPresence();
  }, presenceSweepMs);
  presenceTimer.unref();

  function sendRecovery(peer, lastSequence) {
    if (Number.isInteger(lastSequence) && lastSequence >= 0 && lastSequence <= board.sequence) {
      peer.sendJSON({
        type: "sync",
        mode: "events",
        sequence: board.sequence,
        events: board.eventsAfter(lastSequence),
        presence: presence.list()
      });
      return;
    }
    peer.sendJSON({
      type: "sync",
      mode: "snapshot",
      sequence: board.sequence,
      snapshot: board.snapshot(),
      presence: presence.list()
    });
  }

  function broadcast(message) {
    for (const peer of peers) peer.sendJSON(message);
  }

  function broadcastPresence() {
    broadcast({ type: "presence", agents: presence.list() });
  }

  return {
    board,
    presence,
    async start() {
      if (server.listening) return server.address();
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, host, () => {
          server.off("error", reject);
          resolve();
        });
      });
      return server.address();
    },
    async stop() {
      clearInterval(presenceTimer);
      for (const peer of peers) peer.close(1001, "server shutting down");
      peers.clear();
      peersByClient.clear();
      if (!server.listening) return;
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  };
}

function sendJson(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(body);
}
