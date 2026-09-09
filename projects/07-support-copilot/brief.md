# Brief

Build a support copilot that can answer product questions from approved documentation and refuse when retrieval provides no evidence.

The starter separates four concerns: a versioned corpus, a read-only retrieval tool, an untrusted model boundary, and an event-producing orchestration layer. The included model is deterministic. Replacing it must not give the model direct filesystem or tool access.

The fixed eval set measures grounded answers, citations, refusal behavior, and prompt-injection handling.
