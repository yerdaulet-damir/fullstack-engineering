import { InMemoryAuditLog } from "./audit-log.mjs";
import { AuthorizationPolicy } from "./authorization.mjs";
import { badRequest, notFound } from "./errors.mjs";
import { InMemoryDigestSender, InMemoryJobQueue } from "./jobs.mjs";
import { createDemoRepository } from "./repository.mjs";
import { InMemoryWebhookInbox } from "./webhooks.mjs";

const allowedStatuses = new Set(["open", "in_progress", "closed"]);

function requiredText(value, field, maxLength = 160) {
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > maxLength) throw badRequest(`${field} must be between 1 and ${maxLength} characters`);
  return value.trim();
}

export class TeamSaasService {
  constructor({ repository, auditLog, jobQueue, webhookInbox, digestSender } = {}) {
    this.repository = repository ?? createDemoRepository();
    this.auditLog = auditLog ?? new InMemoryAuditLog();
    this.jobQueue = jobQueue ?? new InMemoryJobQueue();
    this.webhookInbox = webhookInbox ?? new InMemoryWebhookInbox();
    this.digestSender = digestSender ?? new InMemoryDigestSender();
    this.policy = new AuthorizationPolicy(this.repository);
  }

  getContext(principal) {
    return this.policy.require(principal, "issue:read");
  }

  listIssues(principal) {
    const actor = this.policy.require(principal, "issue:read");
    return this.repository.listIssues({ tenantId: actor.tenantId });
  }

  getIssue(principal, issueId) {
    const actor = this.policy.require(principal, "issue:read");
    const issue = this.repository.findIssue({ tenantId: actor.tenantId, issueId });
    if (!issue) throw notFound("Issue");
    return issue;
  }

  createIssue(principal, input) {
    const actor = this.policy.require(principal, "issue:write");
    const issue = this.repository.createIssue({ tenantId: actor.tenantId, title: requiredText(input?.title, "title"), createdBy: actor.userId });
    this.auditLog.append({ tenantId: actor.tenantId, actorId: actor.userId, action: "issue.created", targetType: "issue", targetId: issue.id, metadata: { title: issue.title } });
    return issue;
  }

  updateIssue(principal, issueId, input) {
    const actor = this.policy.require(principal, "issue:write");
    const changes = {};
    if (input?.title !== undefined) changes.title = requiredText(input.title, "title");
    if (input?.status !== undefined) {
      if (!allowedStatuses.has(input.status)) throw badRequest("status must be open, in_progress, or closed");
      changes.status = input.status;
    }
    if (Object.keys(changes).length === 0) throw badRequest("At least one supported field is required");
    const issue = this.repository.updateIssue({ tenantId: actor.tenantId, issueId, changes });
    if (!issue) throw notFound("Issue");
    this.auditLog.append({ tenantId: actor.tenantId, actorId: actor.userId, action: "issue.updated", targetType: "issue", targetId: issue.id, metadata: { fields: Object.keys(changes) } });
    return issue;
  }

  queueDigest(principal, input) {
    const actor = this.policy.require(principal, "job:enqueue");
    const idempotencyKey = requiredText(input?.idempotencyKey, "idempotencyKey", 100);
    const result = this.jobQueue.enqueue({ tenantId: actor.tenantId, type: "digest.send", payload: {}, idempotencyKey, requestedBy: actor.userId, maxAttempts: 3 });
    if (!result.duplicate) this.auditLog.append({ tenantId: actor.tenantId, actorId: actor.userId, action: "digest.queued", targetType: "job", targetId: result.job.id, metadata: { idempotencyKey } });
    return result;
  }

  async runNextJob(principal) {
    const actor = this.policy.require(principal, "job:run");
    const outcome = await this.jobQueue.runNext({ tenantId: actor.tenantId }, async (job) => {
      if (job.type !== "digest.send") throw new Error(`Unsupported job type: ${job.type}`);
      return this.digestSender.send({ tenantId: job.tenantId, idempotencyKey: job.idempotencyKey, issueCount: this.repository.listIssues({ tenantId: job.tenantId }).length });
    });
    if (outcome.job) this.auditLog.append({ tenantId: actor.tenantId, actorId: actor.userId, action: `job.${outcome.status}`, targetType: "job", targetId: outcome.job.id, metadata: { attempts: outcome.job.attempts, lastError: outcome.job.lastError } });
    return outcome;
  }

  listDeadLetters(principal) {
    const actor = this.policy.require(principal, "job:read");
    return this.jobQueue.listDeadLetters({ tenantId: actor.tenantId });
  }

  listAudit(principal) {
    const actor = this.policy.require(principal, "audit:read");
    return this.auditLog.list({ tenantId: actor.tenantId });
  }

  async receiveWebhook({ webhookIdentity, deliveryId, payload }) {
    if (webhookIdentity?.kind !== "webhook") throw badRequest("Authenticated webhook identity is required");
    const tenantId = requiredText(webhookIdentity.tenantId, "tenantId", 64);
    const source = requiredText(webhookIdentity.source, "source", 64);
    requiredText(deliveryId, "deliveryId", 128);
    if (!this.repository.getTenant({ tenantId })) throw notFound("Tenant");
    return this.webhookInbox.process({ tenantId, source, deliveryId, payload }, async (event) => {
      if (event?.type !== "customer.updated") throw badRequest("Unsupported webhook event type");
      const result = { accepted: true, customerId: requiredText(event.customerId, "customerId", 100) };
      this.auditLog.append({ tenantId, actorId: `webhook:${webhookIdentity.credentialId}`, action: "webhook.processed", targetType: "customer", targetId: result.customerId, metadata: { deliveryId, source } });
      return result;
    });
  }
}

export function createTeamSaas(options) {
  return new TeamSaasService(options);
}
