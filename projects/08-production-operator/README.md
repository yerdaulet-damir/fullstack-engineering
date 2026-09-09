# 08 — Production Operator

The copilot becomes a durable workflow. It may investigate and propose a change, but it cannot execute a write until a person approves the exact action.

```bash
cd starter
pnpm install
pnpm check:starter
pnpm dev
```

The starter stores plain JSON so restart behavior is visible. Replace it with durable storage only after the state-machine and idempotency tests remain green.
