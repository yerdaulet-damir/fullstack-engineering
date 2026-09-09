# Exercises

1. Add a `v2` corpus, keep `v1` runnable, and report answer changes across the eval set.
2. Add hybrid retrieval while preserving the `RetrievalTool` interface.
3. Replace the fake model with a local model and validate its structured output before emitting events.
4. Add an eval for conflicting documents and define a deterministic precedence rule.
5. Add cancellation with `AbortController` and stop work when the browser disconnects.
6. Add a second retrieval strategy and expose a side-by-side evaluation report rather than choosing it by intuition.
