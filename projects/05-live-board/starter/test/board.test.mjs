import assert from "node:assert/strict";
import test from "node:test";
import { BoardError, LiveBoard } from "../src/board.mjs";

function createBoard() {
  return new LiveBoard([
    { id: "issue-1", title: "First", priority: "urgent", column: "unassigned" },
    { id: "issue-2", title: "Second", priority: "normal", column: "waiting" }
  ], { clock: () => new Date("2026-09-09T00:00:00.000Z") });
}

test("accepted moves have contiguous order and complete card projections", () => {
  const board = createBoard();
  const first = board.move({ commandId: "command-1", actorId: "agent-1", cardId: "issue-1", column: "investigating", expectedVersion: 0 });
  const second = board.move({ commandId: "command-2", actorId: "agent-1", cardId: "issue-2", column: "resolved", expectedVersion: 0 });

  assert.deepEqual([first.event.sequence, second.event.sequence], [1, 2]);
  assert.deepEqual(first.event.card, {
    id: "issue-1",
    title: "First",
    priority: "urgent",
    column: "investigating",
    version: 1
  });
  assert.equal(first.event.occurredAt, "2026-09-09T00:00:00.000Z");
  assert.deepEqual(board.eventsAfter(1), [second.event]);
});

test("identical command retries return the original event without another mutation", () => {
  const board = createBoard();
  const command = { commandId: "same-command", actorId: "agent-1", cardId: "issue-1", column: "investigating", expectedVersion: 0 };
  const first = board.move(command);
  const retry = board.move(command);

  assert.equal(first.duplicate, false);
  assert.equal(retry.duplicate, true);
  assert.equal(retry.event, first.event);
  assert.equal(board.sequence, 1);
  assert.equal(board.card("issue-1").version, 1);
});

test("a reused command key with changed input is rejected", () => {
  const board = createBoard();
  board.move({ commandId: "same-command", actorId: "agent-1", cardId: "issue-1", column: "investigating", expectedVersion: 0 });

  assert.throws(
    () => board.move({ commandId: "same-command", actorId: "agent-1", cardId: "issue-1", column: "resolved", expectedVersion: 1 }),
    (error) => error instanceof BoardError && error.code === "IDEMPOTENCY_CONFLICT"
  );
  assert.equal(board.sequence, 1);
});

test("stale failures return current state and do not reserve command IDs", () => {
  const board = createBoard();
  board.move({ commandId: "first", actorId: "agent-1", cardId: "issue-1", column: "investigating", expectedVersion: 0 });

  assert.throws(
    () => board.move({ commandId: "retryable", actorId: "agent-2", cardId: "issue-1", column: "waiting", expectedVersion: 0 }),
    (error) => error.code === "STALE_VERSION" && error.details.currentCard.version === 1
  );

  const accepted = board.move({ commandId: "retryable", actorId: "agent-2", cardId: "issue-1", column: "waiting", expectedVersion: 1 });
  assert.equal(accepted.event.sequence, 2);
  assert.equal(board.card("issue-1").column, "waiting");
});
