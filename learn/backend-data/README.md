# Backend and Data Engineering Playbook

Last verified: **2026-09-09**

Build one issue-tracking system through this playbook. Start with an HTTP contract, put its invariants in PostgreSQL, implement the same behavior in one server framework, add identity and permissions, then introduce tenant isolation and asynchronous work. The sequence matters: multi-tenancy amplifies every earlier mistake in resource modeling, transactions, authorization, and tests.

## The operating loop: Read, Watch, Build, Prove

Every topic uses the same four-step loop.

1. **Read** the protocol, framework, or database source that defines the behavior.
2. **Watch** one precise explanation to see the mechanism executed or diagrammed.
3. **Build** a narrow vertical slice that crosses HTTP, application logic, and storage.
4. **Prove** the property with an executable check, failure injection, query plan, or adversarial test.

Reading creates vocabulary. Building exposes missing decisions. Proof distinguishes a backend that appears to work from one that keeps working under invalid input, retries, concurrency, and hostile identifiers.

## Route by level

| Level | Route | Required outcome |
| --- | --- | --- |
| **Foundation** | HTTP semantics → resource-oriented API design → SQL → PostgreSQL constraints and transactions | You can specify an API before choosing a framework and explain which invariants belong in the database. |
| **Builder** | Choose Fastify, FastAPI, or Spring Boot → complete [03 — Issue API](../../projects/03-issue-api/README.md) | One implementation passes the HTTP contract, PostgreSQL integration, rollback, pagination, and shutdown checks. |
| **Product** | Authentication → sessions or OIDC → resource-level authorization → complete [04 — Full-stack issue tracker](../../projects/04-issue-tracker/README.md) | Two users can use one deployment without reading or changing each other's private resources. |
| **Production** | Test strategy → idempotency → tenant context → row-level security → queues, audit, and observability → complete [06 — Team SaaS](../../projects/06-team-saas/README.md) | Multiple organizations share the system while data, permissions, retries, and operational signals remain tenant-aware. |

If you already know one framework, do not skip the foundation route. Framework fluency does not replace knowledge of HTTP caching, stable pagination, transaction boundaries, indexes, or access control.

---

## 1. HTTP and API design

### Mechanism

HTTP is a state-transfer protocol with standardized semantics. A request identifies a target, declares an operation with a method, carries representation metadata in headers, and may include a body. A response reports the result with a status code, headers, and an optional representation.

The method changes the contract:

- `GET` is safe: clients and intermediaries may repeat it without intending a state change.
- `PUT` and `DELETE` are idempotent: repeating the same request should leave the resource in the same intended state.
- `POST` is not inherently idempotent. Retry-safe writes need a client-supplied idempotency key or a naturally unique operation identifier.
- `PATCH` describes a partial change. Its media type must define how the patch is interpreted; a partial JSON object is not automatically a complete patch contract.

Status codes describe protocol outcomes, not application mood. Use `400` for malformed requests, `401` when authentication is required or invalid, `403` when an authenticated principal is known but forbidden, `404` when the resource is not exposed, `409` for a state conflict, `412` for a failed precondition, `422` for semantically invalid input when that distinction helps clients, and `429` for enforced rate limits.

An API is easier to evolve when URLs name resources and representations carry links or identifiers to related resources. Commands that do not map cleanly to CRUD can be modeled as subordinate resources: assigning an issue can create an assignment; requesting an export can create an export job. This gives the operation an identity, status, retry behavior, and audit trail.

### Read

