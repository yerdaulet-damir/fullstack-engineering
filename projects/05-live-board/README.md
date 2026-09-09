# 05 — Live Board

The same issue board now has concurrent writers. The starter implements the server rules; your work is to connect transport, persistence, and a browser interface without losing those rules.

```bash
cd starter
pnpm install
pnpm check:starter
pnpm dev
```

Start with [`brief.md`](brief.md), then make every check in [`acceptance.md`](acceptance.md) reproducible from two browser sessions.

## Open while building

- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) for the browser connection lifecycle.
- [WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455) when transport behavior is unclear.
- [AWS retries and backoff](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) for bounded retries and jitter.
- [Redis Streams](https://redis.io/docs/latest/develop/data-types/streams/) when lost Pub/Sub messages are unacceptable.

After reconnect and two-browser checks pass, continue to [06 — multi-tenant team SaaS](../06-team-saas/).
