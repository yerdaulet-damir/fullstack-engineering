export class EventJournal {
  #events = [];
  #clock;

  constructor({ clock = () => new Date() } = {}) {
    this.#clock = clock;
  }

  get sequence() {
    return this.#events.length;
  }

  append(type, payload) {
    const event = deepFreeze({
      sequence: this.sequence + 1,
      type,
      occurredAt: this.#clock().toISOString(),
      ...payload
    });
    this.#events.push(event);
    return event;
  }

  eventsAfter(sequence) {
    if (!Number.isInteger(sequence) || sequence < 0) throw new TypeError("sequence must be a non-negative integer");
    return this.#events.slice(sequence);
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
