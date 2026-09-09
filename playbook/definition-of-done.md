# Definition of done

A feature is done when another person can use it, its important failure paths are tested, and its behavior is visible in production.

## Product

- The user can complete the intended task without reading implementation notes.
- Empty, loading, error, permission-denied, and retry states are intentional.
- Copy names the action and consequence.

## Interface

- Keyboard navigation works in a sensible order.
- Focus is visible; labels and errors are programmatically connected.
- The layout works at 360, 768, and 1440 pixels.
- Slow network and reduced-motion settings do not break the task.

## Backend and data

- Inputs are validated at the boundary.
- Authorization is checked server-side on the resource being changed.
- Multi-step writes are transactional or compensating.
- Retries cannot duplicate a write.
- Logs include a request or job ID without leaking secrets.

## Delivery

- Types, tests, and migrations run in CI.
- Configuration differs by environment; secrets are not committed.
- Health checks describe dependency failure honestly.
- Rollback or forward-fix steps are written and tested once.

## AI behavior

- Model output is treated as untrusted input.
- Structured output is schema-validated.
- Tools are small, typed, and least-privileged.
- Risky writes require a human decision.
- Quality, latency, and cost are measured on a fixed eval set.
