<p align="center">
  <img src="assets/project-ladder.svg" alt="Full-stack engineering roadmap with eight projects from HTML and CSS to production AI agents" width="100%" />
</p>

# Full-Stack Engineering Roadmap — From HTML to Production AI

Build the same support product in eight increasingly serious versions. You begin with HTML and CSS, then add TypeScript, React, an API, PostgreSQL, Next.js, authentication, realtime updates, multi-tenancy, RAG, evals, AI tools, and human approval.

This README tells you where to start. [`RESOURCES.md`](./RESOURCES.md) keeps the full list of documentation and repositories.

## Pick your starting point

You do not need to read everything first. Open one useful source, then build the linked project.

| If you want to learn | Open first | Build next |
|---|---|---|
| HTML, CSS, browser JavaScript | [MDN Learn Web Development](https://developer.mozilla.org/en-US/docs/Learn_web_development) · [web.dev Learn CSS](https://web.dev/learn/css/) | [01 — responsive launch page](./projects/01-launch-page/) |
| JavaScript and TypeScript | [JavaScript.info](https://javascript.info/) · [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) | [02 — React data dashboard](./projects/02-data-dashboard/) |
| React frontend development | [Thinking in React](https://react.dev/learn/thinking-in-react) · [Testing Library](https://testing-library.com/docs/guiding-principles/) | [02 — React data dashboard](./projects/02-data-dashboard/) |
| Backend development with Node.js | [MDN HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview) · [Fastify](https://fastify.dev/docs/latest/) · [OpenAPI](https://spec.openapis.org/oas/latest.html) | [03 — PostgreSQL issue API](./projects/03-issue-api/) |
| Backend development with Python | [FastAPI tutorial](https://fastapi.tiangolo.com/tutorial/) · [Pydantic](https://docs.pydantic.dev/latest/) | [03 — use the FastAPI route](./projects/03-issue-api/alternative-backends.md#python-and-fastapi) |
| Backend development with Java | [Spring Boot](https://docs.spring.io/spring-boot/index.html) · [Spring guides](https://spring.io/guides) | [03 — use the Spring Boot route](./projects/03-issue-api/alternative-backends.md#java-and-spring-boot) |
| SQL and PostgreSQL | [PostgreSQL tutorial](https://www.postgresql.org/docs/current/tutorial.html) · [Use EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html) | [03 — PostgreSQL issue API](./projects/03-issue-api/) |
| Next.js full-stack development | [Next.js App Router](https://nextjs.org/docs/app) · [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) | [04 — authenticated issue tracker](./projects/04-issue-tracker/) |
| Realtime and system design | [MDN WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) · [Redis Streams](https://redis.io/docs/latest/develop/data-types/streams/) | [05 — live board](./projects/05-live-board/) |
| SaaS backend and DevOps | [Docker Get Started](https://docs.docker.com/get-started/) · [OpenTelemetry](https://opentelemetry.io/docs/what-is-opentelemetry/) | [06 — multi-tenant team SaaS](./projects/06-team-saas/) |
| AI engineering, RAG and evals | [OpenAI evals](https://platform.openai.com/docs/guides/evals) · [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) | [07 — support copilot](./projects/07-support-copilot/) |
| AI agents, tools and MCP | [MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture) · [OWASP GenAI Top 10](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) | [08 — production operator](./projects/08-production-operator/) |
| Vibe coding with verification | [Codex docs](https://developers.openai.com/codex/) · [Claude Code workflows](https://docs.anthropic.com/en/docs/claude-code/common-workflows) · [Google code review guide](https://google.github.io/eng-practices/review/) | [Use the AI playbook on any project](./playbook/ai-assisted-development.md) |

## Build the product

Each folder has runnable code, a product brief, acceptance checks, exercises, and tests. Click a project title to see its exact commands and references.

| # | Project | What you build | Main engineering work |
|---|---|---|---|
| 01 | [Responsive launch page](./projects/01-launch-page/) | A fast, accessible product page from a visual brief | Semantic HTML, CSS layout, browser JavaScript, accessibility, performance |
| 02 | [React data dashboard](./projects/02-data-dashboard/) | A typed dashboard that survives an unreliable API | React, TypeScript, forms, runtime validation, loading and error states, tests |
| 03 | [PostgreSQL issue API](./projects/03-issue-api/) | A documented REST API with real data constraints | HTTP, Fastify, SQL, migrations, transactions, indexes, integration tests |
| 04 | [Authenticated issue tracker](./projects/04-issue-tracker/) | A Next.js product with accounts and uploads | Server/client boundaries, sessions, authorization, optimistic UI, storage |
| 05 | [Realtime live board](./projects/05-live-board/) | A multi-user board that survives reconnects | WebSockets, ordering, idempotency, presence, conflict handling |
| 06 | [Multi-tenant team SaaS](./projects/06-team-saas/) | One deployment serving isolated organizations | Tenancy, RBAC, queues, webhooks, rate limits, audit logs, observability |
| 07 | [Support copilot](./projects/07-support-copilot/) | An assistant grounded in versioned product documentation | Streaming, structured output, retrieval, tools, evals, injection tests, cost |
| 08 | [Production AI operator](./projects/08-production-operator/) | A durable agent that asks before changing data | State machines, approval, tool boundaries, MCP, retries, deployment, rollback |

Start at project 01 if the browser is new to you. Start at 03 if you already ship React apps. Start at 07 only if APIs, SQL, authentication, and background jobs are familiar.

## Run it

```bash
git clone https://github.com/yerdaulet-damir/fullstack-engineering.git
cd fullstack-engineering
corepack enable
pnpm install
pnpm doctor
cp .progress.example.json .progress.json
pnpm next
```

Requirements: Node.js 22+, pnpm 10+, Git, and Docker for database projects. Projects 07 and 08 include deterministic fake model providers, so an AI API key is optional.

Your first useful move:

```bash
cd projects/01-launch-page
npm start
```

Open `http://localhost:3001`, use the page, then read [`brief.md`](./projects/01-launch-page/brief.md). Run `npm test` before and after your change.

## Repositories worth opening

These are references, not content copied into this repository.

| Repository | Use it for |
|---|---|
| [The Odin Project curriculum](https://github.com/TheOdinProject/curriculum) | Detailed HTML, CSS, JavaScript, Node.js, database, and React foundations with projects between lessons |
| [Full Stack Open](https://github.com/fullstack-hy2020/fullstack-hy2020.github.io) | Modern React, APIs, testing, containers, GraphQL, React Native, and CI/CD material |
| [RealWorld](https://github.com/realworld-apps/realworld) | Compare different frontend and backend implementations against one product and API contract |
| [Build Your Own X](https://github.com/codecrafters-io/build-your-own-x) | Rebuild databases, shells, Git, containers, networking tools, and other systems from first principles |
| [System Design Primer](https://github.com/donnemartin/system-design-primer) | Review scalability, caching, queues, databases, and system-design tradeoffs |
| [LLMs from Scratch](https://github.com/rasbt/LLMs-from-scratch) | Understand transformer and LLM internals through executable Python and PyTorch code |
| [Generative AI for Beginners](https://github.com/microsoft/generative-ai-for-beginners) | Build basic generative-AI applications before adding production evaluation and safety |
| [AI Agents for Beginners](https://github.com/microsoft/ai-agents-for-beginners) | Compare agent patterns, tool use, planning, memory, and multi-agent workflows |
| [Anthropic courses](https://github.com/anthropics/courses) | Work through API, prompting, evaluation, and tool-use examples from a model provider |

## Search demand checked

The wording and stack were checked against worldwide Google Trends comparisons for **9 September 2025–9 September 2026** and current ecosystem reports. Google Trends values are relative within each comparison, not absolute keyword volume.

- [Role comparison](https://trends.google.com/trends/explore?date=2025-09-09%202026-09-09&q=full%20stack%20development,backend%20development,frontend%20development,AI%20engineering,vibe%20coding): `AI engineering` had the strongest relative interest among those exact phrases. The README still starts with full-stack because the projects teach the web, data, and operations work that production AI depends on.
- [Stack comparison](https://trends.google.com/trends/explore?date=2025-09-09%202026-09-09&q=TypeScript,Python,Next.js,FastAPI,Spring%20Boot): Python was much broader than the framework terms. TypeScript remains the default implementation; Python and Spring Boot are explicit backend routes instead of hidden keywords.
- [AI coding comparison](https://trends.google.com/trends/explore?date=2025-09-09%202026-09-09&q=Claude%20Code,Cursor,Codex,AI%20coding%20agent,vibe%20coding): product names carried more relative interest than the generic phrases. The repository stays tool-neutral and links to current tool workflows.
- [AI product comparison](https://trends.google.com/trends/explore?date=2025-09-09%202026-09-09&q=AI%20agents,RAG,MCP,LLM%20evaluation,AI%20engineering): `MCP` is an ambiguous acronym, so it is used only where the Model Context Protocol is actually taught.
- [GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/) reported TypeScript as GitHub's most-used language and strong Python growth. [Stack Overflow's 2025 survey](https://survey.stackoverflow.co/2025/technology) showed substantial Docker growth; its [AI section](https://survey.stackoverflow.co/2025/ai) also explains why these projects emphasize tests and review around generated code.

This is a dated editorial check, not a promise that search demand will stay fixed. Query links are included so anyone can rerun the comparison.

## How a project works

```text
projects/03-issue-api/
├── README.md          # run commands, sources, and next project
├── brief.md           # user, problem, constraints
├── acceptance.md      # observable definition of done
├── exercises.md       # break/fix and extension work
├── starter/           # runnable application
└── tests/             # black-box checks
```

Use this loop:

1. Run the starter and use it before changing code.
2. Read the brief and acceptance checks.
3. Build one vertical slice.
4. Run the checks and reproduce failure cases yourself.
5. Deploy it and save the URL or screenshot in `.progress.json`.
6. Write what broke, what you measured, and what you would change.

[`ROADMAP.md`](./ROADMAP.md) contains every deliverable. `pnpm next` finds the next unfinished project. [`RESOURCES.md`](./RESOURCES.md) is the complete learning index.

## Using coding agents

Use Codex, Claude Code, Copilot, Cursor, or another coding agent. Give it the brief and acceptance checks, ask it to inspect the existing code, and review the resulting diff. The repository checks behavior, not prompts.

Never let an agent approve its own production write, hide a migration, or replace runtime evidence with a confident explanation. The working loop is in [`playbook/ai-assisted-development.md`](./playbook/ai-assisted-development.md).

## Contributing

Fix a dead link, improve a starter, add a missing test, or propose a production skill that the eight projects do not cover. Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a pull request.

MIT licensed.
