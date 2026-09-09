# Acceptance

- `pnpm --filter @modern-fullstack/issue-api check:starter` passes.
- `GET /health`, `GET /users`, `GET/POST /issues`, `POST /issues/:id/comments`, and `POST /issues/:id/assign` have schemas in `/openapi.json`.
- Invalid input returns `{ error: { code, message, requestId } }`.
- Issue pagination uses an opaque cursor and stable `(created_at, id)` ordering.
- Assignment and audit insertion share one PostgreSQL transaction.
- `migrations/001_init.sql` defines foreign keys, checks, and the feed index.
- Replace the memory seam with disposable PostgreSQL tests before calling the project complete.
- Save before/after `EXPLAIN ANALYZE` output for the issue feed in your evidence.
