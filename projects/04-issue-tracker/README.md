# 04 — Full-stack issue tracker

Connect a browser interface to the issue API and make account boundaries observable.

```bash
pnpm install
pnpm --filter @modern-fullstack/issue-tracker dev
pnpm --filter @modern-fullstack/issue-tracker check:starter
```

Open `http://localhost:3004`, sign in as `alice@example.test` or `bob@example.test`, and create an issue. The starter uses server-side sessions and in-memory data so authorization tests stay deterministic.

## Open while building

- Use the [Next.js product frontend route](../../learn/web-frontend/#level-3--nextjs-product-frontend) with the [authentication and authorization chapters](../../learn/backend-data/#4-authentication).
- [Next.js App Router](https://nextjs.org/docs/app) for routing, data access, metadata, and server/client boundaries.
- [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) for deny-by-default access rules.
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) for cookies, expiry, and invalidation.
- [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) before accepting files.

Read [`brief.md`](./brief.md), prove two-user isolation with [`acceptance.md`](./acceptance.md), then continue to [05 — realtime live board](../05-live-board/).
