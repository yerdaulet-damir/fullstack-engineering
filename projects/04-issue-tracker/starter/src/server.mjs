import { buildApp } from "./app.mjs";
import { TrackerStore } from "./store.mjs";

const app = await buildApp(new TrackerStore());
await app.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 3004) });
