# Product brief

Acme and Globex use one support service without sharing issues, jobs, webhook state, or audit history.

## Actors and policy

- Owners and admins may read and update issues, run jobs, and inspect dead letters and audit history.
- Members may read and update issues and request digest jobs.
- Viewers may read issues.
- Unknown roles and missing grants are denied.
- The server resolves role from the user's active membership in the selected tenant. A client-supplied role is ignored.

## Included starter

The runnable starter includes:

- a tenant-scoped in-memory repository for tenants, memberships, and issues;
- a deny-by-default authorization policy;
- immutable, tenant-scoped audit events;
- an in-memory job queue with tenant-local idempotency keys, bounded retries, and dead letters;
- an idempotent digest sender used to model a provider that accepts idempotency keys;
- a webhook inbox that deduplicates completed deliveries and permits retry after failed handling;
- a small dependency-free Node.js HTTP API;
- a browser demo for switching between Acme and Globex identities;
- black-box HTTP and module tests for cross-tenant access and failure paths.

The local HTTP adapter uses `x-user-id` and `x-tenant-id` headers so the user identity boundary is visible. It is not production authentication. Webhook credentials are configured per tenant and source. The server authenticates that tuple before passing its tenant context to application code. Production signature verification is an exercise.

## Required behavior

Every tenant-owned storage operation accepts tenant context and applies it before returning or changing data. A known issue ID from another tenant behaves as absent. Authorization is checked on the server before repository access. Audit, dead-letter, idempotency, and webhook keys include tenant identity.

Job delivery is at least once. A failed job is retried up to its configured limit, then moved to a dead-letter collection. The included digest adapter records one delivery per tenant and idempotency key. A production email or webhook provider must enforce the same key; a local in-memory set cannot provide durability across process restarts.

## Production extensions

The starter does **not** implement PostgreSQL, row-level security, a durable queue, a transactional outbox, real OIDC sessions, provider-grade webhook signatures, distributed rate limits, or OpenTelemetry. These are named exercises because claiming them without executable infrastructure would hide the important failure modes.
