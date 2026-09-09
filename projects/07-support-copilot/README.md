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
