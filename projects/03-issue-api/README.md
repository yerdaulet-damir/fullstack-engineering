# 03 — Issue API

Build the HTTP and data boundary for the issue tracker. The starter runs with a deterministic in-memory repository; `DATABASE_URL` switches it to PostgreSQL using the included migration.

```bash
pnpm install
pnpm --filter @modern-fullstack/issue-api dev
pnpm --filter @modern-fullstack/issue-api check:starter
```

OpenAPI JSON is available at `GET /openapi.json`. Start PostgreSQL, apply `starter/migrations/001_init.sql`, then set `DATABASE_URL` to exercise the real adapter.

See `brief.md` for the product boundary, `acceptance.md` for proof, and `exercises.md` for the next implementation steps.

## Choose a backend

- Keep the TypeScript starter and use [Fastify](https://fastify.dev/docs/latest/).
- Build the same contract in Python with [FastAPI](https://fastapi.tiangolo.com/tutorial/).
- Build the same contract in Java with [Spring Boot](https://docs.spring.io/spring-boot/index.html).

The Python and Java paths, dependencies, folder shapes, and checks are in [`alternative-backends.md`](./alternative-backends.md).

## Open while building

- [MDN HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview) for request and response semantics.
- [OpenAPI](https://spec.openapis.org/oas/latest.html) for the API contract.
- [PostgreSQL tutorial](https://www.postgresql.org/docs/current/tutorial.html) for SQL and relational basics.
- [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html) before adding an index.

After the acceptance checks pass, continue to [04 — authenticated issue tracker](../04-issue-tracker/).
