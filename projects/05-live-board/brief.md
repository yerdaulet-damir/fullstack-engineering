# Product brief

## Product

Build a live support board used by agents triaging the same queue. Cards move through `unassigned`, `investigating`, `waiting`, and `resolved`. Each open browser shows connection state, the latest server sequence, pending commands, and active agents.

## User problem

Support agents keep the board open for hours. Wi-Fi changes, laptops sleep, deploys close sockets, and two agents may act on the same card. The product must recover without silently losing a move or applying a retry twice.

## Authoritative model

The server owns card versions and one monotonic event sequence. Browser state is a projection of a snapshot plus later events. A local drag is a command, not truth, until the server emits the accepted event.

Each move carries a globally unique command ID, stable client ID, target card and column, and card version observed by the user.

Successful command IDs are retained with an input fingerprint and result. An identical retry returns the first event. Changed input under the same ID is rejected. A command based on an old card version is rejected with the current card.

## Recovery model

The browser persists its last complete projection and server sequence. Reconnect uses capped exponential backoff with full jitter. Opening TCP does not reset the attempt count; a valid server sync marks the session ready and resets it. On a new socket the browser sends its sequence:

- no local projection: return a snapshot;
- known sequence at or behind the server: return only later events;
- sequence ahead of the server: return a snapshot.

Events must arrive contiguously. If the browser sees a gap, it requests recovery from its last applied sequence instead of applying later state.

## Presence model

Presence is a renewable lease, not durable issue data. `hello` and heartbeat messages extend the lease. Closing or losing a connection does not immediately remove the agent; expiry handles half-open sockets and temporary reconnects. Presence changes never consume board sequence numbers.

## Local scope

The included starter uses one Node.js process and in-memory storage. It provides real HTTP and WebSocket behavior, but restart resets server data. The default query token is a development gate, not user authentication. Tests exercise the actual server protocol.

## Production extension

Persist board mutation, event append, and idempotency result in one transaction. Use PostgreSQL constraints for versions and command IDs. Use Redis Streams when several server instances need retained event fan-out and resume; use expiring Redis keys for shared presence. Do not use Redis Pub/Sub as the only event record.

## Out of scope

- Accounts, sessions, and authorization policy
- Durable database migrations
- Multi-region ordering
- Offline edits while the browser is closed
- Attachments, comments, search, and notifications
- A guarantee of exactly-once network delivery
