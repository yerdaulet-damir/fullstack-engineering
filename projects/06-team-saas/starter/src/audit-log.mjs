import { randomUUID } from "node:crypto";

export class InMemoryAuditLog {
  #events = [];
  #newId;
  #now;

  constructor({ newId = randomUUID, now = () => new Date().toISOString() } = {}) {
    this.#newId = newId;
    this.#now = now;
  }

  append({ tenantId, actorId, action, targetType, targetId, metadata = {} }) {
    const event = Object.freeze({
      id: this.#newId(), tenantId, actorId, action, targetType, targetId,
      metadata: Object.freeze(structuredClone(metadata)), occurredAt: this.#now()
    });
    this.#events.push(event);
    return structuredClone(event);
  }

  list({ tenantId }) {
    return this.#events.filter((event) => event.tenantId === tenantId).map((event) => structuredClone(event));
  }
}
