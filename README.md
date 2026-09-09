<p align="center">
  <img src="assets/fullstack-engineering-poster.png" alt="Build the whole thing: a climber crossing a mountain ridge above the clouds" width="100%" />
</p>

# Full-Stack Engineering — From HTML to Production AI

Build the same support product as eight runnable software projects. You begin with HTML and CSS, then add TypeScript, React, an API, PostgreSQL, Next.js, authentication, realtime updates, multi-tenancy, RAG, evals, AI tools, and human approval.

This README is the map. The [learning playbooks](./learn/) contain the explanations, books, courses, videos, repositories, build milestones, and proof checks.

## Learning playbooks

| Playbook | What it teaches | Projects |
| --- | --- | --- |
| [Web frontend engineering](./learn/web-frontend/) | Browser fundamentals, TypeScript, React, Next.js, accessibility, testing, performance | 01, 02, 04 |
| [Backend and data engineering](./learn/backend-data/) | HTTP, API design, PostgreSQL, Fastify, FastAPI, Spring Boot, auth, multi-tenancy | 03, 04, 06 |
| [Systems and DevOps](./learn/systems-devops/) | WebSockets, Redis, queues, idempotency, Docker, CI, observability, SRE | 05, 06, 08 |
| [Applied AI engineering](./learn/ai-engineering/) | LLM APIs, structured output, RAG, evals, agents, MCP, model internals | 07, 08 |

Each playbook follows **Read → Watch → Build → Prove**. The repository explains the mechanism first; external documentation is supporting material rather than the curriculum.

## Pick your starting point

You do not need to read everything first. Open one useful source, then build the linked project.

| If you want to learn | Open first | Build next |
|---|---|---|
| HTML, CSS, browser JavaScript | [Web foundations](./learn/web-frontend/#level-1--web-foundations) | [01 — responsive launch page](./projects/01-launch-page/) |
| JavaScript, TypeScript and React | [Typed React interfaces](./learn/web-frontend/#level-2--typed-react-interfaces) | [02 — React data dashboard](./projects/02-data-dashboard/) |
| Node.js, Python or Java backend | [Server implementation routes](./learn/backend-data/#3-server-implementation-routes) | [03 — PostgreSQL issue API](./projects/03-issue-api/) |
| SQL and PostgreSQL | [SQL and PostgreSQL](./learn/backend-data/#2-sql-and-postgresql) | [03 — PostgreSQL issue API](./projects/03-issue-api/) |
| Next.js, sessions and authorization | [Full-stack frontend](./learn/web-frontend/#level-3--nextjs-product-frontend) · [authorization](./learn/backend-data/#5-authorization) | [04 — authenticated issue tracker](./projects/04-issue-tracker/) |
| Realtime and system design | [Realtime foundations](./learn/systems-devops/#level-1--realtime-foundations) | [05 — live board](./projects/05-live-board/) |
| SaaS backend and DevOps | [Reliable services](./learn/systems-devops/#level-2--reliable-service) · [multi-tenancy](./learn/backend-data/#7-multi-tenancy) | [06 — multi-tenant team SaaS](./projects/06-team-saas/) |
| AI engineering, RAG and evals | [Applied AI engineering](./learn/ai-engineering/) | [07 — support copilot](./projects/07-support-copilot/) |
| AI agents, tools and MCP | [Tools, MCP and durable workflows](./learn/ai-engineering/#level-3--tools-and-bounded-agents) | [08 — production operator](./projects/08-production-operator/) |
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
