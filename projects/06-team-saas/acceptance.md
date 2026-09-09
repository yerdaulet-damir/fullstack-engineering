# Acceptance

Run `pnpm check:starter` from `starter/`. The included tests prove:

- issue list, lookup, create, and update operations require tenant context;
- Acme cannot read or update a known Globex issue ID;
- role is loaded from active tenant membership rather than trusted from request input;
- viewer writes and unknown memberships are denied;
- audit events are immutable copies and audit reads are tenant-scoped;
- a repeated tenant-local job idempotency key returns the original job;
- the same idempotency key remains valid in a different tenant;
- failed jobs retry to three attempts and then enter that tenant's dead-letter collection;
- a transient digest-provider failure recovers without recording duplicate delivery;
- a completed webhook delivery is processed once per tenant and source;
- failed webhook handling releases the delivery so redelivery can retry;
- the HTTP API returns only tenant-owned issues and enforces viewer permissions;
- the webhook HTTP route resolves a tenant-and-source-specific credential before applying tenant context;
- an Acme billing credential cannot submit a Globex billing event or an Acme CRM event;
- an authenticated webhook reports duplicate delivery without appending a second audit event;
- the browser demo and health endpoint run through the real HTTP server.

## Completion beyond the starter

The project is production-oriented only after the exercises add durable infrastructure and corresponding proof. PostgreSQL/RLS, transactional outbox behavior, external queues, OIDC, real webhook signature verification, rate limits, and OpenTelemetry are not acceptance claims of the included in-memory starter.