- **[MDN HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)** — official reference, beginner. Read the sections on messages, methods, status codes, headers, caching, conditional requests, cookies, and content negotiation. MDN states the observable semantics that framework helpers often hide.
- **[API Design Patterns](https://www.manning.com/books/api-design-patterns) by JJ Geewax** — book, intermediate. Use it for resource naming, standard methods, pagination, partial updates, long-running operations, validation, and API evolution.
- **[Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines)** — exemplary repository, intermediate. Study error contracts, repeatability, optimistic concurrency, versioning, and long-running operations as production decisions rather than stylistic preferences.
- **[Google API Improvement Proposals](https://google.aip.dev/)** — public design standards, intermediate. AIPs are short design records for naming, standard methods, pagination, filtering, and resource behavior.
- **[OpenAPI Specification](https://spec.openapis.org/oas/latest.html)** — primary specification, intermediate. Read enough to describe operations, parameters, reusable schemas, security requirements, and error responses without relying on generated annotations.

### Watch

- **[Full HTTP Networking Course – Fetch and REST APIs in JavaScript](https://www.youtube.com/watch?v=2JYT5f2isg4)** — freeCodeCamp video course, beginner. Watch the HTTP, request/response, headers, REST, and failure-handling chapters; the client code makes protocol behavior visible.

### Build

Write the issue API contract before its implementation:

- `GET /health`
- `GET /users`
- `GET /issues?cursor=...&limit=...`
- `POST /issues`
- `POST /issues/{issueId}/comments`
- `POST /issues/{issueId}/assign`

Define request and response schemas, one structured error envelope, pagination metadata, request IDs, and the authorization requirement for every operation. Encode cursors as opaque URL-safe data containing the last stable sort key, not a database offset.

### Prove

- Every operation and response appears in generated OpenAPI.
- Invalid input returns one documented error shape with a request ID.
- Repeating a `GET` does not mutate state.
- A retried non-idempotent write does not create duplicate effects after idempotency is added.
- Cursor pagination remains stable when two rows share the same timestamp because ordering uses `(created_at, id)`.

### Project milestone

Complete the HTTP boundary in [03 — Issue API](../../projects/03-issue-api/README.md). Use its [brief](../../projects/03-issue-api/brief.md), verify every item in [acceptance](../../projects/03-issue-api/acceptance.md), and perform the failure cases in [exercises](../../projects/03-issue-api/exercises.md).

---

## 2. SQL and PostgreSQL

### Mechanism

A relational schema is an executable model of facts. A primary key gives each row identity. A foreign key prevents references to absent rows. A unique constraint prevents duplicate facts. A check constraint rejects states that are invalid regardless of which application wrote them. These are concurrency-safe guarantees because PostgreSQL evaluates them where all writers meet.

A transaction defines one atomic state change. If issue assignment and audit insertion represent one business action, both statements belong in the same transaction. Committing them separately permits an assigned issue with no audit record or an audit record for an assignment that never happened.

Isolation controls what concurrent transactions may observe. PostgreSQL's default `READ COMMITTED` level gives each statement a fresh snapshot; a read followed by a write can therefore race. Protect contested changes with one atomic statement, a row lock, a unique constraint, or optimistic concurrency such as `UPDATE ... WHERE id = $1 AND version = $2` followed by a row-count check.

An index is a maintained search structure, not a generic speed switch. It helps when its leading columns match filtering and ordering patterns closely enough to avoid scanning and sorting large row sets. It also consumes storage and adds work to inserts and updates. Add an index after naming the query it serves and save `EXPLAIN (ANALYZE, BUFFERS)` evidence.

Offset pagination asks PostgreSQL to walk past earlier rows and becomes unstable when rows are inserted or removed. Keyset pagination asks for rows after the last observed sort tuple:

```sql
SELECT id, title, created_at
FROM issues
WHERE (created_at, id) < ($1, $2)
ORDER BY created_at DESC, id DESC
LIMIT $3;
```

The matching index begins with the same ordered columns.

### Read

- **[PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html)** — official documentation, beginner. Covers tables, queries, joins, aggregates, foreign keys, transactions, views, and window functions.
- **[PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)** — official documentation, intermediate. Learn to distinguish estimates from actual execution and scans from joins, sorts, and buffer work.
- **[Designing Data-Intensive Applications, 2nd Edition](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781098119058/) by Martin Kleppmann and Chris Riccomini** — book, intermediate to advanced. Read the chapters on data models, storage, transactions, replication, consistency, and distributed failure after completing the issue API.

### Watch

- **[#02 — Modern SQL, CMU Intro to Database Systems](https://www.youtube.com/watch?v=MzigBKf84aY)** — Andy Pavlo, Carnegie Mellon University, intermediate. The lecture explains SQL through relational operations instead of ORM syntax.

### Free course and practice

- **[SQLBolt](https://sqlbolt.com/)** — interactive course, beginner. Complete every lesson through joins, aggregates, mutations, and schema changes.
- **[PostgreSQL Exercises](https://www.pgexercises.com/)** — exercise set, beginner to advanced. Complete joins, subqueries, aggregates, window functions, and recursive queries against one consistent dataset.
- **[CMU 15-445/645 Intro to Database Systems, Fall 2024](https://15445.courses.cs.cmu.edu/fall2024/)** — free university course, advanced. Use the lectures on B+ trees, joins, query execution, optimization, concurrency control, MVCC, logging, and recovery after you can already write SQL.

### Build

Create migrations for users, issues, comments, assignments, and audit events. Put required relationships and value constraints in PostgreSQL. Implement the issue feed with keyset pagination. Wrap assignment and its audit event in one transaction.

### Prove

- Apply all migrations to an empty database without manual steps.
- Attempt orphaned comments, duplicate memberships, and invalid states; PostgreSQL rejects them.
- Force audit insertion to fail; assignment rolls back.
- Seed 100,000 issues and save before/after `EXPLAIN ANALYZE` output for the feed index.
- Run two concurrent updates against the same version; exactly one succeeds.

### Project milestone

[03 — Issue API acceptance](../../projects/03-issue-api/acceptance.md) requires foreign keys, checks, a feed index, one assignment-and-audit transaction, disposable PostgreSQL tests, and saved query-plan evidence. Do not call the project complete while it runs only against the in-memory adapter.

---

## 3. Server implementation routes

Choose one route for the first complete implementation. Then, if you want language breadth, port the same OpenAPI contract and PostgreSQL schema. A port is successful when external behavior remains unchanged; rewriting endpoints with different validation, errors, or transaction semantics is a new product, not a framework comparison.

The repository's exact Python and Java requirements are in [03 — Alternative backend routes](../../projects/03-issue-api/alternative-backends.md).

### Route A: Node.js and Fastify

#### Mechanism

Node.js executes JavaScript callbacks on an event loop. Network waiting does not occupy the loop, but CPU-heavy computation and synchronous filesystem or cryptographic work do. One blocking request delays unrelated clients because their callbacks cannot run until the loop is available.

Fastify builds an application from encapsulated plugins. A plugin can register routes, hooks, decorators, and infrastructure for its own scope and descendants. This makes loading order and dependency visibility explicit. Route JSON Schemas drive validation and response serialization; response schemas also reduce accidental data leakage by excluding undeclared fields.

#### Read

- **[Introduction to Node.js](https://nodejs.org/learn/getting-started/introduction-to-nodejs)** and **[Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)** — official documentation, beginner to intermediate. Read these before discussing Node scalability.
- **[Fastify: Getting Started](https://fastify.dev/docs/latest/Guides/Getting-Started/)** — official guide, beginner. Covers routes, plugins, loading order, validation, serialization, and injection testing.
- **[Node.js Design Patterns, Third Edition](https://www.packtpub.com/en-at/product/nodejs-design-patterns-9781839214110) by Mario Casciaro and Luciano Mammino** — book, intermediate. Use the runtime, module, dependency-injection, messaging, and scalability chapters.

#### Watch

- **[1, 2, 3... Fastify!](https://www.youtube.com/watch?v=-X84Cq-nsLw)** — Matteo Collina, Fastify co-creator, conference talk, beginner to intermediate. Focuses on routing, tests, performance, and the plugin system.

#### Exemplary repository

- **[Fastify Official Demo](https://github.com/fastify/demo)** — maintained reference application, intermediate. It demonstrates TypeScript, schemas, API documentation, testing, task assignment, and role-based access. Study boundaries and framework usage; do not copy its unrelated stack choices.

#### Build

Implement Project 03 with route schemas, a PostgreSQL pool plugin, repository functions, application services, structured logging, and graceful shutdown. Keep domain decisions out of route handlers.

#### Prove

- `fastify.inject()` exercises the HTTP contract without opening a port.
- A response schema prevents an internal field from reaching the client.
- A deliberately blocking handler increases latency for unrelated requests; removing the blocking work restores concurrency.
- `SIGTERM` stops new work before the database pool closes.

### Route B: Python and FastAPI

#### Mechanism

FastAPI maps Python type annotations and Pydantic models to request parsing, validation, serialization, dependency resolution, and OpenAPI. Dependencies form a request-scoped graph: authentication can produce a principal, authorization can consume the principal and loaded resource, and database setup can yield a transaction-bound connection.

`async def` improves concurrency only when the called libraries are also asynchronous and the work waits on I/O. CPU-bound Python inside an async endpoint still occupies the event-loop thread. A synchronous database driver inside `async def` does not become non-blocking because the endpoint has an async keyword.

#### Read

- **[FastAPI Tutorial — User Guide](https://fastapi.tiangolo.com/tutorial/)** — official course-style documentation, beginner to intermediate. Complete dependencies, security, SQL databases, bigger applications, and testing.
- **[Pydantic Models](https://docs.pydantic.dev/latest/concepts/models/)** — official documentation, intermediate. Separate input, stored, and output models so writable fields and returned fields remain explicit.
- **[psycopg Transactions](https://www.psycopg.org/psycopg3/docs/basic/transactions.html)** — official documentation, intermediate. Make transaction ownership visible instead of relying on accidental connection behavior.
- **[Architecture Patterns with Python](https://www.cosmicpython.com/) by Harry Percival and Bob Gregory** — free online book, intermediate. Use it for domain models, repositories, unit of work, ports and adapters, and events.

#### Watch

- **[Python API Development – Comprehensive Course for Beginners](https://www.youtube.com/watch?v=0sOvCWFmrtA)** — freeCodeCamp video course, beginner to intermediate. It builds a substantial FastAPI API with PostgreSQL, authentication, and tests.

#### Exemplary repository

- **[Full Stack FastAPI Template](https://github.com/fastapi/full-stack-fastapi-template)** — official maintained template, intermediate. Inspect its PostgreSQL integration, JWT authentication, password hashing, pytest suite, Docker setup, and CI. Treat it as a reference, not a mandatory architecture.

#### Build

Port Project 03 with Pydantic request/response models, explicit psycopg transaction boundaries, migrations, dependency-injected repositories, and pytest fixtures. Preserve malformed-cursor behavior and the existing error envelope.

#### Prove

- The generated OpenAPI contains the required paths and schemas.
- The same black-box fixtures pass against Fastify and FastAPI.
- Overridden test dependencies do not bypass authorization checks.
- A forced audit failure rolls back assignment on real PostgreSQL.

### Route C: Java and Spring Boot

#### Mechanism

Spring Boot assembles an application context from explicit beans and conditional auto-configuration. Spring MVC maps HTTP requests to controllers; Bean Validation checks DTOs; Spring's transaction interceptor opens, commits, or rolls back a transaction around proxied application methods.

`@Transactional` is effective only when a call crosses the Spring proxy. A method calling another transactional method on `this` does not pass through that proxy. Put the transaction boundary on an application service invoked from outside the bean, and test rollback against PostgreSQL.

#### Read

- **[Building REST Services with Spring](https://spring.io/guides/tutorials/rest/)** — official tutorial, beginner to intermediate. Covers web, persistence, errors, and API evolution.
- **[Spring Boot Reference](https://docs.spring.io/spring-boot/index.html)** — official documentation, intermediate. Use it for configuration, testing, data access, observability, packaging, and production behavior.
- **[Spring Start Here](https://www.manning.com/books/spring-start-here) by Laurențiu Spilcă** — book, beginner to intermediate. Strong route through the application context, dependency injection, REST, persistence, security, and tests.

#### Watch and free course

- **[Building a REST API with Spring Boot](https://spring.academy/courses/building-a-rest-api-with-spring-boot)** — free official Spring Academy course, beginner. Its labs cover REST, persistence, test-driven development, authentication, and authorization.
- **[Spring Boot 4 Tutorial – Learn Spring Boot in 30 Minutes](https://www.youtube.com/watch?v=59twysAveKI)** — Amigoscode video, beginner. Use it as a current overview of Boot 4, API versioning, HTTP clients, and resilience, not as a substitute for the reference documentation.

#### Exemplary repository

- **[Spring PetClinic REST](https://github.com/spring-petclinic/spring-petclinic-rest)** — maintained reference application, intermediate. It includes an OpenAPI-first REST surface, PostgreSQL support, roles, integration tests, API tests, and performance tests.

#### Build

Port Project 03 with Java 21+, records for DTOs, Spring MVC, Bean Validation, JDBC or jOOQ, Flyway, `@ControllerAdvice`, `@Transactional`, springdoc-openapi, and Testcontainers PostgreSQL.

#### Prove

- MockMvc verifies HTTP mapping and errors; it is not used as proof of PostgreSQL behavior.
- Testcontainers verifies migrations, constraints, keyset queries, and rollback.
- Assignment and audit insertion use one externally invoked transactional service method.
- Generated `/v3/api-docs` contains the paths required by Project 03 acceptance.

---

## 4. Authentication

### Mechanism

Authentication establishes which principal is making a request. Authorization decides what that principal may do. A valid session or token proves neither ownership nor permission.

A server-side session sends the browser an opaque random identifier. The server stores the associated principal and expiry. The cookie should be `HttpOnly`, `Secure` in production, and use an intentional `SameSite` policy. Rotate the session identifier after authentication or privilege changes, expire it server-side, and invalidate it on logout. Because browsers attach cookies automatically, state-changing requests also need CSRF protection unless the architecture removes that ambient authority.

OAuth 2.x delegates access to protected resources. OpenID Connect adds identity claims and an ID token for authentication. For browser-based authorization, use authorization code with PKCE. A resource server must validate the access token's signature, issuer, audience, expiry, and required scopes. Decoding a JWT without validating it is not authentication.

Passwords require a password-hashing function designed to be slow and tunable, such as Argon2id. Salts prevent equal passwords from producing equal stored hashes. Rate limits, generic failure responses, secure recovery, MFA, and reauthentication protect the surrounding workflow; a strong hash alone does not make login safe.

### Read

- **[OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)** — security guidance, intermediate. Covers identifiers, passwords, recovery, MFA, throttling, reauthentication, OIDC, and error handling.
- **[OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)** — security guidance, intermediate. Use it for cookie attributes, lifecycle, fixation prevention, expiry, and invalidation.
- **[OAuth 2 in Action](https://www.manning.com/books/oauth-2-in-action) by Justin Richer and Antonio Sanso** — book, intermediate to advanced. It explains the protocol from client, authorization-server, and resource-server perspectives and shows why implementation shortcuts fail.

### Watch

- **[OAuth 2.0 and OpenID Connect (in plain English)](https://www.youtube.com/watch?v=996OiexHze0)** — Nate Barbettini, OktaDev, beginner to intermediate. The OAuth/OIDC distinction remains useful. The video predates current browser guidance: ignore its implicit-flow material and use authorization code with PKCE.

### Exemplary repository

- **[Keycloak Quickstarts](https://github.com/keycloak/keycloak-quickstarts)** — official examples, intermediate. The repository contains small integrations for JavaScript, Node.js, Spring, Jakarta applications, proxies, and authorization services.

### Build

For Project 04, begin with server-side sessions and an opaque cookie. Add login, logout, expiry, rotation, and CSRF protection. As a second implementation, run Keycloak locally and make the API validate OIDC access tokens.

### Prove

- The cookie is opaque, HTTP-only, and same-site; production configuration adds `Secure`.
- An expired or server-invalidated session cannot write.
- Login and recovery responses do not reveal whether an account exists.
- A token with a valid signature but wrong issuer or audience is rejected.
- Authentication tests do not assert authorization merely because login succeeded.

---

## 5. Authorization

### Mechanism

Authorization evaluates a tuple: **principal, action, resource, context**. Checking only a role or only a route misses resource ownership and tenant scope. Load the resource through an authorized boundary or check permission after loading it; never trust a client-supplied owner or tenant identifier as proof.

Role-based access control assigns permissions to roles and roles to principals. It works for stable job functions such as viewer, member, and tenant admin. Attribute-based access control evaluates properties of the principal, resource, action, and environment. It handles rules such as “members may update issues in their tenant unless the project is archived.” ACLs store grants on individual resources. Most products combine these models rather than choosing one universally.

Deny by default. A new route, action, or role should have no access until a rule grants it. Return the same external result for absent and unauthorized private resources when revealing existence would leak information. The browser may hide controls, but only the server can enforce access.

### Read

- **[OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)** — security guidance, intermediate. Covers deny-by-default rules, per-request checks, least privilege, RBAC/ABAC, IDOR prevention, and authorization tests.
- **[Open Policy Agent: HTTP API Authorization](https://www.openpolicyagent.org/docs/http-api-authorization)** — official tutorial, intermediate. Demonstrates context-aware policy decisions for HTTP APIs.
- **[Keycloak Authorization Services Guide](https://www.keycloak.org/docs/latest/authorization_services/)** — official documentation, advanced. Covers resources, scopes, policies, permissions, and enforcement points.

### Exemplary repository

- **[Open Policy Agent](https://github.com/open-policy-agent/opa)** — CNCF graduated policy engine, intermediate to advanced. Study how applications send structured input to a policy decision point and enforce the returned decision.

### Build

Write a permission matrix for owner, member, viewer, tenant admin, and platform operator. Implement one owner-scoped repository boundary for private projects. For a policy-engine exercise, express `principal × action × resource × tenant` decisions in OPA while keeping policy integration behind an application interface.

### Prove

- Changing a project ID cannot expose another user's project.
- Read and write attempts against an absent or unauthorized private project return the same external result.
- Every state-changing operation checks the loaded resource, not just the route.
- Adding a new role grants nothing until explicit permissions exist.
- Authorization denial is tested independently of authentication failure.

### Project milestone

Complete [04 — Full-stack issue tracker](../../projects/04-issue-tracker/README.md). Its [brief](../../projects/04-issue-tracker/brief.md) defines private-resource behavior. Its [acceptance](../../projects/04-issue-tracker/acceptance.md) requires opaque server-side sessions and cross-user `404` behavior for both reads and writes. Use the two-browser-context exercise in [exercises](../../projects/04-issue-tracker/exercises.md) to preserve isolation through the UI.

---

## 6. Testing backend systems

### Mechanism

A test should fail when an observable contract breaks and remain stable when internal structure changes. Different tests own different risks:

- **Domain tests** prove business rules with no network or database.
- **Repository integration tests** prove SQL, mappings, migrations, constraints, locks, and transaction behavior against real PostgreSQL.
- **HTTP tests** prove routing, validation, serialization, error mapping, authentication, and authorization through the framework boundary.
- **Contract tests** run the same black-box scenarios against multiple implementations.
- **End-to-end tests** prove a small number of critical browser, identity-provider, API, and storage paths.

Mocks are useful at process boundaries when the test owns the interaction contract. Mocking every class couples tests to call structure and can produce a green suite around a broken SQL query or transaction. Use disposable real infrastructure where compatibility is the property under test.

Failure injection proves atomicity and recovery. Make the second statement in a transaction fail. Redeliver a webhook. Crash a worker after an external call but before acknowledgement. Reuse a pooled connection after another tenant's request. These tests expose guarantees that happy-path coverage cannot.

### Read

- **[Unit Testing Principles, Practices, and Patterns](https://www.manning.com/books/unit-testing) by Vladimir Khorikov** — book, intermediate. Strong framework-neutral model for observable behavior, test value, mocks, and integration boundaries.
- **[Fastify Testing Guide](https://fastify.dev/docs/latest/Guides/Testing/)** — official documentation, beginner to intermediate. Shows application separation, `inject()`, and lifecycle handling.
- **[FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)** — official documentation, beginner to intermediate. Covers `TestClient`, dependency overrides, and async testing.
- **[Spring: Testing the Web Layer](https://spring.io/guides/gs/testing-web/)** — official guide, intermediate. Demonstrates focused web tests instead of loading the full application for every assertion.
- **[Testcontainers](https://docs.docker.com/testcontainers/)** — official cross-language guides, intermediate. Use disposable PostgreSQL from Node.js, Python, or Java tests.

### Watch

- **[TDD, Where Did It All Go Wrong](https://www.youtube.com/watch?v=EZ05e7EMOLM)** — Ian Cooper, conference talk, intermediate. Explains why a unit of behavior is not necessarily one class and why excessive mock-driven tests resist refactoring.

### Build

Create one shared black-box suite for the Project 03 OpenAPI behavior. Add framework-native HTTP tests and Testcontainers-backed repository tests. Keep migrations identical across local development, tests, and deployment.

### Prove

- The suite fails when an error field, status code, cursor rule, or authorization decision changes.
- Repository tests run against real PostgreSQL, not SQLite or an in-memory substitute.
- A transaction test proves rollback by querying the database after injected failure.
- Tests run in any order and in parallel without shared mutable fixtures.
- The same contract suite can target Fastify, FastAPI, and Spring Boot implementations.

---

## 7. Multi-tenancy

### Mechanism

A tenant is a customer boundary, usually an organization rather than an individual user. Multi-tenancy means one operated service supports multiple tenant contexts. It does not require every component to share every resource.

Isolation is a spectrum:

- **Silo:** dedicated application or database resources per tenant. Stronger fault and data boundaries, higher provisioning and operating cost.
- **Pool:** tenants share resources and rows are partitioned by tenant identity. Efficient, but every access path must preserve tenant context.
- **Bridge:** selected components are dedicated while others remain shared. Enterprise tiers often use this model.

Tenant context must come from verified identity and current membership, not a freely editable header. Once resolved, carry it through repository calls, cache keys, object paths, queue messages, logs, traces, rate limits, and audit events. A missing tenant dimension in any shared subsystem creates a cross-tenant collision.

PostgreSQL row-level security provides a second enforcement layer. Enable RLS, define policies, use a runtime role that is neither superuser nor table owner and lacks `BYPASSRLS`, and force RLS where appropriate. With connection pooling, set tenant context transaction-locally so one request cannot leave session state for the next borrower.

RLS does not cover caches, object storage, search indexes, queues, analytics exports, or external services. Application authorization remains necessary, and tenant isolation needs adversarial tests at every shared boundary.

Asynchronous delivery is normally at least once. A producer may retry, a broker may redeliver, and a worker may crash after performing an effect. Store an idempotency or delivery key behind a unique constraint, and make duplicate processing return the prior result or perform no second effect. If a database change must emit work, a transactional outbox stores the business change and pending message in one transaction; a relay publishes committed outbox rows later.

### Read

- **[Building Multi-Tenant SaaS Architectures](https://www.oreilly.com/library/view/building-multi-tenant-saas/9781098140632/) by Tod Golding** — book, intermediate to advanced. Covers control and application planes, tenant context, isolation, data partitioning, onboarding, tiering, operations, and noisy neighbors.
- **[AWS SaaS Tenant Isolation Strategies](https://docs.aws.amazon.com/whitepapers/latest/saas-tenant-isolation-strategies/saas-tenant-isolation-strategies.html)** — architecture whitepaper, advanced. Separates authentication from isolation and compares pooled and siloed enforcement.
- **[Azure: Tenancy Models for a Multitenant Solution](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models)** — architecture guide, intermediate to advanced. Treats isolation as a component-by-component spectrum rather than one system-wide switch.
- **[OWASP Multi-Tenant Application Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)** — security guidance, advanced. Covers tenant context, RLS, caches, queues, storage, rate limits, onboarding, offboarding, and audit logs.
- **[PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)** — official documentation, advanced. Read policy composition, default-deny behavior, role targeting, table-owner bypass, `BYPASSRLS`, and `FORCE ROW LEVEL SECURITY`.

### Watch

- **[SaaS Deep Dive: Designing & Building Multi-Tenant Solutions](https://www.youtube.com/watch?v=joz0DoSQDNw)** — Tod Golding, GOTO 2020, intermediate. Covers tenant context, microservices, data partitioning, isolation, identity, and onboarding in one focused session.
- **[AWS re:Invent 2019: SaaS Tenant Isolation Patterns](https://www.youtube.com/watch?v=fuDZq-EspNA)** — AWS Events, advanced. Compares isolation approaches across compute and storage resources.

### Exemplary repository

- **[Amazon ECS SaaS Reference Architecture](https://github.com/aws-samples/saas-reference-architecture-ecs)** — AWS reference implementation, advanced. Study its control plane, onboarding, routing, identity, service tiers, and isolation choices. It is architecture evidence, not a starter template for every SaaS product.

### Build

Extend the issue tracker with organizations, memberships, tenant roles, tenant-scoped repositories, per-tenant quotas, immutable audit events, a transactional outbox, retry limits, a dead-letter queue, and webhook deduplication. Add RLS as defense in depth after application-level tenant checks work.

### Prove

- Every repository method requires tenant context.
- A known issue ID from another tenant returns no data and cannot be changed.
- Forged tenant headers do not override verified membership.
- Pooled connections cannot retain another tenant's transaction-local context.
- Cache keys, object paths, queue messages, logs, traces, and limits include tenant identity.
- Webhook redelivery produces one effect.
- A worker retries to a fixed limit, then records the message in a dead-letter queue.
- Membership and destructive actions append immutable audit events.
- One trace connects the request, database transaction, queued job, worker attempt, and outcome.

### Project milestone

Complete [06 — Team SaaS](../../projects/06-team-saas/README.md). The [brief](../../projects/06-team-saas/brief.md) defines member and viewer behavior, duplicate-safe delivery, and audit requirements. The [acceptance contract](../../projects/06-team-saas/acceptance.md) requires tenant IDs on every repository call, deny-by-default roles, bounded retries, webhook deduplication, immutable audit events, and one cross-system trace. The [exercises](../../projects/06-team-saas/exercises.md) add PostgreSQL RLS, a transactional outbox, signature verification, per-tenant limits, and traced failure paths.

---

## Completion standard

The backend route is complete when the repository contains evidence for these properties:

- The OpenAPI contract is written independently of a framework.
- HTTP methods, statuses, errors, conditional writes, and pagination have explicit semantics.
- PostgreSQL owns relational integrity and transactionally indivisible changes.
- Query indexes have saved execution-plan evidence.
- One framework implementation passes HTTP and PostgreSQL integration tests.
- Authentication establishes a principal without granting implicit resource access.
- Authorization evaluates the requested action against the loaded resource and tenant.
- Private-resource tests cover both reads and writes with hostile identifiers.
- Multi-tenant isolation reaches databases, caches, files, queues, jobs, limits, logs, and traces.
- Retryable operations are idempotent, and database-backed work uses an outbox when atomic publication matters.
- Failure injection proves rollback, deduplication, bounded retry, dead-letter handling, and pool-safe tenant context.

Do not replace this evidence with framework choice, test counts, generated coverage percentages, or a claim that the architecture is production-ready.
