import { CommandLedger, IdempotencyConflictError } from "./idempotency.mjs";
import { EventJournal } from "./ordering.mjs";

export const BOARD_COLUMNS = Object.freeze([
  "unassigned",
  "investigating",
  "waiting",
  "resolved"
]);

export class BoardError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "BoardError";
    this.code = code;
    this.details = details;
  }
}

export class LiveBoard {
  #cards = new Map();
  #journal;
  #commands;

  constructor(cards, { clock = () => new Date(), journal, commands } = {}) {
    this.#journal = journal ?? new EventJournal({ clock });
    this.#commands = commands ?? new CommandLedger();

    for (const input of cards) {
      if (!input?.id || this.#cards.has(input.id)) throw new Error("Cards require unique non-empty IDs");
      if (!BOARD_COLUMNS.includes(input.column)) throw new Error(`Unknown board column: ${input.column}`);
      this.#cards.set(input.id, Object.freeze({ ...input, version: input.version ?? 0 }));
    }
  }

  get sequence() {
    return this.#journal.sequence;
  }

  move({ commandId, actorId, cardId, column, expectedVersion }) {
    const command = { commandId, actorId, cardId, column, expectedVersion };
    validateMove(command);

    try {
      return this.#commands.execute(commandId, command, () => {
        const card = this.#cards.get(cardId);
        if (!card) throw new BoardError("CARD_NOT_FOUND", `Card ${cardId} does not exist`);
        if (!BOARD_COLUMNS.includes(column)) throw new BoardError("INVALID_COLUMN", `Column ${column} does not exist`);
        if (card.version !== expectedVersion) {
          throw new BoardError("STALE_VERSION", "The card changed before this move was accepted", {
            currentCard: { ...card }
          });
        }
        if (card.column === column) {
          throw new BoardError("NO_CHANGE", "The card is already in that column", {
            currentCard: { ...card }
          });
        }

        const updatedCard = Object.freeze({ ...card, column, version: card.version + 1 });
        this.#cards.set(cardId, updatedCard);
        return this.#journal.append("card.moved", { commandId, actorId, card: updatedCard });
      });
    } catch (error) {
      if (error instanceof IdempotencyConflictError) throw new BoardError(error.code, error.message);
      throw error;
    }
  }

  eventsAfter(sequence) {
    return this.#journal.eventsAfter(sequence);
  }

  card(cardId) {
    const card = this.#cards.get(cardId);
    return card ? { ...card } : null;
  }

  snapshot() {
    return {
      sequence: this.sequence,
      columns: [...BOARD_COLUMNS],
      cards: [...this.#cards.values()]
        .map((card) => ({ ...card }))
        .sort((left, right) => left.id.localeCompare(right.id))
    };
  }
}

function validateMove(command) {
  for (const field of ["commandId", "actorId", "cardId", "column"]) {
    if (typeof command[field] !== "string" || command[field].length < 1 || command[field].length > 128) {
      throw new BoardError("INVALID_COMMAND", `${field} must be a non-empty string of at most 128 characters`);
    }
  }
  if (!Number.isInteger(command.expectedVersion) || command.expectedVersion < 0) {
    throw new BoardError("INVALID_COMMAND", "expectedVersion must be a non-negative integer");
  }
}

export function seedCards() {
  return [
    { id: "issue-1042", title: "Checkout fails after coupon removal", priority: "urgent", column: "unassigned" },
    { id: "issue-1048", title: "Invoice PDF shows the wrong timezone", priority: "normal", column: "unassigned" },
    { id: "issue-1031", title: "SSO callback loops for invited members", priority: "urgent", column: "investigating" },
    { id: "issue-1037", title: "CSV export omits archived tickets", priority: "normal", column: "investigating" },
    { id: "issue-1029", title: "Customer replied with HAR capture", priority: "normal", column: "waiting" },
    { id: "issue-1016", title: "Restore deleted workspace", priority: "normal", column: "resolved" }
  ];
}
