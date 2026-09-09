const permissions = {
  owner: new Set(["issue:read", "issue:write", "member:write"]),
  admin: new Set(["issue:read", "issue:write", "member:write"]),
  member: new Set(["issue:read", "issue:write"]),
  viewer: new Set(["issue:read"])
};

export class TeamSaas {
  issues = [];
  audit = [];
  queue = [];
  deadLetters = [];
  webhookDeliveries = new Set();

  authorize(role, permission) {
    if (!permissions[role]?.has(permission)) throw new Error("FORBIDDEN");
  }

  listIssues({ tenantId, role }) {
    this.authorize(role, "issue:read");
    return this.issues.filter((issue) => issue.tenantId === tenantId).map((issue) => ({ ...issue }));
  }

  createIssue({ tenantId, role, title, actorId }) {
    this.authorize(role, "issue:write");
    const issue = { id: `issue-${this.issues.length + 1}`, tenantId, title };
    this.issues.push(issue);
    this.audit.push(Object.freeze({ tenantId, actorId, action: "issue.created", targetId: issue.id }));
    return { ...issue };
  }

  enqueue(job) {
    this.queue.push({ ...job, attempts: 0 });
  }

  runNext(handler, maxAttempts = 3) {
    const job = this.queue.shift();
    if (!job) return "empty";
    try {
      handler(job);
      return "completed";
    } catch {
      job.attempts += 1;
      if (job.attempts >= maxAttempts) this.deadLetters.push(job);
      else this.queue.push(job);
      return job.attempts >= maxAttempts ? "dead-lettered" : "retrying";
    }
  }

  receiveWebhook(deliveryId, handler) {
    if (this.webhookDeliveries.has(deliveryId)) return "duplicate";
    handler();
    this.webhookDeliveries.add(deliveryId);
    return "processed";
  }
}
