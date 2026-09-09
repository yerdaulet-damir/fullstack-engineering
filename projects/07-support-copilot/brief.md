# Product brief

Build a support copilot that can answer product questions from approved documentation and refuse when retrieval provides no evidence.

The starter separates four concerns: a versioned corpus, a read-only retrieval tool, an untrusted model boundary, and an event-producing orchestration layer. The included model is deterministic. Replacing it must not give the model direct filesystem or tool access.

The browser interface must show when retrieval starts, which documents matched, how the answer streams, whether the result is grounded, and which run produced it. The interface is part of the debugging surface: a developer should be able to distinguish a retrieval failure from a generation failure without reading server logs.

The fixed eval set measures grounded answers, citations, refusal behavior, and prompt-injection handling. The HTTP test proves that evidence arrives before answer tokens. A provider-backed implementation must preserve these contracts rather than replacing them with provider-specific objects.
