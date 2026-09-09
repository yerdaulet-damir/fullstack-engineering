import { randomUUID } from "node:crypto";

const clone = (value) => structuredClone(value);
const dedupeKey = (tenantId, idempotencyKey) => `${tenantId}:${idempotencyKey}`;

export class InMemoryJobQueue {
  #queued = [];
  #deadLetters = [];
  #known = new Map();
  #newId;
  #now;

  constructor({ newId = randomUUID, now = () => new Date().toISOString() } = {}) {
    this.#newId = newId;
    this.#now = now;
  }

  enqueue({ tenantId, type, payload, idempotencyKey, requestedBy, maxAttempts = 3 }) {
    const key = dedupeKey(tenantId, idempotencyKey);
    const existing = this.#known.get(key);
    if (existing) return { job: clone(existing), duplicate: true };
    const job = { id: this.#newId(), tenantId, type, payload: clone(payload), idempotencyKey, requestedBy, attempts: 0, maxAttempts, status: "queued", createdAt: this.#now(), lastError: null };
    this.#queued.push(job);
    this.#known.set(key, job);
    return { job: clone(job), duplicate: false };
  }

  async runNext({ tenantId }, handler) {
    const index = this.#queued.findIndex((job) => job.tenantId === tenantId);
    if (index === -1) return { status: "empty", job: null };
    const [job] = this.#queued.splice(index, 1);
    job.attempts += 1;
    job.status = "running";
    try {
      job.result = clone(await handler(clone(job)));
      job.status = "completed";
      job.completedAt = this.#now();
      return { status: "completed", job: clone(job) };
    } catch (error) {
      job.lastError = error instanceof Error ? error.message : String(error);
      if (job.attempts >= job.maxAttempts) {
        job.status = "dead-lettered";
        job.deadLetteredAt = this.#now();
        this.#deadLetters.push(job);
        return { status: "dead-lettered", job: clone(job) };
      }
      job.status = "queued";
      this.#queued.push(job);
      return { status: "retrying", job: clone(job) };
    }
  }

  listDeadLetters({ tenantId }) {
    return this.#deadLetters.filter((job) => job.tenantId === tenantId).map(clone);
  }
}

export class InMemoryDigestSender {
  #sent = new Map();
  #failuresRemaining;

  constructor({ failuresBeforeSuccess = 0 } = {}) {
    this.#failuresRemaining = failuresBeforeSuccess;
  }

  async send({ tenantId, idempotencyKey, issueCount }) {
    const key = dedupeKey(tenantId, idempotencyKey);
    if (this.#sent.has(key)) return { ...this.#sent.get(key), duplicate: true };
    if (this.#failuresRemaining > 0) {
      this.#failuresRemaining -= 1;
      throw new Error("Digest provider unavailable");
    }
    const delivery = Object.freeze({ tenantId, idempotencyKey, issueCount, duplicate: false });
    this.#sent.set(key, delivery);
    return { ...delivery };
  }

  deliveries({ tenantId }) {
    return [...this.#sent.values()].filter((delivery) => delivery.tenantId === tenantId).map((delivery) => ({ ...delivery }));
  }
}
