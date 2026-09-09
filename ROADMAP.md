# Project roadmap

Each project ends in a deployed artifact. A screenshot alone is not completion.

## 01 — Launch page

Build a responsive landing page for a small software product from `brief.md` and the supplied content data.

**Deliverables**

- Semantic page landmarks and correct heading order.
- Responsive layout at 360, 768, and 1440 pixels.
- Keyboard-accessible navigation, FAQ, and signup form.
- Client-side validation with useful error text.
- Images with dimensions, useful alternative text, and modern formats.
- No layout shift during image or font loading.
- Lighthouse evidence: accessibility ≥ 95, best practices ≥ 95, SEO ≥ 95.
- Public deployment on Cloudflare Pages, GitHub Pages, Netlify, or Vercel.

## 02 — Data dashboard

Build a React dashboard for support tickets. The supplied fake API is slow and fails on demand.

**Deliverables**

- Typed API boundary; unknown network data is validated before use.
- URL-backed filters for status, assignee, and search.
- Loading, empty, partial, stale, and error states.
- Create/edit form with accessible validation and unsaved-change protection.
- Optimistic status update with rollback on failure.
- Component tests for one success and three failure paths.
- Bundle report and an explanation of the largest dependency.

## 03 — Issue API

Build the API used by project 02 and persist its data in PostgreSQL.

**Deliverables**

- REST endpoints for issues, comments, users, and health.
- Request/response schemas and generated OpenAPI JSON.
- SQL migrations with foreign keys and constraints.
- Transaction for “assign issue and append audit event.”
- Cursor pagination; no offset pagination on the issue feed.
- Index justified with `EXPLAIN ANALYZE` before and after.
- Integration tests against a disposable database.
- Structured errors, request IDs, and graceful shutdown.

## 04 — Full-stack issue tracker

Connect the dashboard and API into a deployable application used by two accounts.

**Deliverables**

- Email sign-in or OAuth with server-side sessions.
- Authorization checked on the server for every write.
- Project, issue, comment, label, and attachment flows.
- Optimistic interactions that reconcile with server truth.
- Object uploads through signed URLs; secrets never reach the browser.
- Metadata, canonical URL, social preview, sitemap, and robots rules.
- End-to-end test proving user A cannot read or edit user B's private project.
- Preview and production deployments with separate environment variables.

## 05 — Live board

Add a live issue board for multiple people editing at once.

**Deliverables**

- WebSocket authentication and per-project channels.
- Presence with expiry rather than permanent “online” records.
- Optimistic card movement with server-issued sequence numbers.
- Idempotency key for every write retried after reconnect.
- Backoff, reconnect, resubscribe, and missed-event recovery.
- Two-browser script that proves convergence after a forced disconnect.
- Load script for 100 concurrent local connections and recorded result.

## 06 — Team SaaS

Turn the tracker into a product that safely serves multiple organizations.

**Deliverables**

- Organization membership and role matrix: owner, admin, member, viewer.
- Tenant ID enforced in repository/data-access functions.
- Audit log for membership and destructive actions.
- Background job for digest email with retries and dead-letter handling.
- Idempotent webhook receiver with signature verification.
- Per-tenant rate limits and usage counters.
- Traces across HTTP request → database → queue → worker.
- Backup/restore note and one tested restore on local data.
- Tenant-isolation tests that intentionally attempt cross-tenant access.

## 07 — Support copilot

Add an AI assistant that answers from product documentation and drafts safe support actions.

**Deliverables**

- Streaming UI with cancel, retry, and visible source citations.
- Structured answer object validated at runtime.
- Retrieval over a versioned document set with a “no evidence” response.
- Read-only tools for issue lookup and account status.
- Human approval before any draft becomes an external message.
- At least 30 eval cases covering answer quality, refusal, citation, and tool choice.
- Prompt-injection fixtures from untrusted documents.
- Recorded p50/p95 latency, tokens, and estimated cost per successful task.
- Deterministic fake model for local and CI tests.

## 08 — Production operator

Build a durable AI workflow that investigates a support issue, proposes a resolution, and pauses before any write.

**Deliverables**

- Explicit state machine; workflow state survives process restart.
- Small, typed tools with least-privilege credentials.
- Approval screen showing proposed action, evidence, and exact side effects.
- Idempotent write execution and resumable failures.
- MCP server or equivalent tool boundary for one external system.
- Threat model for prompt injection, data leakage, excessive agency, and denial of wallet.
- CI gates for types, tests, migration checks, dependency audit, and eval regression.
- Staging deployment with logs, metrics, traces, alert, rollback, and incident runbook.
- Three-minute public demo and architecture diagram that explain trade-offs rather than stack names.

## Capstone evidence

For each project, save:

- Repository or folder link.
- Live URL when the project has a user interface.
- Command that runs its automated checks.
- One screenshot or short recording.
- One failure you reproduced intentionally.
- One measurement you improved.
- One paragraph on the next constraint you would address.
