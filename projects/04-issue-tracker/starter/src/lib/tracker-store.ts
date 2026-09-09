import { randomUUID } from "node:crypto";
import type {
  CreateIssueInput,
  Issue,
  PreparedAttachment,
  ProjectDetail,
  ProjectSummary,
  SessionSnapshot,
  User,
} from "./domain";

type StoredProject = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
};

type StoreOptions = { createId?: () => string; now?: () => Date };

type StoredSession = {
  userId: string;
  expiresAt: number;
};

export const SESSION_TTL_MS = 60 * 60 * 1000;

export class AuthenticationRequiredError extends Error {}
export class InvalidCredentialsError extends Error {}
export class ProjectNotFoundError extends Error {}
export class ValidationError extends Error {}

const seededUsers: User[] = [
  { id: "alice", email: "alice@example.test", name: "Alice Morgan" },
  { id: "bob", email: "bob@example.test", name: "Bob Chen" },
];

const seededProjects: StoredProject[] = [
  { id: "project-alice", ownerId: "alice", name: "Tempo launch", description: "Private launch tasks owned by Alice." },
  { id: "project-bob", ownerId: "bob", name: "Pulse operations", description: "Private reliability work owned by Bob." },
];

const seededIssues: Issue[] = [
  {
    id: "issue-alice-1",
    projectId: "project-alice",
    title: "Review keyboard order",
    description: "Check the signup flow without a pointer.",
    status: "open",
    createdAt: "2026-09-01T09:00:00.000Z",
  },
  {
    id: "issue-bob-1",
    projectId: "project-bob",
    title: "Document retry behavior",
    description: "Describe how operators recover from a failed request.",
    status: "open",
    createdAt: "2026-09-02T10:30:00.000Z",
  },
];

export class TrackerStore {
  private readonly users = structuredClone(seededUsers);
  private readonly projects = structuredClone(seededProjects);
  private readonly issues = structuredClone(seededIssues);
  private readonly sessions = new Map<string, StoredSession>();
  private readonly createId: () => string;
  private readonly now: () => Date;

  constructor(options: StoreOptions = {}) {
    this.createId = options.createId ?? randomUUID;
    this.now = options.now ?? (() => new Date());
  }

  signIn(email: string): { sessionId: string; snapshot: SessionSnapshot } {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.users.find((candidate) => candidate.email === normalizedEmail);
    if (!user) throw new InvalidCredentialsError("Use one of the supplied demo accounts.");

    const sessionId = this.createId();
    this.sessions.set(sessionId, {
      userId: user.id,
      expiresAt: this.now().getTime() + SESSION_TTL_MS,
    });
    return { sessionId, snapshot: this.getSnapshot(user.id) };
  }

  signOut(sessionId: string | undefined): void {
    if (sessionId) this.sessions.delete(sessionId);
  }

  userIdForSession(sessionId: string | undefined): string {
    if (!sessionId) throw new AuthenticationRequiredError("Sign in to continue.");
    const session = this.sessions.get(sessionId);
    if (!session) throw new AuthenticationRequiredError("Sign in to continue.");
    if (session.expiresAt <= this.now().getTime()) {
      this.sessions.delete(sessionId);
      throw new AuthenticationRequiredError("Sign in to continue.");
    }
    return session.userId;
  }

  getSnapshot(userId: string): SessionSnapshot {
    const user = this.users.find((candidate) => candidate.id === userId);
    if (!user) throw new AuthenticationRequiredError("Sign in to continue.");
    return { user: { ...user }, projects: this.listProjects(userId) };
  }

  listProjects(userId: string): ProjectSummary[] {
    return this.projects
      .filter((project) => project.ownerId === userId)
      .map((project) => ({
        id: project.id,
        name: project.name,
        openIssueCount: this.issues.filter((issue) => issue.projectId === project.id && issue.status === "open").length,
      }));
  }

  getProject(userId: string, projectId: string): ProjectDetail {
    const project = this.requireOwnedProject(userId, projectId);
    const issues = this.issues
      .filter((issue) => issue.projectId === project.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      openIssueCount: issues.filter((issue) => issue.status === "open").length,
      issues: structuredClone(issues),
    };
  }

  createIssue(userId: string, projectId: string, input: CreateIssueInput): Issue {
    this.requireOwnedProject(userId, projectId);
    const title = input.title.trim();
    const description = input.description.trim();
    if (title.length < 3 || title.length > 120) throw new ValidationError("Title must contain 3 to 120 characters.");
    if (description.length > 500) throw new ValidationError("Description must contain at most 500 characters.");

    const issue: Issue = {
      id: this.createId(),
      projectId,
      title,
      description,
      status: "open",
      createdAt: this.now().toISOString(),
    };
    this.issues.push(issue);
    return structuredClone(issue);
  }

  prepareAttachment(userId: string, projectId: string, contentType: PreparedAttachment["contentType"]): PreparedAttachment {
    this.requireOwnedProject(userId, projectId);
    return {
      objectUrl: `/local-uploads/${this.createId()}`,
      contentType,
      maxBytes: 5_000_000,
      expiresAt: new Date(this.now().getTime() + 5 * 60 * 1000).toISOString(),
    };
  }

  private requireOwnedProject(userId: string, projectId: string): StoredProject {
    const project = this.projects.find((candidate) => candidate.id === projectId && candidate.ownerId === userId);
    if (!project) throw new ProjectNotFoundError("Project was not found.");
    return project;
  }
}
