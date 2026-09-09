# Acceptance

- `pnpm --filter @modern-fullstack/issue-tracker check:starter` passes.
- Signing in creates an opaque, HTTP-only, same-site session cookie.
- Every project read and write resolves through the authenticated owner.
- The included cross-user fixture returns `404` for both read and write attempts.
- The browser can sign in, list projects, and create an issue without client-held secrets.
- Attachment preparation returns an expiring object URL, accepted content type, and maximum size.
- Add production persistence, CSRF protection, session expiry, uploads, metadata, and end-to-end browser coverage before deployment.
