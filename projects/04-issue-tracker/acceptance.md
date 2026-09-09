# Acceptance

## Automated contract

- `pnpm check:starter` passes from `starter/`.
- Strict TypeScript reports no errors.
- The Next.js production build completes.
- Tests prove that a valid session resolves to one account and only its project list.
- Tests prove that missing and cross-user project reads both return `404 PROJECT_NOT_FOUND`.
- Tests prove that a cross-user issue write returns the same `404` and does not create an issue.
- Tests prove that an owner can create a validated issue in their project.
- Tests inspect the sign-in response for an HTTP-only, same-site session cookie.
- Tests advance an injected clock to prove an expired session is rejected and removed.
- Tests prove sign-out clears the cookie and invalidates the matching server-side session.
- UI structure tests prove that signed-out and signed-in forms have programmatic labels and named headings.

## Browser contract

- `pnpm dev` serves a styled browser application at `http://localhost:3004`.
- The initial page explains the server/client split and offers Alice and Bob as demo accounts.
- Signing in as Alice shows only `Tempo launch`; signing in as Bob shows only `Pulse operations`.
- Reloading while signed in restores the account and first project from the server-rendered page.
- Creating a valid issue adds it to the visible list, increments the open count, clears the form, announces success, and moves focus to the project heading.
- A title shorter than three characters is rejected before or by the server with a useful message.
- Sign-out returns to the account chooser and removes private project state.
- Pending requests disable the relevant controls and expose a status message.
- The layout remains usable at 320 CSS pixels without horizontal page scrolling.
- The complete sign-in and issue-creation journey is operable with a keyboard and has visible focus.

## Security boundary

- The cookie contains an opaque session identifier, not a user ID, email address, or serialized user object.
- Client JavaScript cannot read the session cookie.
- The server-side session expires at the same one-hour boundary as the cookie.
- Requests without a valid server-side session receive `401 AUTHENTICATION_REQUIRED`.
- Project ownership is checked for list, detail, issue creation, and attachment preparation operations.
- The server ignores any client attempt to declare an owner.
- Missing and unauthorized private projects have the same status code, error code, and message.
- Attachment preparation accepts only PNG, JPEG, and PDF and returns a maximum size and expiry time without storage credentials.

## Honest deployment boundary

Do not deploy the starter unchanged. A production version still needs durable data, shared session storage, credential-based authentication, CSRF protection, session rotation and expiry policy, rate limiting, audit logging, real upload storage and scanning, secure configuration, canonical metadata, social preview, sitemap, robots policy, and end-to-end browser coverage.
