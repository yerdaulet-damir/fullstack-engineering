# Exercises

1. Put the board behind an authenticated WebSocket endpoint.
2. Persist events and snapshots; restart the server during a move.
3. Add exponential backoff with jitter and a visible reconnect state.
4. Reject a command based on a stale card version, then let the client reconcile.
5. Expire presence without deleting any issue data.
