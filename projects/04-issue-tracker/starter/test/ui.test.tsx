import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { IssueTrackerClient } from "../src/components/issue-tracker-client";

test("signed-out UI exposes a labelled account control and submit action", () => {
  const html = renderToStaticMarkup(<IssueTrackerClient initialSession={null} initialProject={null} />);

  assert.match(html, /<h2 id="signin-title">Choose an account<\/h2>/);
  assert.match(html, /<label for="email">Account<\/label>/);
  assert.match(html, /<select id="email" name="email"/);
  assert.match(html, /<button[^>]*type="submit"[^>]*>Sign in<\/button>/);
});

test("signed-in UI renders account, issue form, and current issues", () => {
  const html = renderToStaticMarkup(
    <IssueTrackerClient
      initialSession={{
        user: { id: "alice", name: "Alice Morgan", email: "alice@example.test" },
        projects: [{ id: "project-alice", name: "Tempo launch", openIssueCount: 1 }],
      }}
      initialProject={{
        id: "project-alice",
        name: "Tempo launch",
        description: "Private launch tasks owned by Alice.",
        openIssueCount: 1,
        issues: [{
          id: "issue-alice-1",
          projectId: "project-alice",
          title: "Review keyboard order",
          description: "Check the signup flow without a pointer.",
          status: "open",
          createdAt: "2026-09-01T09:00:00.000Z",
        }],
      }}
    />,
  );

  assert.match(html, /Alice Morgan/);
  assert.match(html, /<form[^>]*aria-labelledby="create-title"/);
  assert.match(html, /<label for="title">Title<\/label>/);
  assert.match(html, /Review keyboard order/);
});
