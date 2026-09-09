# Support copilot

A deterministic support assistant that answers only from a versioned local documentation corpus. It demonstrates retrieval, an explicit model boundary, streaming events, prompt-injection resistance, and fixture-based evaluation without an API key.

## Run

```bash
cd starter
pnpm install
pnpm dev -- "How do I reset my password?"
pnpm check:starter
```

The CLI writes newline-delimited events, so a UI can render retrieval progress and response deltas without changing the core.

## Evidence

- Corpus: `starter/corpus/v1/documents.json`
- Eval cases: `starter/evals/fixtures.json`
- Boundaries: `starter/src/contracts.ts`
- Pipeline: `starter/src/copilot.ts`

Read `brief.md`, then use `acceptance.md` and `exercises.md`.

## Open while building

- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) for schema-constrained model responses.
- [OpenAI evals](https://platform.openai.com/docs/guides/evals) for datasets, graders, and regression runs.
- [Anthropic tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) for another provider's tool contract.
- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) before adding autonomy.
- [OWASP GenAI Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) for prompt injection and data-leakage checks.

After the eval and injection suites pass, continue to [08 — production AI operator](../08-production-operator/).
