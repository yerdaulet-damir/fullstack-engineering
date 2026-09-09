# 03 — Issue API

Build the HTTP and data boundary for the issue tracker. The starter runs with a deterministic in-memory repository; `DATABASE_URL` switches it to PostgreSQL using the included migration.

```bash
pnpm install
pnpm --filter @modern-fullstack/issue-api dev
pnpm --filter @modern-fullstack/issue-api check:starter
```

OpenAPI JSON is available at `GET /openapi.json`. Start PostgreSQL, apply `starter/migrations/001_init.sql`, then set `DATABASE_URL` to exercise the real adapter.

See `brief.md` for the product boundary, `acceptance.md` for proof, and `exercises.md` for the next implementation steps.
