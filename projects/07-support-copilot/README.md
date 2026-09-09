# 07 — Support Copilot Lab

A browser-based support assistant that answers only from a versioned documentation corpus. The UI exposes retrieval evidence, streams response events, shows citations, and makes refusal behavior visible. It runs locally without an API key.

## Run

```bash
cd starter
pnpm install
pnpm dev
pnpm check:starter
```

Open `http://localhost:3007`. Try the password, invoice-access, and prompt-injection examples. Use `pnpm dev:cli -- "How do I reset my password?"` for the terminal client.

The HTTP route streams newline-delimited events. The browser renders retrieval progress and answer deltas without giving the model filesystem or tool access.

Each corpus record separates untrusted retrieval text from a human-approved answer. The deterministic model can rank the untrusted text but may emit only the approved answer and a versioned citation. This is a testable local boundary, not a claim that a regex makes arbitrary RAG content safe.

## Evidence

- Corpus: `starter/corpus/v1/documents.json`
- Eval cases: `starter/evals/fixtures.json`
- Boundaries: `starter/src/contracts.ts`
- Pipeline: `starter/src/copilot.ts`
- Streaming API: `starter/src/server.ts`
- Browser client: `starter/public/`

Read `brief.md`, then use `acceptance.md` and `exercises.md`.

## Open while building

- Start with the [applied AI engineering playbook](../../learn/ai-engineering/) for streaming, structured output, RAG, evals, and injection boundaries.
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) for schema-constrained model responses.
- [OpenAI evals](https://platform.openai.com/docs/guides/evals) for datasets, graders, and regression runs.
- [Anthropic tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) for another provider's tool contract.
- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) before adding autonomy.
- [OWASP GenAI Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) for prompt injection and data-leakage checks.

After the eval and injection suites pass, continue to [08 — production AI operator](../08-production-operator/).
