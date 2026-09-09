# Exercises

Preserve the included tests while replacing one in-memory boundary at a time.

1. **PostgreSQL repository:** implement the same tenant-scoped repository interface with migrations, foreign keys, uniqueness constraints, and keyset indexes. Add Testcontainers tests that run hostile cross-tenant IDs against real PostgreSQL.
2. **Row-level security:** add `tenant_id` policies as defense in depth. Use a runtime role without ownership, superuser, or `BYPASSRLS`; set tenant context transaction-locally and test pooled-connection reuse.
3. **Transactional outbox:** store a domain change and pending job in one PostgreSQL transaction. Add a relay that claims committed rows and safely republishes after a crash.
4. **Durable worker:** replace the in-memory queue with a broker or PostgreSQL-backed queue. Preserve bounded retries, delayed backoff, dead-letter inspection, and tenant-aware concurrency limits.
5. **Provider idempotency:** pass the job idempotency key to a real sandbox email or webhook provider. Inject a crash after the provider accepts delivery and prove the retry does not send twice.
6. **Webhook verification:** implement one provider's documented HMAC or asymmetric signature scheme over the raw request bytes. Reject stale timestamps before claiming the delivery ID.
7. **OIDC authentication:** replace teaching headers with authorization-code-plus-PKCE login or bearer-token validation. Resolve tenant membership server-side and test wrong issuer, audience, expiry, and tenant claims.
8. **Tenant lifecycle:** add transactional tenant onboarding, membership changes, suspension, and deletion. Append immutable audit events for membership and destructive actions.
9. **Rate limits and quotas:** add per-tenant request, job, storage, and concurrency limits. Prove one tenant cannot exhaust the shared worker or connection pool.
10. **OpenTelemetry:** trace one HTTP request through authorization, PostgreSQL, outbox publication, worker attempts, and final delivery. Record tenant ID as controlled metadata without including sensitive payloads.
11. **Operational recovery:** add a dead-letter replay command with authorization, reason capture, and audit history. Prove replay cannot target another tenant.
