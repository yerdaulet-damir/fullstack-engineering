import { createHash } from "node:crypto";

export class IdempotencyConflictError extends Error {
  constructor(key) {
    super(`Command key ${key} was already used with different input`);
    this.name = "IdempotencyConflictError";
    this.code = "IDEMPOTENCY_CONFLICT";
  }
}

export class CommandLedger {
  #entries = new Map();

  execute(key, input, operation) {
    const fingerprint = fingerprintInput(input);
    const existing = this.#entries.get(key);

    if (existing) {
      if (existing.fingerprint !== fingerprint) throw new IdempotencyConflictError(key);
      return { event: existing.event, duplicate: true };
    }

    const event = operation();
    this.#entries.set(key, Object.freeze({ fingerprint, event }));
    return { event, duplicate: false };
  }

  get size() {
    return this.#entries.size;
  }
}

function fingerprintInput(input) {
  const normalized = Object.keys(input).sort().map((key) => [key, input[key]]);
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}
