# Brief

Build **Boundary**, a small private issue tracker for two accounts. The learner should be able to see which work belongs in a browser, which work belongs on a server, and why a hidden button cannot protect private data.

## Product scenario

Alice and Bob work in the same application but own different private projects. After choosing a demo account, a user can see their project, review its issues, and create an issue. They cannot discover or mutate the other account’s project by changing a URL or request body.

The starter uses deterministic seeded records and process-local memory. It is a teaching environment, not a deployment architecture. Restarting the process resets projects and issues.

## Required user journey

1. A signed-out visitor sees the two demo accounts and a clear explanation of the privacy model.
2. Signing in creates an opaque session ID stored in an HTTP-only, same-site cookie.
3. The server resolves that session and returns only the user’s project summary.
4. Selecting a project requests its current issues through an authenticated route handler.
5. Submitting a valid title creates an issue and updates the visible list and count.
6. Invalid input or a failed request produces a specific message without removing the user’s work unexpectedly.
7. Signing out invalidates the server-side session and removes private UI state.

## Server responsibilities

- Recognize only the supplied local demo accounts.
- Create, resolve, expire, and invalidate opaque session IDs.
- Parse request bodies as untrusted values.
- Validate issue title and description constraints.
- Resolve private projects using the authenticated owner and requested project ID together.
- Return the same `404 PROJECT_NOT_FOUND` response for missing and cross-account projects.
- Create issue IDs and timestamps on the server.
- Return attachment constraints only after the same ownership check.

## Client responsibilities

- Submit sign-in, sign-out, project, and issue requests.
- Render signed-out, pending, error, empty, populated, and success states.
- Keep controls labelled and keyboard-operable.
- Announce request outcomes through status or alert regions.
- Disable duplicate submissions while a request is pending.
- Update local issue state only after the server accepts the write.

The client may choose which controls to display. It may not decide whether an account owns a project, manufacture session identity, or send an `ownerId` that the server trusts.

## Constraints

- Use the Next.js App Router and strict TypeScript.
- Keep server-only session and ownership logic outside the Client Component.
- Keep fixtures local and deterministic; do not require a database, OAuth provider, object store, or network service.
- Preserve the two-account fixture because the isolation test depends on it.
- Keep the starter runnable with one install and one development command.
- Do not claim production readiness while data and sessions live in process memory.

## Out of scope for the starter

- Password storage, account registration, password recovery, and third-party identity providers.
- Durable database persistence and multi-process session storage.
- Real file upload transport or malware scanning.
- Email notifications, comments, labels, assignment, and issue closing.
- Complete CSRF protection and production deployment configuration.

These are valid extensions after the ownership invariant and browser journey are covered by tests.
