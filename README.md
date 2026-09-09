<p align="center">
  <img src="assets/project-ladder.svg" alt="Eight projects from browser fundamentals to a production AI operator" width="100%" />
</p>

# Production Full-Stack Engineering with AI

Build one support product eight times. Start with the page, then own its React interface, API, PostgreSQL data, authentication, realtime behavior, background jobs, deployment, AI features, evals, and coding-agent workflow.

Every stage has runnable starter code, tests that expose the missing behavior, a finished-product contract, and a short list of sources worth opening while you work.

## Start here

```bash
git clone https://github.com/yerdaulet-damir/fullstack-engineering.git
cd fullstack-engineering
corepack enable
pnpm install
pnpm doctor
cp .progress.example.json .progress.json
pnpm next
```

You need Node.js 22+, pnpm 10+, Git, and Docker for the database projects. An AI API key is only needed in projects 7 and 8; both include a deterministic fake provider so you can work without credits.

## The project ladder

| # | Product | You ship | Main skills | Proof |
|---|---|---|---|---|
| 01 | Launch page | Responsive product page from a visual brief | Semantic HTML, CSS, browser JavaScript, accessibility, performance | Lighthouse report and deployed URL |
| 02 | Data dashboard | Typed React dashboard consuming an unreliable API | React, TypeScript, forms, caching, loading and error states | Component tests and recorded failure states |
| 03 | Issue API | PostgreSQL-backed REST API | HTTP, validation, SQL, migrations, transactions, indexes, integration tests | OpenAPI contract and passing API tests |
| 04 | Issue tracker | Full-stack application with accounts and uploads | Next.js, sessions, authorization, optimistic UI, object storage | Two-user authorization test and deployment |
| 05 | Live board | Multi-user board that survives reconnects | WebSockets, presence, ordering, idempotency, conflict handling | Two-browser demo and reconnect test |
| 06 | Team SaaS | Multi-tenant product with jobs and audit history | Tenancy, RBAC, queues, email, rate limits, observability | Tenant-isolation suite and traced background job |
| 07 | Support copilot | AI assistant grounded in product documentation | Streaming, structured output, retrieval, tools, evals, cost control | Eval report, prompt-injection tests, latency budget |
| 08 | Production operator | AI workflow that proposes actions and asks before writing | Durable workflows, approval, MCP/tool boundaries, deployment, incident handling | Staging runbook, rollback drill, public capstone |

Open [`ROADMAP.md`](./ROADMAP.md) for exact deliverables. Run `pnpm next` at any time to see the next unfinished project.

## Why this stack

- TypeScript became GitHub's most-used language in 2025; it covers the browser, server, tests, tooling, and most AI SDKs in one typed codebase.
- PostgreSQL keeps SQL, transactions, indexes, and tenant boundaries visible instead of hiding them behind a hosted dashboard.
- Docker had the largest year-over-year usage increase in the 2025 Stack Overflow survey; projects 03–08 use it where local infrastructure matters.
- AI-assisted coding is included because 84% of surveyed developers use or plan to use AI tools, while 66% report output that is almost right. The exercises focus on review, tests, debugging, and rollback.

Sources: [GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/), [Stack Overflow 2025 technology](https://survey.stackoverflow.co/2025/technology), and [Stack Overflow 2025 AI](https://survey.stackoverflow.co/2025/ai).

## How each project works

Every folder under `projects/` keeps the task beside the runnable code. Small browser projects run from the project root; later systems keep the application under `starter/`.

```text
projects/03-issue-api/
├── README.md          # route through the project
├── brief.md           # user, problem, constraints
├── acceptance.md      # observable definition of done
├── exercises.md       # deliberate break/fix and extension tasks
├── starter/           # runnable application, not pseudocode
└── tests/             # black-box checks for the finished product
```

The loop is simple:

1. Run the starter and use it before changing code.
2. Read the brief and write your own implementation plan.
3. Build one vertical slice at a time.
4. Run the project checks and manually test the failure cases.
5. Deploy it and save the proof in `.progress.json`.
6. Write five lines: what broke, what you measured, and what you would change.

## Use AI without giving up engineering

Use Codex, Claude Code, Copilot, Cursor, or another coding agent. The repository does not grade prompts. It grades the software.

For every AI-assisted change:

- Start from a written task with inputs, outputs, constraints, and forbidden changes.
- Ask the agent to inspect existing code before proposing edits.
- Keep the diff small enough to review.
- Require tests for changed behavior.
- Run the software yourself and inspect logs, network calls, migrations, and generated SQL.
- Record assumptions that the agent made incorrectly.
- Never let an agent run destructive production commands or approve its own write actions.

The full loop is in [`playbook/ai-assisted-development.md`](./playbook/ai-assisted-development.md).

## Choose your route

- **New to full-stack:** complete 01 → 08 in order.
- **Frontend developer:** start at 02, then do 03, 04, 06, 07, 08.
- **Backend developer:** start at 03, but complete 02 before 04.
- **Already shipping SaaS:** run the project 04 checks. If they feel routine, start at 06.
- **Here for AI engineering:** do 03, 06, 07, and 08. Production AI still depends on APIs, data, authorization, and operations.

## What this repository deliberately avoids

- Ten disconnected toy apps with no operational depth.
- Framework tours that stop after CRUD.
- Prompt collections presented as AI engineering.
- Copy-paste authentication, billing, or agent code nobody can explain.
- “Vibe coding” where generated code is accepted without tests, review, or runtime evidence.
- Certificates, lectures, grades, and instructor language.

## References

The links are selected for the point where they become useful, not dumped into one giant list:

- [`references/web-and-frontend.md`](./references/web-and-frontend.md)
- [`references/backend-and-data.md`](./references/backend-and-data.md)
- [`references/realtime-and-systems.md`](./references/realtime-and-systems.md)
- [`references/delivery-and-operations.md`](./references/delivery-and-operations.md)
- [`references/ai-product-engineering.md`](./references/ai-product-engineering.md)
- [`references/ai-assisted-development.md`](./references/ai-assisted-development.md)

TypeScript is the default path. Project 03 includes equivalent [Spring Boot and FastAPI routes](./projects/03-issue-api/alternative-backends.md) with the same API contract and tests, so backend developers can use Java or Python without splitting the product into three unrelated courses.

## Completion

You are done when all eight products have working URLs, automated checks, screenshots or short demos, and a short engineering note. Stars, badges, and hours watched do not count.

## Contributing

Fix dead links, improve a failing starter, add a better test, or propose a project that exercises a missing production skill. Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a pull request.

## License

MIT
