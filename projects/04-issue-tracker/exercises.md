# Exercises

Complete the core exercises in order. The extensions are independent once the ownership tests remain green.

## 1. Trace the boundary

Before changing code, draw the sign-in and issue-creation request paths. Name the file that handles each step: browser event, route handler, session lookup, ownership lookup, validation, mutation, response, and UI update.

Prove the result by answering:

- Which modules may import the process-local store?
- Why does the Client Component receive user and project data but not the session ID?
- At which exact function does a cross-user request become indistinguishable from a missing project?

## 2. Complete issue validation

Add a visible remaining-character count for the description and preserve the entered values when the server rejects a request. Add tests for an empty title, a 121-character title, a 501-character description, and surrounding whitespace.

The browser constraints improve feedback. The server tests remain mandatory because an HTTP client can bypass HTML validation.

## 3. Add issue closing

Add `PATCH /api/projects/:projectId/issues/:issueId` and a keyboard-operable close action. The store must locate the issue through an owned project before changing it. Return the same not-found response for a missing issue, a missing project, and another user’s issue.

Update the open count only after the server confirms the transition. Add tests for owner success, cross-user denial, and closing an already closed issue.

## 4. Add optimistic creation with rollback

Render a pending issue immediately with a temporary client ID. Replace it with the server record on success. Remove it and announce an error on failure without losing the draft. Disable only the submitted form, not unrelated project navigation.

Add a deterministic failure switch to the local route for tests. Do not use random failures.

## 5. Add comments

Create comments as a separate resource with author, body, and timestamp. A comment write must resolve the authenticated owner, owned project, and project issue on the server. Do not accept an author ID from the browser.

Render comments as a list with a labelled form. Keep an empty state for issues with no comments.

## 6. Add labels

Seed a small label set per project and allow an owner to assign labels to an issue. Model project labels separately from issue-label assignments. Reject label IDs from another project even when the account owns both projects in an extended fixture.

This exercise tests nested authorization beyond the starter’s one-project-per-user shape.

## 7. Add browser tests

Install Playwright locally and cover:

1. Alice signs in, sees only Alice’s project, and creates an issue.
2. Bob signs in in an isolated browser context and cannot see Alice’s issue.
3. Alice directly requests Bob’s project URL and receives the same response as a missing project.
4. Keyboard input can complete sign-in and issue creation.
5. A validation error is announced and leaves the form recoverable.

Use role and label locators. Do not use fixed sleeps or CSS implementation selectors.

## 8. Harden CSRF and session lifecycle

Add an explicit CSRF defense for state-changing requests and tests that reject a request without the expected proof. Extend the existing absolute session expiry with idle expiry and session rotation, and test each boundary with an injected clock rather than waiting in real time.

Document how `SameSite=Strict` contributes to the defense and why it is not the only control you rely on.

## 9. Replace process memory

Move users, projects, issues, and sessions to durable storage while preserving the `TrackerStore` behavior as an interface. Ownership must remain part of the data query; do not fetch a project and check its owner only in browser code.

Run the same isolation contract against the persistent adapter. Add migration and reset commands for local development.

## 10. Implement real uploads

Replace local attachment metadata with short-lived object-storage upload URLs. Validate extension, declared content type, detected content type, and size. Store generated object keys rather than user filenames. Add malware scanning and prevent download until scanning succeeds.

The browser must never receive storage credentials. Expired or cross-project attachment operations must fail on the server.

## 11. Add deployment metadata

Add canonical metadata, a social preview, sitemap, and robots policy for the chosen deployment. Keep private project data out of metadata and generated assets. Verify the rendered tags in a production build rather than checking source declarations alone.
