import { cookies } from "next/headers";
import { IssueTrackerClient } from "@/components/issue-tracker-client";
import type { ProjectDetail, SessionSnapshot } from "@/lib/domain";
import { SESSION_COOKIE } from "@/lib/http";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  let initialSession: SessionSnapshot | null = null;
  let initialProject: ProjectDetail | null = null;

  try {
    const userId = store.userIdForSession(sessionId);
    initialSession = store.getSnapshot(userId);
    const firstProject = initialSession.projects[0];
    if (firstProject) initialProject = store.getProject(userId, firstProject.id);
  } catch {
    initialSession = null;
  }

  return (
    <main className="shell">
      <a className="skip-link" href="#workspace">Skip to issue workspace</a>
      <header className="masthead">
        <div>
          <p className="eyebrow">Project 04 · server boundary lab</p>
          <h1>Boundary</h1>
          <p className="lede">A private issue tracker where the server decides what each account may read and change.</p>
        </div>
        <div className="boundary-note" aria-label="Architecture summary">
          <span>Server</span>
          Sessions · ownership · validation
          <span>Client</span>
          Forms · pending states · rendering
        </div>
      </header>
      <IssueTrackerClient initialSession={initialSession} initialProject={initialProject} />
    </main>
  );
}
