export class LiveBoard {
  #cards = new Map();
  #events = [];
  #commands = new Map();

  constructor(cards) {
    for (const card of cards) this.#cards.set(card.id, { ...card, version: 0 });
  }

  move({ commandId, cardId, column, expectedVersion }) {
    if (this.#commands.has(commandId)) return this.#commands.get(commandId);

    const card = this.#cards.get(cardId);
    if (!card) throw new Error("CARD_NOT_FOUND");
    if (card.version !== expectedVersion) throw new Error("STALE_VERSION");

    card.column = column;
    card.version += 1;
    const event = Object.freeze({
      sequence: this.#events.length + 1,
      type: "card.moved",
      card: { ...card },
      commandId
    });
    this.#events.push(event);
    this.#commands.set(commandId, event);
    return event;
  }

  eventsAfter(sequence) {
    return this.#events.filter((event) => event.sequence > sequence);
  }

  snapshot() {
    return { sequence: this.#events.length, cards: [...this.#cards.values()].map((card) => ({ ...card })) };
  }
}

export function reconnect(board, clientSequence) {
  return { snapshot: board.snapshot(), missed: board.eventsAfter(clientSequence) };
}
