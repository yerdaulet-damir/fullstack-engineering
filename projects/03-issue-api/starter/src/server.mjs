import pg from "pg";
import { buildApp } from "./app.mjs";
import { MemoryIssueRepository, PostgresIssueRepository } from "./repository.mjs";

const repository = process.env.DATABASE_URL
  ? new PostgresIssueRepository(new pg.Pool({ connectionString: process.env.DATABASE_URL }))
  : new MemoryIssueRepository();
const app = await buildApp(repository, { logger: true });
await app.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 3003) });

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    await app.close();
    process.exit(0);
  });
}
