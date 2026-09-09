const clientIdPattern = /^[a-zA-Z0-9_-]{1,128}$/;

export class ReconnectPolicy {
  #attempt = 0;
  #random;

  constructor({ random = Math.random } = {}) {
    this.#random = random;
  }

  get attempt() {
    return this.#attempt;
  }

  nextDelay() {
    this.#attempt += 1;
    const ceiling = Math.min(10_000, 400 * 2 ** Math.min(this.#attempt, 6));
    return Math.floor(this.#random() * ceiling);
  }

  markSessionReady() {
    this.#attempt = 0;
  }
}

export function validatedIdentity(value) {
  if (!value || typeof value !== "object") return null;
  if (typeof value.clientId !== "string" || !clientIdPattern.test(value.clientId)) return null;
  if (typeof value.name !== "string") return null;
  const name = value.name.trim();
  if (name.length < 1 || name.length > 48) return null;
  return { clientId: value.clientId, name };
}
