# 04 — Full-stack issue tracker

Boundary is a runnable Next.js App Router starter for learning where frontend work meets server security. It renders a browser interface, creates issues through route handlers, stores sessions on the server, and filters every private project operation by the authenticated owner.

The local data is intentionally in memory. Alice and Bob each own one seeded project, so account isolation is visible without a database or external service.

## Run

Install the workspace from the repository root, then start this project:

```bash
pnpm install
pnpm --filter @modern-fullstack/issue-tracker dev
```

Open `http://localhost:3004`.

- `alice@example.test` owns `project-alice`.
- `bob@example.test` owns `project-bob`.

There are no passwords because authentication is not the exercise. Choosing an account creates an opaque server-side session. The cookie and matching server record expire after one hour; resolving an expired session removes its server record. Restarting the development server restores the seeded projects and issues.

## Check

```bash
pnpm --filter @modern-fullstack/issue-tracker check:starter
```

The check runs strict TypeScript, domain and route tests, UI structure tests, and a production Next.js build.

## Architecture

```text
starter/src/
├── app/
│   ├── api/                         Route handlers: HTTP boundary
│   │   ├── session/route.ts         Sign in and sign out
│   │   └── projects/                Authenticated reads and writes
│   ├── layout.tsx                   Metadata and document shell
│   ├── page.tsx                     Server Component session bootstrap
│   └── globals.css                  Responsive and focus-visible styles
├── components/
│   └── issue-tracker-client.tsx     Client interactions and UI states
└── lib/
    ├── domain.ts                    Shared serializable contracts
    ├── http.ts                      Request parsing and error mapping
    ├── store.ts                     Process-local store instance
    └── tracker-store.ts             Sessions, ownership, validation, data
```

`page.tsx` is a Server Component. It reads the HTTP-only session cookie, resolves the user on the server, and passes a serializable initial snapshot to the Client Component. The client owns form state, pending messages, focus movement, and subsequent requests. It never receives the session ID or an owner ID to trust.

Every project read and write calls the store with both `userId` and `projectId`. The ownership query returns the same `ProjectNotFoundError` for an absent project and another user’s project. Browser visibility is therefore a convenience, not an authorization control.

## HTTP surface

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/session` | Recognize a demo email, create a server-side session, set an HTTP-only cookie |
| `DELETE` | `/api/session` | Invalidate the server session and expire the cookie |
| `GET` | `/api/projects` | List only projects owned by the session user |
| `GET` | `/api/projects/:projectId` | Read one owned project and its issues |
| `POST` | `/api/projects/:projectId/issues` | Validate and create an issue in an owned project |
| `POST` | `/api/projects/:projectId/attachments/prepare` | Return local upload constraints after ownership validation |

The attachment route prepares metadata only. It does not accept bytes, expose storage credentials, or pretend the local object URL is production storage.

## UI states

The interface includes signed-out, loading, authenticated, validation error, request error, empty issue list, populated issue list, creation success, and sign-out states. Forms use visible labels, status changes use live regions, disabled controls expose pending work, and successful issue creation moves focus to the updated project heading.

## Learning sequence

1. Read [`brief.md`](./brief.md) to understand the product and security boundary.
2. Run the starter and inspect the server and client files listed above.
3. Complete selected work from [`exercises.md`](./exercises.md).
4. Use [`acceptance.md`](./acceptance.md) to prove behavior rather than infer it from the UI.
5. Continue to [05 — realtime live board](../05-live-board/) after the starter checks and two-user isolation checks pass.

## References

- Use the [Next.js product frontend route](../../learn/web-frontend/#level-3--nextjs-product-frontend) with the [authentication and authorization chapters](../../learn/backend-data/#4-authentication).
- [Next.js App Router](https://nextjs.org/docs/app) for Server Components, Client Components, route handlers, and request APIs.
- [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) for deny-by-default server-side access rules.
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) for cookie and session lifecycle decisions.
- [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) before implementing real upload storage.
- [WAI Forms Tutorial](https://www.w3.org/WAI/tutorials/forms/) for labels, instructions, validation, and feedback.
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) when adding browser-level coverage.
