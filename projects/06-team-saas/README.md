# 06 — Team SaaS

One deployment now serves separate organizations. The starter makes tenant scope and permissions explicit, then exercises retries, dead letters, webhook deduplication, and audit history.

```bash
cd starter
pnpm install
pnpm check:starter
pnpm dev
```

Replace the in-memory adapters with PostgreSQL, a queue, and your observability stack without weakening the tests.

## Open while building

- [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) for optional tenant defense in depth.
- [Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html) for consistent database writes and emitted work.
- [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests) for a concrete retry-safe write contract.
- [OpenTelemetry](https://opentelemetry.io/docs/what-is-opentelemetry/) for traces, metrics, and logs.
- [Google SRE monitoring](https://sre.google/sre-book/monitoring-distributed-systems/) for alerts tied to user-visible failure.

Read [`brief.md`](./brief.md), prove tenant isolation with [`acceptance.md`](./acceptance.md), then continue to [07 — support copilot](../07-support-copilot/).
