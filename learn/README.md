# Learning Playbooks

These playbooks explain the engineering decisions before sending you to documentation. Each route combines original notes, books, courses, videos, maintained repositories, a runnable project, and a proof checklist.

Pick the system you want to understand. Do not complete every resource first. Read enough to make the next implementation decision, build the linked project, then use its acceptance checks to find what you missed.

| Goal | Start here | Build while learning |
| --- | --- | --- |
| Browser fundamentals, TypeScript, React, Next.js, accessibility, frontend testing | [Web frontend engineering](./web-frontend/) | Projects [01](../projects/01-launch-page/), [02](../projects/02-data-dashboard/), and [04](../projects/04-issue-tracker/) |
| HTTP, API design, PostgreSQL, Fastify, FastAPI, Spring Boot, auth, multi-tenancy | [Backend and data engineering](./backend-data/) | Projects [03](../projects/03-issue-api/), [04](../projects/04-issue-tracker/), and [06](../projects/06-team-saas/) |
| WebSockets, Redis, queues, idempotency, Docker, CI, observability, SRE | [Systems and DevOps](./systems-devops/) | Projects [05](../projects/05-live-board/), [06](../projects/06-team-saas/), and [08](../projects/08-production-operator/) |
| LLM APIs, streaming, structured output, RAG, evals, agents, MCP, model internals | [Applied AI engineering](./ai-engineering/) | Projects [07](../projects/07-support-copilot/) and [08](../projects/08-production-operator/) |

## A practical sequence

1. Open the playbook section tied to your current project.
2. Read its mechanism explanation before opening external links.
3. Choose one primary course or book and keep the rest as references.
4. Run the starter before editing it.
5. Build one observable behavior from the brief.
6. Prove it with tests, browser evidence, measurements, or failure reproduction.
7. Write down the tradeoff you made before moving to the next project.

## What counts as learning

A finished video or documentation page is not evidence. A project is complete when its acceptance criteria pass and you can explain the failure mode each check prevents. The playbooks name those checks so the repository remains useful without depending on a particular instructor, framework release, or coding agent.

**Resources last verified:** 2026-09-09
