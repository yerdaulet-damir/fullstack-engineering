# Exercises

Complete these in order. Preserve the starter's tests and add a failing test before changing an invariant.

## 1. Add optimistic concurrency

Replace whole-file local persistence with SQLite or PostgreSQL. Add a workflow revision number and update with `WHERE id = ? AND revision = ?`. Run two execution attempts concurrently and prove only one transition wins.

**Deliver:** migration, repository adapter, concurrency test, and an explanation of the isolation level used.

## 2. Make proposal creation model-assisted

Add a provider adapter that receives the request and read-only evidence and returns structured proposal candidates. Keep tool registration, schema validation, amount limits, and state transitions in application code. Do not give the model direct tool execution.

**Deliver:** fake and real provider adapters, schema validation, no-evidence refusal, timeout path, token/cost capture, and deterministic fixtures.

## 3. Connect a real MCP server

Implement `McpClientBoundary` with an MCP SDK. Expose one read tool and one write tool from a sandbox server. Use separate credentials or authorization scopes and an explicit server allowlist.

**Deliver:** server identity configuration, capability inventory, input/result limits, timeout behavior, trace sample, and tests for an untrusted server and an MCP error result.

## 4. Prove external idempotency

Replace `JsonRefundGateway` with a sandbox API that supports idempotency keys. Kill the worker after the external service commits but before the execution record is saved. Resume from persisted `executing` state.

**Deliver:** crash harness, external request log, one side effect, recovered response, and a documented policy for idempotency-key retention.

## 5. Harden approval

Authenticate reviewers and authorize by tenant, amount, and tool. Add approval expiry and optional two-person review above a threshold. Bind the exact evidence snapshot or its digest as well as tool arguments.

**Deliver:** role matrix and tests for wrong tenant, insufficient limit, expired approval, changed arguments, changed evidence, self-approval restriction, and duplicate reviewer.

## 6. Add durable scheduling

Move orchestration to a durable workflow engine or queue-backed worker. Add leases, heartbeat or visibility timeout, delayed retry with jitter, maximum attempts, and dead-letter handling. Activities that call external systems must remain idempotent.

**Deliver:** worker-restart test, duplicate-delivery test, delayed-retry test, dead-letter recovery procedure, and workflow history for one run.

## 7. Add cancellation, deadlines, and budgets

Store a cancellation request separately from terminal cancellation. Check it between steps and before writes. Add per-tool timeout, workflow deadline, maximum model/tool calls, and estimated cost ceiling.

**Deliver:** tests showing a pre-write cancellation prevents execution, an in-flight write reaches a known state, and every limit fails closed with a typed reason.

## 8. Add production observability

Emit structured events for state transitions, reads, proposals, approvals, writes, retries, and terminal outcomes. Join events with workflow ID, proposal digest, execution key, tenant, and trace ID. Redact support text and secrets.

**Deliver:** trace example, metrics for completion/failure/retry/stuck workflows, p50/p95 latency, cost per completed case, redaction tests, and alert thresholds.

## 9. Red-team the control plane

Add fixtures where user text, retrieved evidence, model output, and MCP results instruct the operator to bypass approval, change tool arguments, expose secrets, or call an unregistered tool.

**Deliver:** trust-boundary diagram, attack fixtures, expected rejection codes, and regression output. Prompt wording alone does not count as a control.

## 10. Write and rehearse the runbook

Cover model-provider outage, MCP outage, external-write outage, cost spike, stuck `executing` workflows, bad release, credential compromise, rollback, and audit export. Define who may pause new work and how in-flight operations are reconciled.

**Deliver:** runbook, one tabletop record, one rollback rehearsal, recovery-time observations, and unresolved operational risks.
