# AI-assisted development loop

AI makes implementation cheaper. It does not remove the need to define behavior, inspect a system, or own a change.

## 1. Write the task contract

Put this in the issue or prompt:

```text
Goal:
User-visible behavior:
Inputs and outputs:
Constraints:
Files or systems that may change:
Files or systems that must not change:
Acceptance command:
Known failure cases:
```

If you cannot fill this in, ask the agent to investigate and report evidence before asking it to edit.

## 2. Make the agent inspect first

Ask for the smallest relevant map: entry point, data flow, tests, runtime constraints, and existing conventions. Reject plans that introduce a second architecture beside the existing one.

## 3. Cut a reviewable change

- One behavior per change.
- Prefer existing dependencies and patterns.
- Ask for tests before broad refactors.
- Keep generated migrations separate from hand-written application changes.
- Stop when the diff becomes too large to explain file by file.

## 4. Verify outside the chat

Run types and targeted tests. Then use the application. Inspect network requests, database changes, logs, accessibility tree, and failure states. An agent saying “tests pass” is not evidence.

## 5. Review for agent-shaped mistakes

- Invented APIs or configuration keys.
- Happy-path-only UI.
- Authorization performed only in the client.
- Catch blocks that hide failure.
- Duplicate helpers and unnecessary abstractions.
- Tests that only assert mocks.
- Destructive commands presented as setup.
- Prompt text used where deterministic code is required.

## 6. Keep an assumption log

After each project, record three wrong assumptions made by you or the agent. Turn recurring mistakes into repository rules, tests, or scripts. Better context is useful only when it changes future behavior.

## Safe autonomy levels

| Level | Agent may do | Human keeps |
|---|---|---|
| Suggest | Inspect, explain, propose a diff | All edits and commands |
| Implement | Edit code and run local checks | Review, merge, deployment |
| Operate preview | Deploy preview and inspect telemetry | Production access and data |
| Production assist | Prepare a reversible action | Final approval and rollback decision |

Do not give a coding agent authority to merge, deploy, mutate production data, and approve the result in the same loop.
