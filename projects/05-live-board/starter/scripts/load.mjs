import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

const clientCount = Number(process.env.LOAD_CLIENTS ?? 100);
const url = new URL(process.env.LOAD_URL ?? "ws://127.0.0.1:3005/ws");
url.searchParams.set("token", process.env.LOAD_TOKEN ?? "local-development-token");

const startedAt = performance.now();
const results = await Promise.allSettled(Array.from({ length: clientCount }, (_, index) => connect(index)));
const elapsedMs = Math.round(performance.now() - startedAt);
const successful = results.filter((result) => result.status === "fulfilled").length;
const failed = results.length - successful;

console.log(JSON.stringify({
  target: url.origin,
  clients: clientCount,
  successful,
  failed,
  elapsedMs,
  connectionsPerSecond: Number((successful / Math.max(elapsedMs / 1000, 0.001)).toFixed(1))
}, null, 2));

if (failed) process.exitCode = 1;

function connect(index) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url, "live-board.v1");
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error(`Client ${index} timed out`));
    }, 5_000);

    socket.addEventListener("open", () => socket.send(JSON.stringify({
      type: "hello",
      clientId: randomUUID(),
      name: `Load ${index}`,
      lastSequence: null
    })));
    socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.type !== "sync") return;
      clearTimeout(timeout);
      socket.close(1000, "probe complete");
      resolve();
    });
    socket.addEventListener("error", () => {
      clearTimeout(timeout);
      reject(new Error(`Client ${index} failed`));
    });
  });
}
