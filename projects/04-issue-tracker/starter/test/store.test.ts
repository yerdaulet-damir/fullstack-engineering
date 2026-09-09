import assert from "node:assert/strict";
import test from "node:test";
import {
  AuthenticationRequiredError,
  ProjectNotFoundError,
  SESSION_TTL_MS,
  TrackerStore,
} from "../src/lib/tracker-store";

function deterministicStore() {
  let sequence = 0;
  return new TrackerStore({
    createId: () => `generated-${++sequence}`,
    now: () => new Date("2026-09-09T12:00:00.000Z"),
  });
}

test("sessions resolve to one account and its projects", () => {
  const store = deterministicStore();
  const { sessionId, snapshot } = store.signIn("alice@example.test");

  assert.equal(sessionId, "generated-1");
  assert.equal(store.userIdForSession(sessionId), "alice");
  assert.deepEqual(snapshot.projects, [
    { id: "project-alice", name: "Tempo launch", openIssueCount: 1 },
  ]);
});

test("expired sessions are rejected and removed under the injected clock", () => {
  const signedInAt = new Date("2026-09-09T12:00:00.000Z");
  let currentTime = signedInAt;
  const store = new TrackerStore({
    createId: () => "expiring-session",
    now: () => currentTime,
  });
  const { sessionId } = store.signIn("alice@example.test");

  currentTime = new Date(signedInAt.getTime() + SESSION_TTL_MS);
  assert.throws(() => store.userIdForSession(sessionId), AuthenticationRequiredError);

  currentTime = signedInAt;
  assert.throws(() => store.userIdForSession(sessionId), AuthenticationRequiredError);
});

test("sign out invalidates the server-side session", () => {
  const store = deterministicStore();
  const { sessionId } = store.signIn("bob@example.test");

  assert.equal(store.userIdForSession(sessionId), "bob");
  store.signOut(sessionId);
  assert.throws(() => store.userIdForSession(sessionId), AuthenticationRequiredError);
});

test("missing and cross-user projects share one not-found boundary", () => {
  const store = deterministicStore();

  assert.throws(() => store.getProject("alice", "missing"), ProjectNotFoundError);
  assert.throws(() => store.getProject("alice", "project-bob"), ProjectNotFoundError);
  assert.throws(
    () => store.createIssue("alice", "project-bob", { title: "Cross-user write", description: "" }),
    ProjectNotFoundError,
  );
});

test("owners create validated issues with deterministic data", () => {
  const store = deterministicStore();
  const issue = store.createIssue("bob", "project-bob", {
    title: "  Add recovery note  ",
    description: "  Explain the retry path.  ",
  });

  assert.deepEqual(issue, {
    id: "generated-1",
    projectId: "project-bob",
    title: "Add recovery note",
    description: "Explain the retry path.",
    status: "open",
    createdAt: "2026-09-09T12:00:00.000Z",
  });
  assert.equal(store.getProject("bob", "project-bob").openIssueCount, 2);
});
