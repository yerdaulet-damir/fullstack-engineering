# Exercises

Each exercise replaces one explicit development boundary. Keep the existing protocol tests green and add failure evidence for the new behavior.

## 1. Real authentication and channels

Replace the query token with a signed HTTP session. Authorize the WebSocket upgrade against a project membership record, then bind each connection to allowed project channels. Prove that a valid user cannot subscribe to another project by changing a URL or message field.

## 2. Durable board transaction

Store cards, events, and command results in PostgreSQL. One transaction must compare the expected card version, update the card, allocate the next project sequence, append the event, and record the command result. Add unique constraints for `(project_id, sequence)` and `(project_id, command_id)`. Crash after each statement in a test and show that no partial move survives.

## 3. Redis-backed fan-out and presence

Run two HTTP/WebSocket server processes. Use Redis Streams to distribute retained board events between them and expiring Redis keys for shared presence. Reconnect a client to the other process and recover missed events. Explain why Pub/Sub alone fails this check.

## 4. Snapshot compaction

Create snapshots at a measured event interval and retain an event window for resume. If a client's sequence predates the retained window, send the snapshot plus later events. Verify snapshot sequence and event application produce the same card projection as a full replay.

## 5. Backpressure and slow consumers

Track queued socket bytes. Stop sending to a client above a warning threshold and close it above a hard limit with a documented code. Generate a slow consumer while another client continues moving cards. Prove server memory remains bounded and the slow client recovers after reconnect.

## 6. Reconnect fault matrix

Automate disconnects before command send, after send but before response, after event receipt, and during resume. Preserve command IDs across retries. For every point, assert one final board mutation and a contiguous client sequence.

## 7. Operational evidence

Add metrics for open sockets, connection attempts, resume mode, event lag, command rejection code, heartbeat expiry, and send-buffer pressure. Trace an HTTP session upgrade through one move. Define one alert tied to failed recovery, then trigger it and follow its runbook.
