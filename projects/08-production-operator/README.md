# 08 — Production Operator

The copilot becomes a durable workflow. It may investigate and propose a change, but it cannot execute a write until a person approves the exact action.

```bash
cd starter
pnpm install
pnpm check:starter
pnpm dev
```

The starter stores plain JSON so restart behavior is visible. Replace it with durable storage only after the state-machine and idempotency tests remain green.

## Open while building

- [MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture) for hosts, clients, servers, tools, resources, and transport.
- [MCP security](https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices) for authorization and token boundaries.
- [OWASP GenAI Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) for excessive agency and resource-consumption risks.
- [Google SRE: Handling Overload](https://sre.google/sre-book/handling-overload/) for backpressure and graceful degradation.

Read [`brief.md`](./brief.md), reproduce every approval and restart check in [`acceptance.md`](./acceptance.md), then deploy the capstone and record the evidence in the root `.progress.json`.
