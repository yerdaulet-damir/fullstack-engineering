# Full-Stack Engineering Resources

This is the source index for the eight projects. Pick the section tied to your current project; do not turn the list into a reading backlog.

## 1. Web foundations

| Resource | Use it for | Build after opening it |
|---|---|---|
| [MDN Learn Web Development](https://developer.mozilla.org/en-US/docs/Learn_web_development) | HTML, CSS, browser JavaScript, forms, accessibility | [01 — launch page](./projects/01-launch-page/) |
| [web.dev Learn CSS](https://web.dev/learn/css/) | Layout, responsive design, cascade, color, focus | [01 — launch page](./projects/01-launch-page/) |
| [JavaScript.info](https://javascript.info/) | Language fundamentals, DOM, events, network requests | [01](./projects/01-launch-page/) then [02](./projects/02-data-dashboard/) |
| [GitHub Skills](https://skills.github.com/) | Git branches, pull requests, merge conflicts, Actions | Use on every project |
| [The Missing Semester](https://missing.csail.mit.edu/) | Shell, editors, Git, debugging, command-line data work | Use on every project |

## 2. Frontend engineering

| Resource | Use it for | Build after opening it |
|---|---|---|
| [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) | Types, narrowing, modules, compiler behavior | [02 — dashboard](./projects/02-data-dashboard/) |
| [React: Thinking in React](https://react.dev/learn/thinking-in-react) | Component and state boundaries | [02 — dashboard](./projects/02-data-dashboard/) |
| [React: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) | Avoid effects for derived state and event handling | [02 — dashboard](./projects/02-data-dashboard/) |
| [Vite guide](https://vite.dev/guide/) | Development server, environment variables, production build | [02 — dashboard](./projects/02-data-dashboard/) |
| [Testing Library principles](https://testing-library.com/docs/guiding-principles/) | Tests through visible user behavior | [02](./projects/02-data-dashboard/) and [04](./projects/04-issue-tracker/) |
| [Next.js App Router](https://nextjs.org/docs/app) | Routing, data access, metadata, server/client boundaries | [04 — issue tracker](./projects/04-issue-tracker/) |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Accessibility acceptance decisions | [01](./projects/01-launch-page/) and [04](./projects/04-issue-tracker/) |
| [web.dev Learn Performance](https://web.dev/learn/performance/) | LCP, CLS, responsiveness, resource loading | [01](./projects/01-launch-page/) and [04](./projects/04-issue-tracker/) |

## 3. Backend APIs

| Resource | Use it for | Build after opening it |
|---|---|---|
| [MDN HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview) | Requests, responses, methods, status codes, caching | [03 — issue API](./projects/03-issue-api/) |
| [HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) | Normative behavior when an API decision is unclear | [03 — issue API](./projects/03-issue-api/) |
| [Fastify documentation](https://fastify.dev/docs/latest/) | Node.js routes, schemas, plugins, logging, testing | [03 — Node route](./projects/03-issue-api/) |
| [OpenAPI Specification](https://spec.openapis.org/oas/latest.html) | A machine-readable API contract | [03 — issue API](./projects/03-issue-api/) |
| [FastAPI tutorial](https://fastapi.tiangolo.com/tutorial/) | Python API routing, validation, dependencies, testing | [03 — Python route](./projects/03-issue-api/alternative-backends.md#python-and-fastapi) |
| [Pydantic documentation](https://docs.pydantic.dev/latest/) | Python validation and serialization | [03 — Python route](./projects/03-issue-api/alternative-backends.md#python-and-fastapi) |
| [Spring Boot reference](https://docs.spring.io/spring-boot/index.html) | Java configuration, web APIs, data, testing, production features | [03 — Java route](./projects/03-issue-api/alternative-backends.md#java-and-spring-boot) |
| [Spring guides](https://spring.io/guides) | Small runnable Spring examples | [03 — Java route](./projects/03-issue-api/alternative-backends.md#java-and-spring-boot) |
| [Testcontainers for Java](https://java.testcontainers.org/) | Integration tests against real PostgreSQL and other services | [03 — Java route](./projects/03-issue-api/alternative-backends.md#java-and-spring-boot) |

## 4. Databases and application security

| Resource | Use it for | Build after opening it |
|---|---|---|
| [PostgreSQL tutorial](https://www.postgresql.org/docs/current/tutorial.html) | SQL and relational fundamentals | [03 — issue API](./projects/03-issue-api/) |
| [PostgreSQL transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html) | All-or-nothing multi-step changes | [03](./projects/03-issue-api/) and [06](./projects/06-team-saas/) |
| [PostgreSQL indexes](https://www.postgresql.org/docs/current/indexes.html) | Index types, cost, and query planning | [03 — issue API](./projects/03-issue-api/) |
| [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html) | Measure queries before adding indexes | [03 — issue API](./projects/03-issue-api/) |
| [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) | Defense in depth for tenant data | [06 — team SaaS](./projects/06-team-saas/) |
| [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) | Deny-by-default server-side access rules | [04](./projects/04-issue-tracker/) and [06](./projects/06-team-saas/) |
| [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) | Cookies, session IDs, expiry, invalidation | [04 — issue tracker](./projects/04-issue-tracker/) |
| [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) | Validation and storage boundaries | [04 — issue tracker](./projects/04-issue-tracker/) |

## 5. Realtime systems and SaaS operations

| Resource | Use it for | Build after opening it |
|---|---|---|
| [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) | Browser connection lifecycle and backpressure limits | [05 — live board](./projects/05-live-board/) |
| [WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455) | Frames, closing, masking, protocol behavior | [05 — live board](./projects/05-live-board/) |
| [AWS retries and backoff](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) | Bounded retries, jitter, overload avoidance | [05](./projects/05-live-board/) and [06](./projects/06-team-saas/) |
| [Redis Pub/Sub](https://redis.io/docs/latest/develop/pubsub/) | Understand lossy message delivery | [05 — live board](./projects/05-live-board/) |
| [Redis Streams](https://redis.io/docs/latest/develop/data-types/streams/) | Persisted event processing | [05](./projects/05-live-board/) and [06](./projects/06-team-saas/) |
| [Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html) | Keep database writes and emitted work consistent | [06 — team SaaS](./projects/06-team-saas/) |
| [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests) | A concrete retry-safe write contract | [06 — team SaaS](./projects/06-team-saas/) |
| [Docker Get Started](https://docs.docker.com/get-started/) | Containers and Compose | [03](./projects/03-issue-api/) onward |
| [GitHub Actions](https://docs.github.com/en/actions) | CI checks, environments, caching, secrets | Use on every deployed project |
| [OpenTelemetry](https://opentelemetry.io/docs/what-is-opentelemetry/) | Traces, metrics, and logs without vendor lock-in | [06](./projects/06-team-saas/) onward |
| [Google SRE: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/) | Alerts tied to user-visible failure | [06](./projects/06-team-saas/) onward |

## 6. AI product engineering

| Resource | Use it for | Build after opening it |
|---|---|---|
| [OpenAI developer quickstart](https://platform.openai.com/docs/quickstart) | Model calls, streaming, files, tools | [07 — support copilot](./projects/07-support-copilot/) |
| [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) | Schema-constrained output with application validation | [07 — support copilot](./projects/07-support-copilot/) |
| [OpenAI evals](https://platform.openai.com/docs/guides/evals) | Datasets, graders, and regression runs | [07 — support copilot](./projects/07-support-copilot/) |
| [Anthropic tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) | Tool schemas, calls, results, errors | [07](./projects/07-support-copilot/) and [08](./projects/08-production-operator/) |
| [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) | Choose workflows before adding autonomy | [07](./projects/07-support-copilot/) and [08](./projects/08-production-operator/) |
| [MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture) | Hosts, clients, servers, tools, resources, transport | [08 — production operator](./projects/08-production-operator/) |
| [MCP security](https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices) | Authorization, token handling, confused-deputy risks | [08 — production operator](./projects/08-production-operator/) |
| [OWASP GenAI Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) | Prompt injection, data leakage, excessive agency, resource consumption | [07](./projects/07-support-copilot/) and [08](./projects/08-production-operator/) |

## 7. AI-assisted software development

| Resource | Use it for | Apply it to |
|---|---|---|
| [OpenAI Codex](https://developers.openai.com/codex/) | Repository-aware coding-agent workflows | Any project |
| [Claude Code workflows](https://docs.anthropic.com/en/docs/claude-code/common-workflows) | Inspection, planning, tests, debugging existing code | Any project |
| [GitHub Copilot coding agent](https://docs.github.com/en/copilot/using-github-copilot/coding-agent) | Issue-to-pull-request workflow and repository controls | Any project |
| [Google code review guide](https://google.github.io/eng-practices/review/) | Review the change instead of trusting the author or agent | Any project |
| [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/) | Security review baseline for generated code | Any project |

Use the repository's [`AI-assisted development playbook`](./playbook/ai-assisted-development.md) to turn these tools into a repeatable build-review-test loop.

## 8. Larger repositories to study

| Repository | What to inspect |
|---|---|
| [The Odin Project curriculum](https://github.com/TheOdinProject/curriculum) | How foundations, lessons, projects, and references are connected |
| [Full Stack Open](https://github.com/fullstack-hy2020/fullstack-hy2020.github.io) | How one modern web stack progresses into testing, containers, GraphQL, and CI |
| [RealWorld](https://github.com/realworld-apps/realworld) | How many stacks implement the same product contract |
| [Build Your Own X](https://github.com/codecrafters-io/build-your-own-x) | How to learn systems by recreating them |
| [System Design Primer](https://github.com/donnemartin/system-design-primer) | How distributed-system concepts are indexed and cross-linked |
| [LLMs from Scratch](https://github.com/rasbt/LLMs-from-scratch) | How explanations stay close to executable code |
| [Generative AI for Beginners](https://github.com/microsoft/generative-ai-for-beginners) | Introductory generative-AI application patterns |
| [AI Agents for Beginners](https://github.com/microsoft/ai-agents-for-beginners) | Agent design patterns and runnable examples |
| [Anthropic courses](https://github.com/anthropics/courses) | Provider-authored API, prompting, evaluation, and tool-use exercises |
