"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { Issue, ProjectDetail, SessionSnapshot } from "@/lib/domain";

type Props = {
  initialSession: SessionSnapshot | null;
  initialProject: ProjectDetail | null;
};

type Notice = { kind: "status" | "error"; message: string } | null;

async function readResponse<T>(response: Response): Promise<T> {
  const body: unknown = await response.json();
  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "error" in body &&
      body.error &&
      typeof body.error === "object" &&
      "message" in body.error &&
      typeof body.error.message === "string"
        ? body.error.message
        : undefined;
    throw new Error(message ?? "The request could not be completed.");
  }
  return body as T;
}

export function IssueTrackerClient({ initialSession, initialProject }: Props) {
  const [session, setSession] = useState(initialSession);
  const [project, setProject] = useState(initialProject);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProject?.id ?? "");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (session && !project && session.projects[0]) void loadProject(session.projects[0].id);
  }, [session, project]);

  async function loadProject(projectId: string) {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`);
      const detail = await readResponse<ProjectDetail>(response);
      setSelectedProjectId(projectId);
      setProject(detail);
    } catch (error) {
      setNotice({ kind: "error", message: error instanceof Error ? error.message : "Project failed to load." });
    } finally {
      setBusy(false);
    }
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: data.get("email") }),
      });
      const nextSession = await readResponse<SessionSnapshot>(response);
      setSession(nextSession);
      setProject(null);
      setSelectedProjectId(nextSession.projects[0]?.id ?? "");
      setNotice({ kind: "status", message: `Signed in as ${nextSession.user.name}.` });
    } catch (error) {
      setNotice({ kind: "error", message: error instanceof Error ? error.message : "Sign-in failed." });
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/session", { method: "DELETE" });
      if (!response.ok) throw new Error();
      setSession(null);
      setProject(null);
      setSelectedProjectId("");
      setNotice({ kind: "status", message: "Signed out." });
    } catch {
      setNotice({ kind: "error", message: "Sign-out failed. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function createIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}/issues`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: data.get("title"), description: data.get("description") }),
      });
      const issue = await readResponse<Issue>(response);
      setProject({ ...project, issues: [issue, ...project.issues], openIssueCount: project.openIssueCount + 1 });
      setSession((current) => current ? {
        ...current,
        projects: current.projects.map((item) => item.id === project.id ? { ...item, openIssueCount: item.openIssueCount + 1 } : item),
      } : current);
      form.reset();
      setNotice({ kind: "status", message: `Created issue “${issue.title}”.` });
      headingRef.current?.focus();
    } catch (error) {
      setNotice({ kind: "error", message: error instanceof Error ? error.message : "Issue was not created." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="workspace" className="workspace" aria-busy={busy}>
      <div className="notice-slot">
        {notice ? (
          <p className={`notice ${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>{notice.message}</p>
        ) : busy ? (
          <p className="notice status" role="status">Working…</p>
        ) : null}
      </div>

      {!session ? (
        <section className="signin-panel" aria-labelledby="signin-title">
          <div>
            <p className="section-label">Demo access</p>
            <h2 id="signin-title">Choose an account</h2>
            <p>Each account owns one private project. Switching accounts changes what the API returns.</p>
          </div>
          <form className="signin-form" onSubmit={signIn}>
            <label htmlFor="email">Account</label>
            <select id="email" name="email" defaultValue="alice@example.test" disabled={busy}>
              <option value="alice@example.test">Alice · alice@example.test</option>
              <option value="bob@example.test">Bob · bob@example.test</option>
            </select>
            <button className="button primary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          </form>
        </section>
      ) : (
        <div className="app-grid">
          <aside className="sidebar" aria-label="Account and projects">
            <div className="account">
              <span className="avatar" aria-hidden="true">{session.user.name.charAt(0)}</span>
              <div><strong>{session.user.name}</strong><span>{session.user.email}</span></div>
            </div>
            <button className="button quiet" type="button" onClick={signOut} disabled={busy}>Sign out</button>
            <div className="rule" />
            <p className="section-label">Private projects</p>
            <nav aria-label="Private projects">
              <ul className="project-list">
                {session.projects.map((item) => (
                  <li key={item.id}>
                    <button
                      className="project-button"
                      type="button"
                      aria-current={selectedProjectId === item.id ? "page" : undefined}
                      onClick={() => void loadProject(item.id)}
                      disabled={busy}
                    >
                      <span>{item.name}</span><span>{item.openIssueCount} open</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="project-panel">
            {project ? (
              <>
                <header className="project-header">
                  <div>
                    <p className="section-label">Private project</p>
                    <h2 ref={headingRef} tabIndex={-1}>{project.name}</h2>
                    <p>{project.description}</p>
                  </div>
                  <span className="count">{project.openIssueCount} open</span>
                </header>

                <form className="issue-form" onSubmit={createIssue} aria-labelledby="create-title">
                  <h3 id="create-title">Create an issue</h3>
                  <div className="field">
                    <label htmlFor="title">Title</label>
                    <input id="title" name="title" minLength={3} maxLength={120} required disabled={busy} />
                    <span>3–120 characters</span>
                  </div>
                  <div className="field">
                    <label htmlFor="description">Description <span>(optional)</span></label>
                    <textarea id="description" name="description" maxLength={500} rows={3} disabled={busy} />
                    <span>Up to 500 characters</span>
                  </div>
                  <button className="button primary" type="submit" disabled={busy}>{busy ? "Creating…" : "Create issue"}</button>
                </form>

                <section className="issues" aria-labelledby="issues-title">
                  <div className="issues-heading"><h3 id="issues-title">Issues</h3><span>{project.issues.length} total</span></div>
                  {project.issues.length === 0 ? (
                    <p className="empty-state">No issues yet. Create the first issue for this project.</p>
                  ) : (
                    <ol className="issue-list">
                      {project.issues.map((issue) => (
                        <li key={issue.id}>
                          <div><strong>{issue.title}</strong>{issue.description ? <p>{issue.description}</p> : null}</div>
                          <span className="issue-status">{issue.status}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </>
            ) : (
              <div className="empty-state" role="status">Loading the private project…</div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
