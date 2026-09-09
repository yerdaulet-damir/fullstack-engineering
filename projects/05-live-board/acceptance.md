# Acceptance

Run `pnpm check:starter`, then reproduce the browser checks manually.

## Product

- The root URL serves a usable four-column board without a build step.
- A card can be dragged to another column and updates after server acceptance.
- The UI shows `connecting`, `live`, `recovering`, or `offline`, plus server sequence and pending-command count.
- Two browser windows receive the same accepted move and converge on card column and version.
- Active-agent presence appears in both windows and expires after heartbeat silence.

## Ordering and concurrency

- Every accepted move receives the next contiguous server sequence.
- The event contains the complete updated card projection and its incremented version.
- A move using an old `expectedVersion` is rejected as `STALE_VERSION` with the current card.
- A browser that observes a sequence gap requests recovery before applying later events.

## Idempotency

- Repeating one command ID with identical input returns the original event and `duplicate: true`.
- A duplicate does not increment card version or server sequence.
- Reusing one command ID with changed input returns `IDEMPOTENCY_CONFLICT`.
- Failed stale or invalid commands do not reserve their command IDs.

## Reconnect and resume

- Reconnect delay is capped exponential backoff with full jitter.
- The reconnect attempt count resets after a valid `sync`, not when TCP opens.
- Persisted client identity is reused only when its ID and trimmed name satisfy the protocol constraints.
- A client with a stored projection sends its last applied sequence in `hello`.
- A stale client receives only events after that sequence.
- A fresh client or a client ahead of the server receives a full snapshot.
- Heartbeats continue only while the socket is open.

## Transport and HTTP

- `/api/health` returns service status, server sequence, connected sockets, and active presence count.
- `/ws` rejects a missing or incorrect token.
- The server requires subprotocol `live-board.v1` and a `hello` message before commands.
- The WebSocket implementation accepts masked text, ping, pong, and close frames; it rejects binary, fragmented, oversized, or unmasked client messages.
- Shutdown closes connected sockets and the HTTP listener.

## Evidence

- Automated tests cover domain rules, presence expiry, HTTP routes, authentication rejection, fan-out, duplicate acknowledgement, and reconnect resume.
- `pnpm load` opens 100 clients by default and prints successes, failures, elapsed milliseconds, and connections per second.
- The load result is recorded with machine, Node version, date, and command. It is described as a local connection probe, not a production capacity claim.
