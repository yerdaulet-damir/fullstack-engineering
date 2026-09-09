import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { NextRequest } from "next/server";
import { POST as createIssue } from "../src/app/api/projects/[projectId]/issues/route";
import { GET as getProject } from "../src/app/api/projects/[projectId]/route";
import { DELETE as signOut, POST as signIn } from "../src/app/api/session/route";
import { SESSION_COOKIE } from "../src/lib/http";

async function sessionCookie(email: string): Promise<string> {
  const response = await signIn(new NextRequest("http://localhost:3004/api/session", {
    method: "POST",
    body: JSON.stringify({ email }),
    headers: { "content-type": "application/json" },
  }));
  const cookie = response.cookies.get(SESSION_COOKIE)?.value;
  assert.ok(cookie);
  return `${SESSION_COOKIE}=${cookie}`;
}

test("route handlers require an HTTP-only same-site session", async () => {
  const response = await signIn(new NextRequest("http://localhost:3004/api/session", {
    method: "POST",
    body: JSON.stringify({ email: "alice@example.test" }),
    headers: { "content-type": "application/json" },
  }));

  assert.equal(response.status, 200);
  const setCookie = response.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
});

test("project routes reject requests without a server-side session", async () => {
  const response = await getProject(
    new NextRequest("http://localhost:3004/api/projects/project-alice"),
    { params: Promise.resolve({ projectId: "project-alice" }) },
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in to continue." },
  });
});

test("logout clears the cookie and invalidates its server-side session", async () => {
  const cookie = await sessionCookie("alice@example.test");
  const logoutResponse = await signOut(new NextRequest("http://localhost:3004/api/session", {
    method: "DELETE",
    headers: { cookie },
  }));
  const projectResponse = await getProject(
    new NextRequest("http://localhost:3004/api/projects/project-alice", { headers: { cookie } }),
    { params: Promise.resolve({ projectId: "project-alice" }) },
  );

  assert.equal(logoutResponse.status, 204);
  assert.match(logoutResponse.headers.get("set-cookie") ?? "", /Max-Age=0/i);
  assert.equal(projectResponse.status, 401);
});

test("Alice receives 404 for Bob's project reads and writes", async () => {
  const fixture = JSON.parse(
    await readFile(new URL("../fixtures/cross-user-private-project.json", import.meta.url), "utf8"),
  ) as { actorEmail: string; targetProjectId: string; expectedStatus: number };
  const cookie = await sessionCookie(fixture.actorEmail);
  const context = { params: Promise.resolve({ projectId: fixture.targetProjectId }) };
  const read = await getProject(new NextRequest(`http://localhost:3004/api/projects/${fixture.targetProjectId}`, { headers: { cookie } }), context);
  const missing = await getProject(new NextRequest("http://localhost:3004/api/projects/missing", { headers: { cookie } }), {
    params: Promise.resolve({ projectId: "missing" }),
  });
  const write = await createIssue(new NextRequest(`http://localhost:3004/api/projects/${fixture.targetProjectId}/issues`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ title: "Unauthorized write", description: "Must not persist" }),
  }), context);

  assert.equal(read.status, fixture.expectedStatus);
  assert.equal(missing.status, fixture.expectedStatus);
  assert.equal(write.status, fixture.expectedStatus);
  const expectedBody = { error: { code: "PROJECT_NOT_FOUND", message: "Project was not found." } };
  assert.deepEqual(await read.json(), expectedBody);
  assert.deepEqual(await missing.json(), expectedBody);
  assert.deepEqual(await write.json(), expectedBody);
});

test("Bob can create an issue in Bob's project", async () => {
  const cookie = await sessionCookie("bob@example.test");
  const response = await createIssue(new NextRequest("http://localhost:3004/api/projects/project-bob/issues", {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ title: "Owner write", description: "Created through the route." }),
  }), { params: Promise.resolve({ projectId: "project-bob" }) });

  assert.equal(response.status, 201);
  assert.equal((await response.json()).title, "Owner write");
});
