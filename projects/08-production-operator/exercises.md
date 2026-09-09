# Exercises

1. Persist workflow and execution records transactionally.
2. Add a real MCP server exposing one read and one write tool.
3. Crash immediately after the external write but before workflow completion; prove the retry is deduplicated.
4. Reject approval when the proposed arguments changed after review.
5. Add cancellation, timeout, cost ceiling, and an incident runbook.
