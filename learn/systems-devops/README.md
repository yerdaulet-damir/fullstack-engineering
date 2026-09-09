# Systems and DevOps Playbook

Last verified: **2026-09-09**

Use this page while building. Each level ends with observable evidence in projects 05, 06, and 08.

## The operating model

Distributed work crosses process or network boundaries. At that boundary, a request can arrive late, twice, out of order, or after the caller has stopped waiting. Production design starts by naming five things:

1. **Identity:** which retries represent the same operation?
2. **Order:** which events must precede others, and who assigns that order?
3. **Durability:** what must survive a process, host, or region failure?
4. **Bounds:** when do retries, queues, connections, and costs stop growing?
5. **Evidence:** which test, metric, trace, or recovery drill proves the claim?

Do not call a system reliable because it has Redis, Kafka, Kubernetes, or tracing. State the failure, the invariant, and the evidence.

## Route by level

| Level | Learn | Apply | Exit evidence |
|---|---|---|---|
| 1 — Realtime foundations | WebSockets, Redis, reconnects, ordering, Docker | [05 — Live Board](../../projects/05-live-board/) | Two clients converge after disconnect; duplicate writes apply once; 100 local connections complete |
| 2 — Reliable service | Queues, idempotency, retries, GitHub Actions, observability, tenant security | [06 — Team SaaS](../../projects/06-team-saas/) | Jobs dead-letter at a fixed limit; webhooks deduplicate; one trace crosses request, database, queue, and worker |
| 3 — Production operation | System design, deployment, rollback, security boundaries, SRE | [08 — Production Operator](../../projects/08-production-operator/) | Durable workflow resumes; writes require approval; CI, telemetry, alerting, rollback, and runbook are demonstrated |

If level 1 feels unfamiliar, start there. If you already operate a queue and can explain duplicate delivery, start at level 2. Start at level 3 only when you can recover a failed write without guessing whether it happened.

---

## Level 1 — Realtime foundations

### WebSockets

HTTP answers requests. A WebSocket keeps one connection open so either side can send frames. The connection is a transport, not a durable log: a disconnected client misses messages unless the application stores them elsewhere.

A production client needs a state machine: `connecting → open → recovering → closed`. Heartbeats detect half-open connections. Reconnect uses capped exponential backoff with jitter. Recovery sends the last confirmed server sequence and asks for later events.

#### Read

- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) — **docs, beginner**. Browser API, lifecycle, events, and the API's lack of built-in backpressure.
- [Writing WebSocket client applications](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications) — **guide, beginner**. A small client with connection and message handling.
- [RFC 6455](https://www.rfc-editor.org/rfc/rfc6455) — **specification, advanced**. Use sections 1, 4–7, and 10 when handshake, framing, close, or security behavior is unclear.
- [`websockets/ws`](https://github.com/websockets/ws) — **exemplary repository, intermediate**. Node.js server patterns for broadcast, authentication, compression, streams, and broken-connection detection.

#### Watch

- [MIT 6.824 Lecture 1: Introduction](https://www.youtube.com/watch?v=cQP8WApzIQQ) — **video, intermediate**. Frames distributed systems around concurrency, partial failure, performance, and replication.

#### Build

In [05 — Live Board](../../projects/05-live-board/), implement authenticated project channels, heartbeat expiry, visible reconnect state, resubscription, and missed-event recovery. The server assigns every accepted operation a strictly increasing sequence. The client treats its local move as provisional until that sequence returns.

#### Prove

- Open two browser sessions, disconnect one, make changes in the other, reconnect, and show identical ordered state.
- Kill a client without a clean close and show that presence expires while issue data remains.
- Run the same operation twice with one idempotency key and show one state transition and one recorded event.
- Record the result of 100 concurrent local connections required by [project 05 acceptance](../../projects/05-live-board/acceptance.md).

### Redis

Redis is a networked data-structure server. Its speed does not make data automatically safe. Choose the structure and failure contract:

- **Strings and hashes:** cache or compact mutable state.
- **Sets and sorted sets:** membership, uniqueness, ranking, and time-ordered expiry work.
- **Pub/Sub:** transient fan-out; disconnected subscribers lose messages.
- **Streams:** retained entries, consumer groups, acknowledgement, pending work, and replay.

Cache entries are derived data. Give them an owner, key schema, TTL policy, invalidation rule, and behavior for cache failure. Presence belongs in expiring keys. Recoverable board events belong in a durable store or Redis Streams, not Pub/Sub alone.

#### Read

- [Redis University](https://redis.io/tutorials/university/) — **free courses, beginner–advanced**. Structured paths for Redis data structures and operation.
- [Redis Open Source documentation](https://redis.io/docs/latest/get-started/) — **docs, beginner**. Data types, persistence, replication, clustering, and production guidance.
- [Redis Streams](https://redis.io/docs/latest/develop/data-types/streams/) — **docs, intermediate**. Append-only entries, consumer groups, pending lists, acknowledgement, and claiming abandoned work.
- [`redis/redis`](https://github.com/redis/redis) — **exemplary repository, advanced**. Trace commands into persistence, replication, and cluster implementation.

#### Build

Add expiring presence and retained board events to project 05. Use explicit prefixes and identifiers in keys. Make restart behavior visible: restart the application and Redis separately, then record which state survives and why.

#### Prove

- Stop Redis during a board update and show the user-visible failure instead of reporting false success.
- Restart the application and show that persisted events rebuild the same board.
- Compare Pub/Sub and Streams by disconnecting a consumer and publishing three events.
- Inspect memory, TTLs, pending entries, and consumer lag rather than relying on application logs alone.

### Docker

An image is an immutable filesystem plus runtime metadata. A container is a process created from that image. Volumes hold state outside the container lifecycle; networks give services stable names. Compose describes a local multi-service topology, not a production reliability guarantee.

A useful image is reproducible, small enough to move quickly, runs as a non-root user, receives configuration at runtime, exposes a health signal, and shuts down on `SIGTERM` without dropping accepted work.

#### Read

- [Docker Get Started](https://docs.docker.com/get-started/) — **official tutorial, beginner**. Images, containers, registries, networks, volumes, and Compose.
- [Docker container getting-started lab](https://docs.docker.com/guides/lab-container-getting-started/) — **free lab, beginner**. Run a container, write a Dockerfile, build an image, and inspect isolation.
- [`docker/getting-started`](https://github.com/docker/getting-started) — **exemplary repository, beginner–intermediate**. Working Dockerfile and Compose patterns.
- [Dockerfile best practices](https://docs.docker.com/build/building/best-practices/) — **docs, intermediate**. Layer caching, small build contexts, pinned bases, multi-stage builds, and ephemeral containers.

#### Build

Run project 05 and its Redis dependency with Compose. Add a multi-stage application image, a named Redis volume, service health checks, graceful shutdown, and a non-root runtime user.

#### Prove

- Delete and recreate the application container; persisted board state remains.
- Delete the named data volume; document the expected data loss.
- Send `SIGTERM` during an active connection; the server stops accepting work and closes cleanly.
- Rebuild after a source-only change and show that dependency layers remain cached.

### Level 1 milestone

Complete [project 05 exercises](../../projects/05-live-board/exercises.md). Save the two-browser reconnect recording, the duplicate-operation result, the restart result, and the 100-connection output. Those artifacts are stronger than a diagram of the intended behavior.

---

## Level 2 — Reliable service

### Queues

A queue separates acceptance from completion. The producer records work; a worker later attempts it. That boundary absorbs bursts and isolates slow dependencies, but it creates duplicate delivery, lag, poison messages, and work that may complete after the original request ended.

Assume **at-least-once delivery** unless the complete path proves otherwise. Acknowledgement means “this delivery no longer needs retry,” not “the business effect definitely happened once.” Keep payloads small, version schemas, set retry limits, expose queue age, and preserve failed work in a dead-letter queue.

#### Read

- [RabbitMQ tutorials](https://www.rabbitmq.com/tutorials) — **free official tutorials, beginner–intermediate**. Work queues, publish/subscribe, routing, topics, streams, and publisher confirms.
- [RabbitMQ reliability guide](https://www.rabbitmq.com/docs/reliability) — **docs, intermediate**. Connection recovery, acknowledgement, confirms, clustering, and failure handling.
- [Apache Kafka design](https://kafka.apache.org/38/design/) — **docs, intermediate–advanced**. Partitioned logs, batching, retention, consumer groups, replication, and delivery guarantees.
- [RabbitMQ and Kafka compared](https://www.rabbitmq.com/docs/compare/kafka) — **technical comparison, intermediate**. Choose from routing, replay, ordering, retention, latency, and operational needs rather than popularity.

#### Build

In [06 — Team SaaS](../../projects/06-team-saas/), enqueue digest email in the same transaction as the state change that requires it. The worker acknowledges only after the effect is recorded. Retry transient failures to a fixed limit; dead-letter permanent or exhausted failures with enough context to inspect and replay safely.

#### Prove

- Crash a worker after receiving a job and before acknowledgement; the job returns and does not duplicate its business effect.
- Feed a permanently invalid job; attempts stop at the configured limit and the dead-letter record explains why.
- Slow the worker below producer rate; queue age and depth reveal the backlog.
- Restart the broker and worker; durable accepted work remains available.

### Idempotency

An idempotency key names one intended operation across repeated requests. Store the key, a fingerprint of the normalized input, execution status, and final response in the same durability boundary as the effect. A reused key with different input is a conflict. A reused completed key returns the recorded result.

Database uniqueness is the final guard. Checking for a key and then writing in separate unprotected steps still races under concurrency.

#### Read

- [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests) — **production API docs, intermediate**. A concrete retry-safe write contract.
- [Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency) — **engineering article, intermediate**. Connects ambiguous failures, retry semantics, keys, backoff, and jitter.
- [Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html) — **pattern reference, intermediate**. Commit the business write and pending message atomically, then publish asynchronously.

#### Build

Add a webhook delivery table to project 06 with a unique provider delivery ID, payload fingerprint, processing state, and result. Verify the webhook signature before accepting the delivery ID. Put the business change and processed marker in one transaction.

#### Prove

- Send 20 concurrent copies of one valid webhook; one business effect is committed.
- Reuse the delivery ID with changed content; the endpoint rejects it instead of returning the first result.
- Drop the HTTP response after commit, retry, and show the original result.
- Force rollback after reserving the key; the next valid attempt can complete according to the documented state machine.

### Retries and overload

A retry spends capacity when a dependency may already be overloaded. Set a timeout from observed latency and acceptable false-timeout rate. Retry only transient failures, use exponential backoff with jitter, cap attempts and elapsed time, and retry at one layer. Multiplying retries across service layers can turn one failure into a traffic storm.

Backpressure is the system refusing or delaying new work before memory, connections, or queue age become unbounded. Load shedding is a controlled failure; an exhausted server is an uncontrolled one.

#### Read

- [AWS: Timeouts, retries, and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) — **practitioner article, intermediate–advanced**. Timeout selection, retry amplification, capped backoff, token buckets, and jitter.
- [Google SRE: Handling overload](https://sre.google/sre-book/handling-overload/) — **free book chapter, advanced**. Capacity, admission control, request shedding, and graceful degradation.

#### Watch

- [MIT 6.824 Lecture 12: Distributed Transactions](https://www.youtube.com/watch?v=aDp99WDIM_4) — **video, advanced**. Atomic commit and the failure windows behind ambiguous outcomes.

#### Build

Give project 06 separate policies for HTTP calls and queued jobs. Record attempt count, elapsed time, next delay, terminal reason, and dependency name. Add per-tenant rate limits so one tenant cannot consume all worker or API capacity.

#### Prove

- Simulate 1,000 synchronized clients; compare fixed delay, exponential delay, and full jitter by requests per time bucket.
- Fail the dependency for longer than the retry budget; attempts stop and the caller receives a stable terminal result.
- Exhaust one tenant's allowance; another tenant still succeeds.
- Show that only one layer retries a failing downstream call.

### GitHub Actions

A pipeline is executable release policy. Pull requests should produce deterministic checks; protected deployment environments should control credentials and approval. Workflows run untrusted repository content, so permissions, interpolation, third-party actions, and artifact provenance are security boundaries.

Pin actions to immutable commit SHAs where supply-chain risk matters. Give `GITHUB_TOKEN` only required permissions. Use concurrency groups to cancel obsolete builds, dependency caches to avoid repeated downloads, and artifacts for evidence rather than as hidden mutable state.

#### Read

- [GitHub Actions quickstart](https://docs.github.com/en/actions/get-started/quickstart) — **official guide, beginner**. Events, jobs, runners, steps, and logs.
- [Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions) — **docs, beginner–intermediate**. Workflow execution model and vocabulary.
- [Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use) — **security reference, intermediate**. Untrusted input, tokens, secrets, pinning, and third-party action risk.
- [`actions/starter-workflows`](https://github.com/actions/starter-workflows) — **exemplary repository, intermediate**. Maintained CI, deployment, scanning, and automation templates.

#### Build

For project 06, run type or syntax checks, tests, a dependency audit, and a Docker build on pull requests. Cancel superseded runs. Upload test and build evidence. Keep deployment credentials in an environment unavailable to pull-request code.

#### Prove

- Break a test and show that merge is blocked.
- Open a pull request from an untrusted context and show that production secrets are unavailable.
- Inspect workflow permissions and explain every granted write capability.
- Re-run the same commit and obtain the same tested artifact digest.

### Observability

Logs describe events, metrics summarize behavior over time, and traces connect work across boundaries. Correlation requires context propagation through HTTP and queue messages. Instrument the user path and failure path; collecting host CPU alone cannot explain whether users can complete work.

Start with service-level indicators: successful request ratio, latency distribution, queue completion delay, and correctness signals. Avoid unbounded metric labels such as user ID, request ID, or raw URL. Put high-cardinality identifiers in logs and traces.

#### Read

- [OpenTelemetry concepts](https://opentelemetry.io/docs/concepts/) — **official docs, beginner–intermediate**. Signals, resources, context, instrumentation, SDKs, and collectors.
- [OpenTelemetry Demo](https://opentelemetry.io/docs/demo/) — **free official lab, intermediate**. A realistic microservice system with prepared fault scenarios.
- [`open-telemetry/opentelemetry-demo`](https://github.com/open-telemetry/opentelemetry-demo) — **exemplary repository, intermediate–advanced**. Cross-language instrumentation with Docker and Kubernetes deployment.
- [Prometheus tutorials](https://prometheus.io/docs/tutorials/) — **free official tutorials, beginner–intermediate**. Scraping, metric types, PromQL, Grafana, and alerting.

#### Build

Trace one project 06 operation through HTTP request, tenant-scoped database call, outbox publication, queue delivery, worker attempt, and terminal result. Add request rate, error rate, latency, queue age, retry, and dead-letter metrics. Log tenant and correlation identifiers without logging secrets or full webhook bodies.

#### Prove

- Start with one failed user operation and find its database and worker spans without searching by timestamp.
- Trigger a worker backlog; queue age rises before job failures appear.
- Trigger duplicate delivery; telemetry shows multiple attempts and one business effect.
- Check metric labels against realistic tenant and request volume for cardinality growth.

### Security

Authentication identifies an actor. Authorization decides whether that actor may perform this action on this resource in this tenant. Perform authorization on the server at the data-access boundary; hiding a button is not enforcement.

Treat tenant ID, webhook content, queue payloads, workflow inputs, and deployment metadata as untrusted. Verify signatures before parsing privileged meaning. Default roles to deny. Keep immutable audit records for membership and destructive actions. Rotate credentials without rebuilding images.

#### Read

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) — **reference, intermediate**. Deny-by-default, least privilege, per-request checks, and relationship-based access.
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/latest/) — **open reference book, intermediate–advanced**. Repeatable tests for identity, sessions, authorization, input, APIs, cryptography, and configuration.
- [`juice-shop/juice-shop`](https://github.com/juice-shop/juice-shop) — **training repository, beginner–advanced**. An intentionally vulnerable application; run it only in an isolated local environment.
- [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) — **official docs, intermediate**. Database-enforced tenant policies as defense in depth.

#### Build

Require tenant ID in every project 06 repository call. Enforce owner, admin, member, and viewer permissions server-side. Add row-level security after repository tests pass. Verify webhook signatures, redact secrets, and append audit events for membership and destructive actions.

#### Prove

- Attempt cross-tenant reads using known object IDs; no data returns.
- Attempt each write with every role; unspecified permissions deny.
- Tamper with a signed webhook; rejection happens before deduplication or business processing.
- Query audit history and reconstruct who changed membership, what changed, and when.

### Level 2 milestone

Complete [project 06 acceptance](../../projects/06-team-saas/acceptance.md) and [project 06 exercises](../../projects/06-team-saas/exercises.md). Keep the dead-letter example, concurrent webhook test, cross-tenant test, and end-to-end trace as review artifacts.

---

## Level 3 — Production operation

### System design

A design begins with workload and invariants, not products. Estimate reads, writes, storage growth, payload size, concurrency, latency targets, and acceptable loss. Mark synchronous boundaries, durable boundaries, ownership, trust zones, and single points of failure. Every cache, replica, queue, and retry changes correctness as well as performance.

Use the simplest consistency model that preserves the business invariant. Strong consistency coordinates writers but costs latency and availability during partitions. Eventual consistency permits temporary disagreement, so the product must define reconciliation and user-visible stale states.

#### Read

- [Designing Data-Intensive Applications, 2nd Edition](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781098119058/) — **book, intermediate–advanced**. Current treatment of data models, storage, replication, sharding, transactions, distributed failure, consensus, batch, and streams.
- [System Design Primer](https://github.com/donnemartin/system-design-primer) — **exemplary repository, beginner–intermediate**. A broad index of trade-offs, estimates, architectures, and design exercises.
- [MIT 6.824 Distributed Systems course](https://pdos.csail.mit.edu/6.824/schedule.html) — **free course, advanced**. Lectures and labs on replication, consensus, transactions, and fault tolerance.
- [Google Cloud Architecture Framework](https://cloud.google.com/architecture/framework) — **official framework, intermediate**. Operational excellence, security, reliability, cost, performance, and sustainability review questions.

#### Build

Draw project 08 as a state machine and a boundary diagram. Mark workflow state, approval record, execution key, external effect, telemetry, credentials, and human actor. For each transition, write the precondition, durable write, allowed retry, timeout, and terminal state.

#### Prove

- Explain the exact outcome when the process crashes before an external write, after the write, and after recording completion.
- Identify which invariants rely on database constraints rather than application timing.
- Estimate maximum work and cost for one workflow and for concurrent workflows.
- Remove one dependency at a time from the diagram and state the degraded behavior.

### Deployment

Deployment changes running state. A safe release has an immutable artifact, reviewed configuration, migration order, health gates, controlled traffic shift, observable verification, and a rollback or forward-fix path. A successful pipeline step does not prove the service works for users.

Readiness answers whether an instance should receive traffic. Liveness answers whether it is irrecoverably stuck. Startup probes protect slow initialization. A liveness probe that depends on every downstream service can restart healthy instances during an outage and make recovery harder.

#### Read

- [Kubernetes Basics](https://kubernetes.io/docs/tutorials/kubernetes-basics/) — **free official tutorial, beginner–intermediate**. Deploy, expose, scale, update, and debug a containerized application.
- [Kubernetes Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) — **docs, intermediate**. Rollouts, desired state, strategy, history, pause, resume, and rollback.
- [Configure probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) — **docs, intermediate**. Readiness, liveness, startup, timing, and failure behavior.
- [`kubernetes/examples`](https://github.com/kubernetes/examples) — **exemplary repository, intermediate**. SIG Apps examples with deployment, verification, and cleanup instructions.

#### Build

Deploy [08 — Production Operator](../../projects/08-production-operator/) to staging with immutable image tags, non-root execution, explicit resource requests and limits, readiness and startup probes, external secrets, migration gating, and rollback commands. Separate read-tool and write-tool credentials.

#### Prove

- Deploy a bad readiness response; no user traffic reaches the new instances.
- Interrupt rollout midway; the previous version continues serving or rollback restores it within the stated objective.
- Restart all application instances; durable workflow state resumes.
- Rotate one credential without rebuilding the application image.

### SRE

An SLI measures behavior users experience. An SLO sets the acceptable target over a window. The error budget is the allowed unreliability: `1 − SLO`. Alerts should fire when the current burn rate threatens that budget, not whenever a machine metric looks unusual.

Pages require urgent human action. Tickets require action during working hours. Dashboards support investigation. Every page needs an owner, a user-visible symptom, a runbook action, and enough context to decide whether to mitigate, roll back, or escalate.

#### Read

- [Site Reliability Engineering](https://sre.google/sre-book/table-of-contents/) — **free book, intermediate**. SLOs, monitoring, automation, release engineering, overload, incident response, and culture.
- [The Site Reliability Workbook](https://sre.google/workbook/table-of-contents/) — **free book, intermediate–advanced**. Practical SLO, alerting, incident, and operational patterns.
- [Building Secure and Reliable Systems](https://sre.google/books/building-secure-reliable-systems/) — **free book, advanced**. Security and reliability as one production design problem.
- [Google SRE resources](https://sre.google/resources/) — **courses, talks, articles, and case studies, all levels**. Use after the books to deepen a specific operational gap.

#### Watch

- [Risk and Error Budgets](https://www.youtube.com/watch?v=y2ILKr8kCJU) — **Google Cloud video, beginner–intermediate**. Seth Vargo and Liz Fong-Jones show how SLOs turn release-versus-reliability arguments into policy.

#### Build

For project 08, define availability and successful-execution SLIs, a 30-day SLO, and multi-window burn-rate alerts. Write runbooks for provider outage, cost spike, bad release, and rollback. Include cancellation, timeout, cost ceiling, and graceful degradation when write tools are unavailable.

#### Prove

- Replay telemetry from a known incident and show when the fast-burn and slow-burn alerts fire.
- Trigger an alert and follow only the runbook to mitigation; record missing or ambiguous steps.
- Restore from backup or durable records into a clean environment and verify workflow state.
- Run a bad-release drill and measure detection and recovery time.

### Production security boundary

Prompt text, model output, queue payloads, and tool arguments are data. They cannot grant permission. Tool schemas, credentials, allowlists, approval records, and state-machine transitions enforce permission outside the model.

Approval binds a person to the exact normalized action they reviewed. If the tool, target, arguments, evidence, or policy version changes, approval is invalid. Execution uses a durable key so restart and retry return the recorded result rather than repeat the side effect.

#### Read

- [MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture) — **official docs, intermediate**. Hosts, clients, servers, tools, resources, and transport boundaries.
- [MCP security best practices](https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices) — **official specification guidance, advanced**. Authorization, token handling, confused-deputy risks, and session boundaries.
- [OWASP GenAI Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) — **security reference, intermediate**. Prompt injection, excessive agency, data leakage, supply chain, and resource consumption.

#### Build

Keep project 08 tool definitions and permissions outside prompts. Separate investigation reads from approved writes. Store the proposed action fingerprint with evidence and approval. Persist execution status transactionally and document reconciliation for external systems that do not accept idempotency keys.

#### Prove

- Change one approved argument before execution; the write is rejected.
- Inject instructions through retrieved content; tool permissions and state transitions do not change.
- Crash after the external write but before local completion; retry returns or reconciles the original result.
- Remove write credentials; investigation continues and execution fails closed.

### Level 3 milestone

Complete [project 08 acceptance](../../projects/08-production-operator/acceptance.md) and [project 08 exercises](../../projects/08-production-operator/exercises.md). The final evidence set contains:

1. A state-machine diagram with durable boundaries.
2. A crash-after-write deduplication test.
3. CI results for types or syntax, tests, dependency audit, and eval regression.
4. A staging URL with logs, metrics, traces, and one actionable alert.
5. A completed rollback drill and incident runbook.

## Final review questions

Answer these from runtime evidence:

1. Which operations may be delivered more than once?
2. Where is uniqueness enforced under concurrency?
3. Which messages can be lost, and which can be replayed?
4. What stops retry amplification and unbounded backlog?
5. What survives application, broker, database, and deployment restarts?
6. Can one tenant exhaust or read another tenant's resources?
7. Can one trace connect acceptance to final asynchronous outcome?
8. Which alert represents user harm and which action follows it?
9. What is the rollback path when schema and code change together?
10. Which production writes require human approval, and what exact data does that approval bind?
