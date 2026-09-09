# Product brief

## Scenario

A support operator receives a duplicate-charge case. The system reads the account through an allowlisted tool, records evidence, prepares one refund proposal, and pauses. A reviewer sees the exact tool call and evidence before approving or rejecting it. An approved refund executes once even if the process crashes, restarts, or retries.

## User outcome

The customer receives the approved resolution without an unauthorized or duplicate side effect. The reviewer can answer five questions from persisted records:

1. What evidence did the system read?
2. What exact write did it propose?
3. Who approved that proposal and when?
4. Which idempotency key reached the external system?
5. What result was recorded after execution or replay?

## Required workflow

1. Accept an account ID, issue description, and requested refund amount.
2. Persist a queued workflow before doing work.
3. Enter investigation and call only read tools.
4. Store evidence with source tool and observation time.
5. Validate the proposed write against the registered write-tool schema.
6. Bind tool, arguments, summary, and evidence IDs into a canonical digest.
7. Pause in `awaiting_approval` and expose the full proposal to a reviewer.
8. Accept approval only for the current digest.
9. Derive one stable execution key from workflow and proposal identity.
10. Call the external write with that key, persist the execution result, and complete.
11. On restart during execution, replay with the same key and recover the original result.

## Trust boundaries

- **User input:** untrusted case data; validated before persistence and tool use.
- **Retrieved evidence:** untrusted data, not policy. It may inform a proposal but cannot grant permissions.
- **Model output:** optional untrusted proposal material. Application code validates and authorizes it.
- **Tool registry:** trusted application configuration defining kind, schema, and handler.
- **Reviewer:** authenticated human in a deployment; represented by an explicit reviewer ID in the local starter.
- **Workflow store:** authoritative control-plane state.
- **External system:** separate side-effect boundary that must enforce idempotency.
- **MCP server:** separate principal; protocol compatibility does not imply trust or authorization.

## Safety invariants

- Investigation cannot call write tools.
- No write executes without an approval matching the current proposal digest.
- Approval becomes invalid if any bound proposal field changes.
- A workflow uses one stable execution key for every attempt of the same proposal.
- A completed execution key returns its recorded result.
- A crash after the external commit cannot produce a second side effect on replay.
- Retry is allowed only for failures explicitly classified as retryable.
- Terminal workflows cannot transition back into active states.
- Tool schemas and permissions remain outside prompts and model output.

## Starter scope

The repository implements the complete invariant path with local JSON files, deterministic tools, a browser review page, and a JSON API. This makes state and crash behavior inspectable without cloud credentials.

## Deployment scope

A deployment must add transactional multi-worker storage, identity and reviewer authorization, production idempotency support, real MCP transport security, secrets, telemetry, queues or durable timers, rate and cost controls, retention, CI supply-chain checks, and incident operations. Those are exercises and acceptance evidence, not claims made by the starter.

## Non-goals

- Autonomous selection among broad write capabilities.
- Approval inferred from chat text, button proximity, or a prior proposal.
- A model deciding its own permissions or retry policy.
- Exactly-once distributed execution without idempotency at the external boundary.
- Treating local JSON, deterministic account data, or the browser UI as deployment-ready infrastructure.
