import { randomUUID } from "node:crypto";

export class TrackerStore {
  constructor() {
    this.users = [
      { id: "alice", email: "alice@example.test" },
      { id: "bob", email: "bob@example.test" }
    ];
    this.projects = [
      { id: "project-alice", ownerId: "alice", name: "Alice private project" },
      { id: "project-bob", ownerId: "bob", name: "Bob private project" }
    ];
    this.issues = [];
    this.sessions = new Map();
  }

  signIn(email) {
    const user = this.users.find((candidate) => candidate.email === email);
    if (!user) return null;
    const sessionId = randomUUID();
    this.sessions.set(sessionId, user.id);
    return { sessionId, user };
  }

  userForSession(sessionId) {
    return this.sessions.get(sessionId) ?? null;
  }

  listProjects(userId) {
    return this.projects.filter((project) => project.ownerId === userId).map(({ ownerId: _ownerId, ...project }) => project);
  }

  ownedProject(userId, projectId) {
    const project = this.projects.find((candidate) => candidate.id === projectId && candidate.ownerId === userId);
    if (!project) {
      const error = new Error("project was not found");
      error.statusCode = 404;
      error.code = "PROJECT_NOT_FOUND";
      throw error;
    }
    return project;
  }

  getProject(userId, projectId) {
    const { ownerId: _ownerId, ...project } = this.ownedProject(userId, projectId);
    return { ...project, issues: this.issues.filter((issue) => issue.projectId === projectId) };
  }

  createIssue(userId, projectId, title) {
    this.ownedProject(userId, projectId);
    const issue = { id: randomUUID(), projectId, title, status: "open" };
    this.issues.push(issue);
    return issue;
  }
}
