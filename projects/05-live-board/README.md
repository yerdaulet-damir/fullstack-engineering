# 05 — Live Board

A runnable support board for multiple agents. It includes a browser UI, HTTP server, dependency-free WebSocket transport, ordered board events, command idempotency, expiring presence, reconnect with jitter, and sequence-based resume.

The starter keeps durable concepts separate from transport so Redis or PostgreSQL can replace the in-memory adapters without changing the browser protocol.

## Run it

Requirements: Node.js 22+ and a modern browser.

```bash
cd starter
pnpm check:starter
pnpm dev
```

Open [http://127.0.0.1:3005](http://127.0.0.1:3005) in two browser windows. Drag cards between columns, stop and restart the server, and watch each client report its connection and recovery state.

The local server accepts `local-development-token` by default. Override it with `BOARD_TOKEN`. This token proves the upgrade path can reject an unauthenticated socket; it is not a production identity system.

```bash
BOARD_TOKEN=replace-me pnpm dev
```

If you override the token, open `http://127.0.0.1:3005/?token=replace-me`.

## Commands

```bash
pnpm dev            # HTTP and WebSocket server on port 3005
pnpm test           # domain, presence, HTTP, and WebSocket integration tests
pnpm check:starter  # same complete test suite used by the roadmap
pnpm load           # connect 100 clients to a running local server
```

Set `PORT`, `HOST`, `BOARD_TOKEN`, `LOAD_URL`, `LOAD_TOKEN`, or `LOAD_CLIENTS` to change local defaults.

## What is included

```text
starter/
├── public/
│   ├── app.js                 # browser projection, drag/drop, reconnect, resume
│   ├── client-policy.js       # validated identity and reconnect backoff state
│   ├── index.html             # board and connection UI
│   └── styles.css
├── scripts/
│   └── load.mjs               # concurrent WebSocket connection probe
├── src/
│   ├── board.mjs              # card rules and snapshots
│   ├── demo.mjs               # runnable entry point
│   ├── idempotency.mjs        # command-key ledger and conflict detection
│   ├── ordering.mjs           # monotonic event journal
│   ├── presence.mjs           # heartbeat TTLs
│   ├── server.mjs             # HTTP routes and realtime protocol
│   └── websocket.mjs          # RFC 6455 upgrade and frame handling
└── test/
    ├── board.test.mjs
    ├── presence.test.mjs
    └── server.test.mjs
```

No runtime packages are required. `src/websocket.mjs` implements the subset used by browser clients: upgrade validation, masked text frames, ping/pong, close frames, payload limits, and protocol errors. It deliberately rejects fragmented and binary messages instead of pretending to support them.

## Protocol

The browser connects to `/ws?token=...` with subprotocol `live-board.v1`.

The first client message is:

```json
{
  "type": "hello",
  "clientId": "stable-browser-id",
  "name": "Agent 7",
  "lastSequence": 12
}
```

`lastSequence: null` requests a full snapshot. A known sequence requests only later events. A sequence ahead of the server also receives a snapshot because the client projection cannot be trusted after server data loss or replacement.

Moves include a command ID and the version the user saw:

```json
{
  "type": "move",
  "commandId": "c741bb5e-3b98-45e2-ae5d-31903e839181",
  "cardId": "issue-1042",
  "column": "resolved",
  "expectedVersion": 3
}
```

The server returns one ordered `card.moved` event or a structured rejection. Reusing the command ID with the same normalized input returns `command.ack` and the original event. Reusing it with different input returns `IDEMPOTENCY_CONFLICT`. A stale card version returns `STALE_VERSION` plus the current card so the browser can reconcile.

Presence is separate from board history. A heartbeat renews a client lease; silence lets it expire. Disconnect does not append a board event or delete issue data.

## Storage boundary

The starter is intentionally process-local:

- `EventJournal` owns ordered board events.
- `CommandLedger` owns successful command results.
- `PresenceTracker` owns temporary leases.
- `LiveBoard` owns the current card projection.

A process restart resets the server sequence and seed data. Browser clients detect that their saved sequence is ahead and accept a fresh snapshot. Production work should persist the event journal and command ledger atomically. Redis Streams can provide retained fan-out and consumer recovery; PostgreSQL can own board state, event sequence, and idempotency constraints. Redis Pub/Sub alone cannot recover missed events.

## Verify it

```bash
pnpm check:starter
```

The suite proves:

- accepted moves receive contiguous server sequences;
- duplicate commands return the original event without another mutation;
- command-key reuse with changed input is rejected;
- stale writes expose the current card version;
- presence expires under an injected clock;
- the HTTP server serves the board and health state;
- two WebSocket clients receive the same ordered event;
- a disconnected client resumes with only missed events;
- unauthenticated upgrades are rejected.
- malformed WebSocket control frames close with protocol error `1002`;
- reconnect attempts reset only after a valid server sync, and stored identities are validated before reuse.

Run the concurrency probe against the started server:

```bash
pnpm dev
# in another terminal
pnpm load
```

The probe reports successful connections, failures, elapsed time, and connections per second. It is a local handshake/resume check, not a capacity benchmark.

## Work order

1. Read [`brief.md`](brief.md) for the product and failure model.
2. Run the app in two windows before changing it.
3. Read [`acceptance.md`](acceptance.md) and reproduce each check.
4. Use [`exercises.md`](exercises.md) to replace development-only boundaries.
5. Continue to [06 — Team SaaS](../06-team-saas/) after saving reconnect, duplicate-command, and load evidence.

## References

- [Realtime foundations playbook](../../learn/systems-devops/#level-1--realtime-foundations)
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [RFC 6455](https://www.rfc-editor.org/rfc/rfc6455)
- [AWS: Timeouts, retries, and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)
- [Redis Streams](https://redis.io/docs/latest/develop/data-types/streams/)
