import { randomUUID } from "node:crypto";

export function encodeCursor(issue) {
  return Buffer.from(JSON.stringify([issue.createdAt, issue.id])).toString("base64url");
}

export function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (!Array.isArray(parsed) || parsed.length !== 2 || parsed.some((value) => typeof value !== "string")) throw new Error();
    return { createdAt: parsed[0], id: parsed[1] };
  } catch {
    const error = new Error("cursor is invalid");
    error.statusCode = 400;
    error.code = "INVALID_CURSOR";
    throw error;
  }
}

export class MemoryIssueRepository {
  constructor() {
    this.users = [
      { id: "user-alice", name: "Alice" },
      { id: "user-bob", name: "Bob" }
    ];
    this.issues = [];
    this.comments = [];
    this.audit = [];
  }

  async listUsers() {
    return this.users;
  }

  async createIssue(input) {
    const issue = { id: randomUUID(), title: input.title, status: "open", assigneeId: null, createdAt: new Date().toISOString() };
    this.issues.push(issue);
    return issue;
  }

  async listIssues({ limit, cursor }) {
    const boundary = decodeCursor(cursor);
    const sorted = [...this.issues].sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id));
    const eligible = boundary
      ? sorted.filter((issue) => issue.createdAt < boundary.createdAt || (issue.createdAt === boundary.createdAt && issue.id < boundary.id))
      : sorted;
    const page = eligible.slice(0, limit + 1);
    const hasMore = page.length > limit;
    const items = page.slice(0, limit);
    return { items, nextCursor: hasMore ? encodeCursor(items.at(-1)) : null };
  }

  async addComment(issueId, body) {
    this.requireIssue(issueId);
    const comment = { id: randomUUID(), issueId, body, createdAt: new Date().toISOString() };
    this.comments.push(comment);
    return comment;
  }

  async assignIssue(issueId, assigneeId, actorId) {
    const issue = this.requireIssue(issueId);
    if (!this.users.some((user) => user.id === assigneeId)) {
      const error = new Error("assignee was not found");
      error.statusCode = 404;
      error.code = "ASSIGNEE_NOT_FOUND";
      throw error;
    }
    issue.assigneeId = assigneeId;
    this.audit.push({ issueId, actorId, action: "issue.assigned", data: { assigneeId } });
    return issue;
  }

  requireIssue(issueId) {
    const issue = this.issues.find((candidate) => candidate.id === issueId);
    if (!issue) {
      const error = new Error("issue was not found");
      error.statusCode = 404;
      error.code = "ISSUE_NOT_FOUND";
      throw error;
    }
    return issue;
  }
}

export class PostgresIssueRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async listUsers() {
    const result = await this.pool.query("select id, name from users order by name");
    return result.rows;
  }

  async createIssue({ title }) {
    const result = await this.pool.query(
      "insert into issues (title) values ($1) returning id, title, status, assignee_id as \"assigneeId\", created_at as \"createdAt\"",
      [title]
    );
    return result.rows[0];
  }

  async listIssues({ limit, cursor }) {
    const boundary = decodeCursor(cursor);
    const values = boundary ? [boundary.createdAt, boundary.id, limit + 1] : [limit + 1];
    const where = boundary ? "where (created_at, id) < ($1::timestamptz, $2::uuid)" : "";
    const limitParameter = boundary ? "$3" : "$1";
    const result = await this.pool.query(
      `select id, title, status, assignee_id as "assigneeId", created_at as "createdAt" from issues ${where} order by created_at desc, id desc limit ${limitParameter}`,
      values
    );
    const hasMore = result.rows.length > limit;
    const items = result.rows.slice(0, limit);
    return { items, nextCursor: hasMore ? encodeCursor(items.at(-1)) : null };
  }

  async addComment(issueId, body) {
    const result = await this.pool.query(
      "insert into comments (issue_id, body) values ($1, $2) returning id, issue_id as \"issueId\", body, created_at as \"createdAt\"",
      [issueId, body]
    );
    return result.rows[0];
  }

  async assignIssue(issueId, assigneeId, actorId) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await client.query(
        "update issues set assignee_id = $2 where id = $1 returning id, title, status, assignee_id as \"assigneeId\", created_at as \"createdAt\"",
        [issueId, assigneeId]
      );
      if (!result.rowCount) {
        const error = new Error("issue was not found");
        error.statusCode = 404;
        error.code = "ISSUE_NOT_FOUND";
        throw error;
      }
      await client.query("insert into audit_events (issue_id, actor_id, action, data) values ($1, $2, 'issue.assigned', $3)", [issueId, actorId, { assigneeId }]);
      await client.query("commit");
      return result.rows[0];
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}
