# Acceptance

- Every repository call requires a tenant ID.
- Cross-tenant reads return no data, even when an issue ID is known.
- Roles are deny-by-default and writes are checked on the server.
- Jobs retry to a fixed limit, then enter a dead-letter queue.
- A webhook delivery ID is processed once.
- Membership and destructive actions append an immutable audit event.
- One trace connects request, database work, job, and worker outcome.
