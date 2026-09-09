import assert from "node:assert/strict";
import test from "node:test";
import { LiveBoard, reconnect } from "../src/board.mjs";

test("orders events and returns missed work after reconnect", () => {
  const board = new LiveBoard([{ id: "1", column: "open" }]);
  board.move({ commandId: "a", cardId: "1", column: "doing", expectedVersion: 0 });
  board.move({ commandId: "b", cardId: "1", column: "done", expectedVersion: 1 });
  assert.deepEqual(reconnect(board, 1).missed.map((event) => event.sequence), [2]);
  assert.equal(board.snapshot().cards[0].column, "done");
});

test("deduplicates retries and rejects stale writes", () => {
  const board = new LiveBoard([{ id: "1", column: "open" }]);
  const first = board.move({ commandId: "same", cardId: "1", column: "doing", expectedVersion: 0 });
  assert.equal(board.move({ commandId: "same", cardId: "1", column: "doing", expectedVersion: 0 }), first);
  assert.throws(() => board.move({ commandId: "new", cardId: "1", column: "done", expectedVersion: 0 }), /STALE_VERSION/);
  assert.equal(board.snapshot().sequence, 1);
});
