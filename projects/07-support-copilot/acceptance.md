# Acceptance

Run `pnpm check:starter` inside `starter`.

- TypeScript passes with strict checking.
- Unit tests verify retrieval ranking, no-evidence refusal, citations, and ordered stream events.
- At least eight eval fixtures pass, including user and document prompt injection.
- Every supported answer cites a corpus document and version.
- The model receives retrieved evidence but cannot call tools.
- The starter runs without credentials or a provider SDK.
- `pnpm dev` serves an accessible browser interface on port `3007`.
- `POST /api/answer` validates the query and streams NDJSON events.
- The interface renders retrieved documents before the final answer and shows grounded/refused status.
- HTTP tests verify the page, health metadata, validation, and event order.
