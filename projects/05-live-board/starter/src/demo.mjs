import { LiveBoard, reconnect } from "./board.mjs";

const board = new LiveBoard([{ id: "issue-1", title: "Payment failed", column: "open" }]);
board.move({ commandId: "move-1", cardId: "issue-1", column: "investigating", expectedVersion: 0 });
console.log(JSON.stringify(reconnect(board, 0), null, 2));
