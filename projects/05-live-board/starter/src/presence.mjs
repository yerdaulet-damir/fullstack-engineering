export class PresenceTracker {
  #entries = new Map();
  #clock;
  #ttlMs;

  constructor({ ttlMs = 15_000, clock = () => Date.now() } = {}) {
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) throw new TypeError("ttlMs must be positive");
    this.#ttlMs = ttlMs;
    this.#clock = clock;
  }

  heartbeat(clientId, name) {
    validateIdentity(clientId, name);
    const now = this.#clock();
    this.#entries.set(clientId, { clientId, name: name.trim(), expiresAt: now + this.#ttlMs });
    return this.list();
  }

  sweep() {
    const now = this.#clock();
    const expired = [];
    for (const [clientId, entry] of this.#entries) {
      if (entry.expiresAt <= now) {
        this.#entries.delete(clientId);
        expired.push(clientId);
      }
    }
    return expired;
  }

  list() {
    this.sweep();
    return [...this.#entries.values()]
      .map(({ clientId, name, expiresAt }) => ({ clientId, name, expiresAt }))
      .sort((left, right) => left.name.localeCompare(right.name) || left.clientId.localeCompare(right.clientId));
  }
}

function validateIdentity(clientId, name) {
  if (typeof clientId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(clientId)) {
    throw new TypeError("clientId contains unsupported characters");
  }
  if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 48) {
    throw new TypeError("name must contain 1 to 48 characters");
  }
}
