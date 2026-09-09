export type User = { id: string; email: string; name: string };

export type ProjectSummary = {
  id: string;
  name: string;
  openIssueCount: number;
};

export type Issue = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "open" | "closed";
  createdAt: string;
};

export type ProjectDetail = ProjectSummary & {
  description: string;
  issues: Issue[];
};

export type SessionSnapshot = { user: User; projects: ProjectSummary[] };
export type CreateIssueInput = { title: string; description: string };

export type PreparedAttachment = {
  objectUrl: string;
  contentType: "image/png" | "image/jpeg" | "application/pdf";
  maxBytes: number;
  expiresAt: string;
};
