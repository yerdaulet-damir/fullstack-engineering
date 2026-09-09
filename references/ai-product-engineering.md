# AI product engineering references

The project uses provider interfaces. The product contract, eval set, and tool boundaries should survive a model change.

## Model interfaces and streaming — project 07

- [OpenAI developer quickstart](https://platform.openai.com/docs/quickstart) — current Responses API, streaming, image/file input, and tools.
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) — constrain model output to a JSON Schema and still validate it in your application.
- [Anthropic tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) — tool schemas, calls, results, and error handling from another provider.
- [Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html) — browser transport used by many streaming AI interfaces.

## Retrieval and evaluation — project 07

- [OpenAI evals guide](https://platform.openai.com/docs/guides/evals) — datasets, graders, and regression runs.
- [Anthropic evaluation tool](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests) — build and compare test cases rather than judging demos by feel.
- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — start with simple workflows; add autonomy only when the task needs it.

## Tools, MCP, and safety — project 08

- [Model Context Protocol architecture](https://modelcontextprotocol.io/docs/learn/architecture) — hosts, clients, servers, tools, resources, and transport.
- [MCP security best practices](https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices) — authorization, confused-deputy risks, token handling, and local server controls.
- [OWASP GenAI LLM Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) — current prompt injection, data leakage, excessive agency, and resource-consumption risks.
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) — broader governance and risk framing when a product affects consequential decisions.
