# 06 — Team SaaS

One Node.js process serves Acme and Globex while keeping issues, jobs, webhook deliveries, and audit history tenant-scoped. The starter is runnable without external services so its isolation and failure tests stay deterministic.

```bash
cd starter
pnpm install
pnpm check:starter
pnpm dev
```

Open `http://127.0.0.1:3006`. Switch between owners, members, and viewers; list tenant issues; attempt writes; queue a digest; run the worker; and inspect audit or dead-letter state.

Run the terminal demo with `pnpm demo`. Run the server without file watching with `pnpm start`.

## Included architecture

| Module | Responsibility |
| --- | --- |
| `src/repository.mjs` | Tenant, membership, and issue storage whose public operations require `tenantId`. |
| `src/authorization.mjs` | Deny-by-default role policy loaded from active tenant membership. |
| `src/audit-log.mjs` | Append-only immutable audit events with tenant-scoped reads. |
| `src/jobs.mjs` | Tenant-aware idempotent enqueue, bounded retry, dead letters, and a simulated idempotent digest provider. |
| `src/webhooks.mjs` | Delivery claim, completed-delivery deduplication, and retry after failed handling. |
| `src/webhook-credentials.mjs` | Tenant-and-source-specific credential lookup that returns authenticated webhook context. |
| `src/service.mjs` | Application workflows that connect policy, storage, jobs, webhooks, and audit. |
| `src/http.mjs` | JSON API, structured errors, request IDs, body limits, local identity headers, and webhook authentication. |
| `src/ui.mjs` | Browser demo that makes tenant and role boundaries observable. |

The server reads `x-user-id` and `x-tenant-id` as a local teaching identity. Roles still come from server-side membership. Webhooks use separate credentials for each configured tenant and source. The demo variables are `WEBHOOK_ACME_BILLING_SECRET`, `WEBHOOK_ACME_CRM_SECRET`, and `WEBHOOK_GLOBEX_BILLING_SECRET`.

## HTTP API

| Method | Path | Access |
| --- | --- | --- |
| `GET` | `/health` | Public health check. |
| `GET` | `/api/context` | Any active member. |
| `GET` | `/api/issues` | Owner, admin, member, viewer. |
| `GET` | `/api/issues/:id` | Owner, admin, member, viewer; cross-tenant IDs return `404`. |
| `POST` | `/api/issues` | Owner, admin, member. |
| `PATCH` | `/api/issues/:id` | Owner, admin, member; cross-tenant IDs return `404`. |
| `POST` | `/api/digests` | Owner, admin, member; body requires `idempotencyKey`. |
| `POST` | `/api/jobs/run` | Owner or admin; processes only that tenant's next job. |
| `GET` | `/api/dead-letters` | Owner or admin. |
| `GET` | `/api/audit` | Owner or admin. |
| `POST` | `/api/webhooks/:source` | Requires a delivery ID and the credential configured for the requested tenant and source. Authentication produces the tenant context used by the handler. |

Example:

```bash
curl -s http://127.0.0.1:3006/api/issues \
  -H 'x-tenant-id: acme' \
  -H 'x-user-id: alice'

curl -s http://127.0.0.1:3006/api/issues \
  -X POST \
  -H 'content-type: application/json' \
  -H 'x-tenant-id: acme' \
  -H 'x-user-id: sam' \
  -d '{"title":"Customer cannot export report"}'
```

## What the starter proves

- Known cross-tenant IDs do not bypass repository scope.
- Client input cannot promote a user because role comes from membership.
- Viewer writes fail at the server boundary.
- Job keys, queues, and dead letters remain tenant-aware.
- Retries stop at a fixed limit.
- Successful webhook deliveries are deduplicated; failed handling remains retryable.
- Webhook credentials cannot be reused across tenants or sources.
- Audit history is append-only from consumers' perspective and tenant-scoped.

## What remains an exercise

The included storage, queue, delivery provider, webhook inbox, and audit log are in memory. PostgreSQL, row-level security, a transactional outbox, a durable worker, real OIDC, provider signature verification, distributed limits, and OpenTelemetry are specified in [`exercises.md`](./exercises.md) and are not claimed as implemented.

## Open while building

- Combine the [multi-tenancy chapter](../../learn/backend-data/#7-multi-tenancy) with the [reliable service playbook](../../learn/systems-devops/#level-2--reliable-service).
- [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) for optional tenant defense in depth.
- [Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html) for consistent database writes and emitted work.
- [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests) for a concrete retry-safe write contract.
- [OpenTelemetry](https://opentelemetry.io/docs/what-is-opentelemetry/) for traces, metrics, and logs.
- [Google SRE monitoring](https://sre.google/sre-book/monitoring-distributed-systems/) for alerts tied to user-visible failure.

Read [`brief.md`](./brief.md), run the proofs in [`acceptance.md`](./acceptance.md), complete the durable extensions in [`exercises.md`](./exercises.md), then continue to [07 — support copilot](../07-support-copilot/).
