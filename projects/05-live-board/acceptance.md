# Acceptance

- Every accepted operation receives a strictly increasing server sequence.
- Reusing an idempotency key returns the original event without applying it again.
- A stale client can request only the events it missed.
- Two clients converge after a forced disconnect and reconnect.
- Presence expires when a client stops renewing it.
- A local load script records the result of 100 concurrent connections.
