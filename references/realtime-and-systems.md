# Realtime and systems references

Open these when the failure in projects 05 or 06 requires them.

## Realtime delivery — project 05

- [WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455) — framing, closing, masking, and protocol behavior.
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) — browser connection lifecycle and backpressure limitations.
- [AWS retry guidance](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) — bounded retries, backoff, jitter, and retry amplification.
- [Redis Pub/Sub](https://redis.io/docs/latest/develop/pubsub/) — delivery semantics to understand before using it for events.
- [Redis Streams](https://redis.io/docs/latest/develop/data-types/streams/) — persisted event processing when Pub/Sub loss is unacceptable.

## Jobs and distributed state — project 06

- [Transactional Outbox pattern](https://microservices.io/patterns/data/transactional-outbox.html) — keep a database write and emitted work consistent without a distributed transaction.
- [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests) — a concrete production contract for safe retries.
- [OpenTelemetry traces](https://opentelemetry.io/docs/concepts/signals/traces/) — connect requests, queues, workers, and external calls.
- [Google SRE: Handling overload](https://sre.google/sre-book/handling-overload/) — backpressure and graceful degradation under load.
