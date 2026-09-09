# 04 — Full-stack issue tracker

Connect a browser interface to the issue API and make account boundaries observable.

```bash
pnpm install
pnpm --filter @modern-fullstack/issue-tracker dev
pnpm --filter @modern-fullstack/issue-tracker check:starter
```

Open `http://localhost:3004`, sign in as `alice@example.test` or `bob@example.test`, and create an issue. The starter uses server-side sessions and in-memory data so authorization tests stay deterministic.
