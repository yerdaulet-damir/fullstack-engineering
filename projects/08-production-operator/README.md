# 08 — Production Operator

Build an operator that investigates a support issue, prepares one exact write proposal, pauses for human review, and executes the approved side effect at most once. The starter is runnable without credentials and makes its control plane visible through a browser UI, JSON API, persisted workflow state, and failure-path tests.

## Run the starter

```bash
cd starter
pnpm install
pnpm check:starter
pnpm dev
```

Open [http://127.0.0.1:3008](http://127.0.0.1:3008). Create a refund case, inspect the account evidence and exact proposal digest, approve it, then execute it. Restart the process and refresh the workflow to confirm that state persists in `starter/.data/`.

To isolate a run or preserve a test dataset:

```bash
OPERATOR_DATA_DIR=/tmp/operator-demo PORT=3010 pnpm dev
```

## Implemented in the starter

- An explicit state machine: `queued → investigating → awaiting_approval → approved → executing → completed`.
- Failure, retry, rejection, cancellation, invalid-transition, and process-resume paths.
- A registry that keeps read/write permissions, input schemas, validators, and handlers outside model prompts.
- An `account.lookup` read tool and an idempotent `refund.issue` write tool.
- Evidence-linked proposals with a canonical SHA-256 digest over the exact tool, arguments, summary, evidence IDs, and creation metadata.
- Approval records bound to that digest. Changed proposals cannot reuse prior approval.
- Atomic local JSON persistence for workflows and execution records.
- A separate external refund gateway that deduplicates by execution key, including the crash window after the external write but before workflow completion.
- A small HTTP API and browser approval UI using Node's built-in server.
- An MCP adapter boundary that converts an MCP client call into a registry tool without coupling workflow code to an MCP SDK.
- Tests for approval binding, permissions, schema rejection, restart, crash recovery, retryable failures, API behavior, and MCP error mapping.

## Deliberate deployment extensions

The starter demonstrates invariants; it does not pretend a local JSON process is a production platform. Before deploying, replace or add:

- A transactional database with row locking or optimistic concurrency. The local store serializes writes inside one process only.
- Authenticated users, reviewer roles, tenant isolation, CSRF protection, and session security.
- A real payment sandbox or other external system that accepts durable idempotency keys.
- A real MCP SDK transport with server identity, capability allowlists, OAuth/token boundaries, timeouts, and result-size limits.
- A queue or durable workflow runtime for leases, delayed retries, timers, dead-letter handling, and multi-worker coordination.
- Structured logs, traces, metrics, secret management, retention rules, redaction, and immutable audit export.
- Provider integration for proposal generation only after deterministic policy checks remain outside the model.
- Rate limits, cost ceilings, overload behavior, deployment manifests, CI dependency audit, and incident runbooks.

## Architecture

```text
Browser / API client
        │
        ▼
HTTP API ───────────────► OperatorService ───────────────► FileOperatorStore
                              │                                 │
                              │ read / approved write           ├─ workflows
                              ▼                                 └─ execution records
                         ToolRegistry
                         ├─ local tools
                         └─ MCP adapter boundary
                              │
                              ▼
                       JsonRefundGateway
                       idempotency-key ledger
```

The workflow store and external gateway are separate on purpose. If the process stops after the gateway commits but before the workflow records success, a resumed execution sends the same key. The gateway returns the original result instead of issuing another refund.

## State and authorization rules

| State | Allowed work | Next states |
|---|---|---|
| `queued` | Validate the request | `investigating`, `cancelled` |
| `investigating` | Call allowlisted read tools and record evidence | `awaiting_approval`, `failed`, `cancelled` |
| `awaiting_approval` | Show exact proposal and evidence; accept approval or rejection | `approved`, `cancelled` |
| `approved` | Verify the stored digest still matches the proposal | `executing`, `cancelled` |
| `executing` | Reuse the stable execution key and call one write tool | `completed`, `failed` |
| `failed` | Expose a typed error; retry only when marked retryable | `queued`, `approved`, `cancelled` |
| `completed` | Return the recorded execution result | terminal |
| `cancelled` | Perform no write | terminal |

Prompt text has no authority over these transitions. The model, if added, may suggest a proposal but cannot register tools, change a tool's kind, manufacture approval, or execute a write.

## Approval binding

The review screen includes the write tool, fully validated arguments, effect summary, evidence IDs, and SHA-256 proposal digest. The approval record stores reviewer, digest, and timestamp. Execution recomputes the digest and rejects a mismatch with `PROPOSAL_CHANGED`. Approval is attached to one exact proposal, not a conversation or broad intent.

## HTTP API

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/` | Browser review UI |
| `GET` | `/api/workflows` | List persisted workflows |
| `POST` | `/api/workflows` | Create, investigate, and prepare a refund proposal |
| `GET` | `/api/workflows/:id` | Read persisted workflow state |
| `POST` | `/api/workflows/:id/approve` | Approve the exact `proposalDigest` |
| `POST` | `/api/workflows/:id/reject` | Reject with reviewer and reason |
| `POST` | `/api/workflows/:id/execute` | Execute or resume the approved idempotent write |
| `POST` | `/api/workflows/:id/retry` | Retry only a typed retryable failure |
| `POST` | `/api/workflows/:id/cancel` | Cancel a non-terminal workflow |

Create a proposal:

```bash
curl -s http://127.0.0.1:3008/api/workflows \
  -H 'content-type: application/json' \
  -d '{"accountId":"acct-100","issue":"Duplicate charge","requestedAmountCents":2500}'
```

Copy the returned `id` and `proposalDigest`, then approve and execute:

```bash
curl -s http://127.0.0.1:3008/api/workflows/WORKFLOW_ID/approve \
  -H 'content-type: application/json' \
  -d '{"reviewerId":"operator@example.com","proposalDigest":"EXACT_DIGEST"}'

curl -s -X POST http://127.0.0.1:3008/api/workflows/WORKFLOW_ID/execute \
  -H 'content-type: application/json' -d '{}'
```

## Code map

- `starter/src/contracts.ts` — persisted state, proposals, approvals, executions, and tool contracts.
- `starter/src/workflow.ts` — state transitions, authorization checks, retry, resume, and execution orchestration.
- `starter/src/store.ts` — atomic local workflow and execution persistence.
- `starter/src/tool-registry.ts` — read/write registry and schema-validation boundary.
- `starter/src/demo-tools.ts` — deterministic account lookup and refund definitions.
- `starter/src/refund-gateway.ts` — external-system simulator with durable idempotency.
- `starter/src/mcp-adapter.ts` — SDK-neutral MCP client boundary.
- `starter/src/server.ts` and `starter/src/ui.ts` — JSON API and approval UI.
- `starter/tests/` — behavior, restart, crash, retry, API, and MCP proofs.

## Build sequence

1. Read [`brief.md`](./brief.md) and identify every trust boundary.
2. Run the starter and inspect persisted state before and after approval.
3. Reproduce all executable checks in [`acceptance.md`](./acceptance.md).
4. Complete [`exercises.md`](./exercises.md) in order; each exercise preserves the existing tests.
5. Record deployment evidence and remaining risks instead of relabeling starter behavior as production-ready.

## References

- [Applied AI engineering: durable workflows and human approval](../../learn/ai-engineering/#level-4--durable-workflows-and-human-approval)
- [Production operations learning route](../../learn/systems-devops/#level-3--production-operation)
- [MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture)
- [MCP security best practices](https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices)
- [OWASP GenAI Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/)
- [Google SRE: Handling Overload](https://sre.google/sre-book/handling-overload/)
