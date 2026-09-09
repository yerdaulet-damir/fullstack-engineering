import { randomUUID } from "node:crypto";

const clone = (value) => structuredClone(value);
const membershipKey = (tenantId, userId) => `${tenantId}:${userId}`;

export class InMemoryTenantRepository {
  #tenants = new Map();
  #memberships = new Map();
  #issues = new Map();
  #newId;
  #now;

  constructor({ tenants = [], memberships = [], issues = [], newId = randomUUID, now = () => new Date().toISOString() } = {}) {
    this.#newId = newId;
    this.#now = now;
    for (const tenant of tenants) this.#tenants.set(tenant.id, clone(tenant));
    for (const membership of memberships) this.#memberships.set(membershipKey(membership.tenantId, membership.userId), clone(membership));
    for (const issue of issues) this.#issues.set(issue.id, clone(issue));
  }

  getTenant({ tenantId }) {
    const tenant = this.#tenants.get(tenantId);
    return tenant ? clone(tenant) : null;
  }

  getMembership({ tenantId, userId }) {
    const membership = this.#memberships.get(membershipKey(tenantId, userId));
    return membership ? clone(membership) : null;
  }

  listMemberships({ tenantId }) {
    return [...this.#memberships.values()].filter((membership) => membership.tenantId === tenantId).map(clone);
  }

  addMembership({ tenantId, userId, role }) {
    const membership = { tenantId, userId, role, status: "active" };
    this.#memberships.set(membershipKey(tenantId, userId), membership);
    return clone(membership);
  }

  listIssues({ tenantId }) {
    return [...this.#issues.values()]
      .filter((issue) => issue.tenantId === tenantId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
      .map(clone);
  }

  findIssue({ tenantId, issueId }) {
    const issue = this.#issues.get(issueId);
    return issue?.tenantId === tenantId ? clone(issue) : null;
  }

  createIssue({ tenantId, title, createdBy }) {
    const issue = {
      id: this.#newId(),
      tenantId,
      title,
      status: "open",
      createdBy,
      createdAt: this.#now(),
      updatedAt: this.#now()
    };
    this.#issues.set(issue.id, issue);
    return clone(issue);
  }

  updateIssue({ tenantId, issueId, changes }) {
    const issue = this.#issues.get(issueId);
    if (!issue || issue.tenantId !== tenantId) return null;
    const updated = { ...issue, ...clone(changes), updatedAt: this.#now() };
    this.#issues.set(issueId, updated);
    return clone(updated);
  }
}

export function createDemoRepository() {
  return new InMemoryTenantRepository({
    tenants: [
      { id: "acme", name: "Acme Support" },
      { id: "globex", name: "Globex Operations" }
    ],
    memberships: [
      { tenantId: "acme", userId: "alice", role: "owner", status: "active" },
      { tenantId: "acme", userId: "sam", role: "member", status: "active" },
      { tenantId: "acme", userId: "viv", role: "viewer", status: "active" },
      { tenantId: "globex", userId: "bob", role: "owner", status: "active" },
      { tenantId: "globex", userId: "gina", role: "member", status: "active" }
    ],
    issues: [
      { id: "issue-acme-1", tenantId: "acme", title: "Export failed", status: "open", createdBy: "alice", createdAt: "2026-09-09T08:00:00.000Z", updatedAt: "2026-09-09T08:00:00.000Z" },
      { id: "issue-globex-1", tenantId: "globex", title: "Webhook delayed", status: "open", createdBy: "bob", createdAt: "2026-09-09T09:00:00.000Z", updatedAt: "2026-09-09T09:00:00.000Z" }
    ]
  });
}
