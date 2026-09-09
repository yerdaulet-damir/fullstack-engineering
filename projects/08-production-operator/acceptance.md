# Acceptance

Acceptance is split between behavior implemented by the starter and evidence required from a deployment extension. Do not mark deployment items complete by pointing to the local simulator.

## Starter behavior

Run:

```bash
cd starter
pnpm check:starter
```

The check must prove:

- TypeScript strict mode passes without emitted files.
- Workflow states and allowed transitions are explicit.
- State is persisted before investigation and before external execution.
- Read and write tools have distinct registry permissions.
- Tool inputs reject missing, malformed, and additional arguments.
- Investigation uses an allowlisted read tool and stores timestamped evidence.
- A write proposal names the tool, validated arguments, summary, and evidence IDs.
- The proposal digest is canonical and changes when any bound value changes.
- Execution before approval fails without calling the external gateway.
- Approval with the wrong digest fails.
- Execution recomputes the digest and rejects a changed proposal.
- Serialized approval resumes through a newly constructed store and service.
- Every write requires a stable execution key.
- Replaying an execution key returns the original external result.
- A crash after the external write but before workflow completion resumes without a duplicate refund.
- Typed retryable failures can retry; non-retryable failures cannot.
- Rejection and cancellation are terminal and perform no write.
- The HTTP API exposes create, inspect, approve, reject, execute, retry, and cancel operations.
- The browser UI shows evidence, exact proposal data, digest, reviewer, and separate approve/execute controls.
- The MCP boundary forwards validated arguments and workflow/execution metadata and maps tool errors.

## Manual restart proof

1. Start with `OPERATOR_DATA_DIR=/tmp/operator-acceptance pnpm dev`.
2. Create and approve a workflow in the browser.
3. Stop the process before pressing execute.
4. Start it again with the same data directory.
5. Open `GET /api/workflows`, recover the workflow ID, and execute it.
6. Confirm both the workflow and refund ledger contain one result.

## Deployment extension evidence

- **Concurrency:** transaction or compare-and-swap tests prove two workers cannot both advance the same state or create conflicting execution records.
- **Identity:** authentication and role tests prove only authorized reviewers can approve the affected tenant and operation class.
- **Approval integrity:** approval records are immutable, attributable, expiring when required, and invalidated by argument or evidence changes.
- **External idempotency:** the real write API accepts the execution key and returns the original response on replay.
- **MCP security:** servers are allowlisted; credentials are scoped; read and write capabilities are separate; transport, timeout, and result limits are enforced.
- **Durability:** queue or workflow-runtime tests cover worker death, lease expiry, delayed retry, duplicate delivery, and dead-letter recovery.
- **Observability:** traces join workflow ID, proposal digest, reviewer, execution key, tool call, provider request, latency, cost, and terminal result without leaking secrets.
- **Limits:** per-tenant rate limits, maximum attempts, wall-clock deadline, tool timeout, and cost ceiling fail closed.
- **CI:** typecheck, tests, eval regression, dependency audit, and migration checks block release.
- **Operations:** a tested runbook covers provider outage, external-write outage, cost spike, bad release, stuck workflows, credential compromise, rollback, and audit export.
- **Data governance:** retention, deletion, encryption, redaction, and access review cover prompts, evidence, approvals, traces, and tool results.

## Release artifact

Attach the commit, test output, threat model, state diagram, tool inventory, eval results, crash-recovery trace, latency/cost report, deployment configuration, rollback procedure, and known limitations. A screenshot of a successful approval is not sufficient.
