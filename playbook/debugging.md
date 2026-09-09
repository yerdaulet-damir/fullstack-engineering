# Debugging loop

1. State the observed behavior without explaining it.
2. Write the smallest reproduction.
3. Mark the system boundary where expected and actual behavior diverge.
4. Add one piece of evidence: request, log, trace, query plan, DOM snapshot, or failing test.
5. Change one cause, not three symptoms.
6. Keep the reproduction as a regression test.

Useful questions:

- Is the browser state stale, or is the server state wrong?
- Did the request reach the server?
- Did authorization filter the correct resource?
- Did the transaction commit?
- Was the background job accepted, started, retried, or dropped?
- Is the AI failure retrieval, tool choice, model output, validation, or UI rendering?
- Can the same failure be reproduced without the model?
