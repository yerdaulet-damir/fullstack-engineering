# 06 — Team SaaS

One deployment now serves separate organizations. The starter makes tenant scope and permissions explicit, then exercises retries, dead letters, webhook deduplication, and audit history.

```bash
cd starter
pnpm install
pnpm check:starter
pnpm dev
```

Replace the in-memory adapters with PostgreSQL, a queue, and your observability stack without weakening the tests.
