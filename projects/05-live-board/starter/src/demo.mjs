import { createLiveBoardServer } from "./server.mjs";

const app = createLiveBoardServer({
  host: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 3005),
  token: process.env.BOARD_TOKEN ?? "local-development-token"
});

const address = await app.start();
console.log(`Live Board listening on http://${address.address}:${address.port}`);

let stopping = false;
async function stop(signal) {
  if (stopping) return;
  stopping = true;
  console.log(`\n${signal} received; closing clients and server`);
  await app.stop();
}

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
