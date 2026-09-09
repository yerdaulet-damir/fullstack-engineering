# Applied AI Engineering Playbook

**Last verified:** 2026-09-09

This path teaches the engineering work around pretrained language models: contracts, retrieval, evaluation, permissions, failure recovery, and operational limits. It does not treat a successful chat demo as a finished system.

## Choose the Correct Track

### AI product engineering

Use this track when a product calls hosted or local pretrained models. The model is a probabilistic component inside a deterministic application boundary. You own input validation, context selection, tool permissions, state, observability, evaluation, cost, and recovery.

The core design rule is: **the model may propose; application code decides what is valid, authorized, executable, and complete.**

### Model building

Use the separate [model-building branch](#model-building-branch) when the work includes tokenizers, transformer internals, pretraining data, optimization, fine-tuning, distributed training, or post-training. These skills explain how models are made and adapted; they do not replace product engineering around a deployed model.

Most full-stack engineers should complete the product track first. Take the model-building branch when you need model research, training infrastructure, open-weight adaptation, or deeper performance analysis.

## Route by Level

| Level | Engineering focus | Exit project |
|---|---|---|
| 1 — Interface | API boundaries, streaming, structured output | Run the deterministic [Project 07 Support Copilot](../../projects/07-support-copilot/) and preserve its event contract |
| 2 — Grounding | Embeddings, retrieval, RAG, evals, prompt injection | Meet [Project 07 acceptance](../../projects/07-support-copilot/acceptance.md) with evidence-backed answers and adversarial fixtures |
| 3 — Action | Tools, bounded agents, MCP, permission boundaries | Implement the investigation and proposal states in [Project 08 Production Operator](../../projects/08-production-operator/) |
| 4 — Production | Durable execution, human approval, cost, latency, coding agents | Meet [Project 08 acceptance](../../projects/08-production-operator/acceptance.md), including replay-safe writes |
| Model branch | Tokenization, transformers, adaptation, training systems | Train, evaluate, and document a small model without confusing model loss with product quality |

For every level, use the same loop:

1. **Read** the protocol or primary documentation.
2. **Watch** one implementation-oriented explanation.
3. **Build** the smallest system that exposes the failure mode.
4. **Prove** behavior with fixtures, traces, measurements, or replay tests.

## Level 1 — APIs as Application Boundaries

An LLM API is not a text utility. It is an external, nondeterministic dependency with authentication, rate limits, versioned models, request identifiers, partial failures, and billable work. Put provider-specific code behind one boundary so the rest of the application depends on your types rather than a vendor response shape.

### Read

- [OpenAI Developer Quickstart](https://developers.openai.com/api/docs/quickstart) — **Official docs · Beginner.** Shows the current request path and SDK setup. **Exercise:** wrap one request in `generateAnswer(input): Promise<ModelResult>` and return usage plus request metadata instead of raw provider JSON.
- [OpenAI Responses API: create](https://developers.openai.com/api/reference/typescript/resources/responses/methods/create) — **Official API reference · Intermediate.** Defines the exact request and response surface. **Exercise:** map provider errors into retryable, terminal, and caller-fault categories.
- [AI Engineering by Chip Huyen](https://www.oreilly.com/library/view/ai-engineering/9781098166298/) — **Book · Intermediate.** Connects model selection, evaluation, latency, cost, and production architecture. **Exercise:** write a one-page model dependency contract with quality, price, latency, privacy, and fallback requirements.

### Watch

- [Full Stack LLM Bootcamp](https://fullstackdeeplearning.com/llm-bootcamp/) — **Free recorded course · Intermediate.** The 2023 APIs are dated, but the product lifecycle, evaluation, deployment, and UX lessons remain useful. **Exercise:** choose one lecture and record which architectural claims still hold versus which provider details must be replaced.

### Build

Create a provider adapter with typed input, output, usage, timeout, cancellation, and error categories. Keep prompts and provider model names outside business logic. Add a fake adapter before adding a real provider.

### Prove

Run the same caller against the fake and real adapters. Prove that timeout, malformed response, quota failure, and provider refusal produce stable application-level outcomes.

## Level 1 — Streaming and Structured Output

Streaming is an event protocol, not repeated string concatenation. A useful stream distinguishes start, content delta, tool request, usage, error, and terminal completion. The consumer must handle cancellation, disconnects, duplicated events, and a stream that ends without a terminal event.

Structured output constrains syntax and shape; it does not make a claim true. Schema validation answers “does this object conform?” Grounding and evaluation answer “should the product trust it?”

### Read

- [OpenAI Streaming Responses](https://developers.openai.com/api/docs/guides/streaming-responses) — **Official docs · Intermediate.** Documents current streamed response events. **Exercise:** convert provider events into an internal discriminated union and reject unknown terminal states.
- [Server-Sent Events specification](https://html.spec.whatwg.org/multipage/server-sent-events.html) — **Web standard · Intermediate.** Defines framing, event IDs, retry behavior, and browser semantics. **Exercise:** expose an SSE endpoint that emits named events and closes only after a terminal event.
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) — **Official docs · Intermediate.** Shows schema-constrained model responses. **Exercise:** request a cited answer object and validate it again at the application boundary.
- [Anthropic Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — **Official docs · Intermediate.** Provides a second implementation of schema-constrained generation. **Exercise:** identify the smallest provider-neutral schema subset your adapter can support.

### Watch

- [Full Stack LLM Bootcamp](https://fullstackdeeplearning.com/llm-bootcamp/) — **Free video course · Intermediate.** Use the deployment and LLMOps lectures to place streaming inside a complete request lifecycle. **Exercise:** draw the path from browser disconnect to provider cancellation and usage accounting.

### Build

Extend [Project 07](../../projects/07-support-copilot/) with the HTTP SSE exercise in [its exercise list](../../projects/07-support-copilot/exercises.md). Keep ordered domain events even if a provider emits different event names. Add a structured final answer containing disposition, answer, citations, and refusal reason.

### Prove

Test event ordering, cancellation, provider error, missing terminal event, invalid structured output, and citation schema validity. A rendered answer is insufficient evidence; retain the event trace and parsed final object.

## Level 2 — Embeddings, Retrieval, and RAG

An embedding is a lossy vector representation used for similarity search. It is an index, not stored truth. Retrieval-augmented generation has two systems to evaluate separately:

1. **Retrieval:** did the system select the evidence needed to answer?
2. **Generation:** given sufficient evidence, did the model answer faithfully and cite it?

If these stages share one score, a retrieval miss and an unsupported generation failure look identical and lead to the wrong fix.

### Read

- [OpenAI Embeddings](https://developers.openai.com/api/docs/guides/embeddings) — **Official docs · Beginner–Intermediate.** Covers vector creation and common uses. **Exercise:** embed a small versioned corpus, store document IDs and versions beside vectors, and inspect nearest-neighbor failures.
- [OpenAI Retrieval](https://developers.openai.com/api/docs/guides/retrieval) — **Official docs · Intermediate.** Shows current retrieval primitives and ranking controls. **Exercise:** compare top-k retrieval with a score threshold and record abstention behavior.
- [Hands-On Large Language Models](https://www.oreilly.com/library/view/hands-on-large-language/9781098150952/) — **Book · Intermediate.** Explains embeddings, semantic search, transformers, and practical model use with visual intuition. **Exercise:** reproduce one embedding comparison with your own support-document corpus.

### Watch

- [RAG From Scratch playlist](https://www.youtube.com/playlist?list=PLfaIDFEXuae2LXbO1_PKyVJiQ23ZztA0x) — **Video playlist · Intermediate.** Builds retrieval, query transformation, routing, and corrective patterns from first principles. **Exercise:** implement only the baseline retrieval pipeline before adding query rewriting or routing.

### Build

- [RAG From Scratch repository](https://github.com/langchain-ai/rag-from-scratch) — **GitHub repository · Intermediate.** Provides runnable notebooks paired with the playlist. **Exercise:** port one notebook concept into typed application code without importing an agent framework.
- [pgvector](https://github.com/pgvector/pgvector) — **GitHub repository and database extension · Intermediate.** Keeps vectors, metadata, filters, and relational data in PostgreSQL. **Exercise:** add tenant and document-version filters, then prove no cross-tenant retrieval occurs.
- Complete hybrid retrieval in [Project 07 exercises](../../projects/07-support-copilot/exercises.md) while preserving its `RetrievalTool` contract.

### Prove

Maintain a retrieval fixture set with expected relevant document IDs. Report recall at k, irrelevant-context rate, answer correctness given gold evidence, citation accuracy, and no-evidence abstention. Include version conflicts and near-duplicate documents.

## Level 2 — Evals as Executable Product Contracts

An eval set turns product claims into repeatable tests. Start with named failure cases, not one aggregate score. Inspect errors before averaging them: a harmless wording mismatch, a missing citation, a leaked secret, and an unauthorized tool call do not have equal severity.

Use deterministic assertions for schemas, citations, permissions, event order, and exact side effects. Use model graders only for qualities that require judgment, calibrate them against human labels, and keep the grader prompt and model versioned.

### Read

- [OpenAI Evaluation Getting Started](https://developers.openai.com/api/docs/guides/evaluation-getting-started) — **Official docs · Intermediate.** Introduces datasets, graders, and eval runs. **Exercise:** define pass criteria before collecting outputs, then create a small regression dataset.
- [AI Engineering by Chip Huyen](https://www.oreilly.com/library/view/ai-engineering/9781098166298/) — **Book · Intermediate.** Treats evaluation as the center of AI product development rather than final QA. **Exercise:** build an error taxonomy and assign each class an owner and release threshold.

### Watch

- [Full Stack LLM Bootcamp](https://fullstackdeeplearning.com/llm-bootcamp/) — **Free recorded course · Intermediate.** Its evaluation material gives a practical lifecycle despite dated provider examples. **Exercise:** convert one subjective quality claim into a labeled dataset and scoring rubric.

### Build

- [OpenAI Evals](https://github.com/openai/evals) — **GitHub repository · Intermediate–Advanced.** Demonstrates eval registries and model-output evaluation patterns. **Exercise:** implement one custom deterministic evaluator before trying a model grader.
- [Promptfoo](https://github.com/promptfoo/promptfoo) — **GitHub repository and CLI · Beginner–Intermediate.** Supports repeatable prompt, model, RAG, and red-team comparisons. **Exercise:** compare two prompt or retrieval versions against the same fixtures and fail on a safety regression.
- Expand [Project 07](../../projects/07-support-copilot/) to at least the eight fixtures required by [its acceptance criteria](../../projects/07-support-copilot/acceptance.md).

### Prove

Check the eval dataset into version control. Publish per-case results, category scores, changed failures, grader configuration, model identifier, and cost. Block releases on critical regressions rather than a single mean score.

## Level 2 — Prompt Injection and Trust Boundaries

Prompt injection is an authorization problem expressed through language. Retrieved text, web pages, emails, and tool output are untrusted data even when they contain instructions. A system prompt cannot turn untrusted text into trusted policy.

The application must keep permissions outside model context, minimize available tools, validate arguments, isolate secrets, require approval for consequential writes, and treat model output as a proposal. Detection can reduce risk; it cannot establish authorization.

### Read

- [OWASP LLM01: Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) — **Security reference · Beginner–Intermediate.** Defines direct, indirect, multimodal, and obfuscated injection risks. **Exercise:** create one fixture for each injection path your application accepts.
- [Anthropic: Mitigate jailbreaks and prompt injections](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks) — **Official docs · Intermediate.** Lists layered mitigations and their limits. **Exercise:** map each mitigation to prevention, detection, containment, or recovery.

### Watch

- [Building more effective AI agents](https://www.youtube.com/watch?v=uhJJgc-0iTQ) — **Anthropic video · Intermediate.** Shows how simple, inspectable agent patterns outperform unnecessary autonomy. **Exercise:** identify every point where untrusted model output crosses into deterministic code.

### Build

- [garak](https://github.com/NVIDIA/garak) — **GitHub repository and scanner · Advanced.** Probes model and application behavior for known failure classes. **Exercise:** run relevant probes against a non-production target and convert confirmed failures into local regression fixtures.
- Add direct user injection and malicious-document fixtures to [Project 07](../../projects/07-support-copilot/). The retrieved document must not alter policy, suppress citations, or grant tools.

### Prove

Write a trust-boundary diagram and an authorization matrix. Demonstrate that malicious text cannot expand tool access, reveal secrets, bypass citation requirements, or turn a read flow into a write flow.

## Level 3 — Tools and Bounded Agents

A tool-calling model chooses a proposed function and arguments. The application validates the schema, authenticates the actor, authorizes the operation, executes code, records the result, and decides what returns to the model.

An agent is a bounded control loop around that mechanism. It needs explicit state, stop conditions, step and cost budgets, allowed transitions, and a terminal outcome. Adding a loop without these controls creates an expensive source of nondeterministic retries.

### Read

- [OpenAI Function Calling](https://developers.openai.com/api/docs/guides/function-calling) — **Official docs · Intermediate.** Defines current tool schemas and call handling. **Exercise:** reject unknown tools, additional arguments, and values outside business constraints.
- [Anthropic Tool Use](https://platform.claude.com/docs/claude/docs/tool-use) — **Official docs · Intermediate.** Shows client and server tool flows from a second provider. **Exercise:** normalize both providers into one internal `ToolProposal` type.
- [OpenAI Agents SDK Quickstart](https://openai.github.io/openai-agents-python/quickstart/) — **Official docs · Intermediate.** Introduces agents, tools, handoffs, and traces. **Exercise:** implement one single-agent workflow before adding handoffs.

### Watch

- [Building more effective AI agents](https://www.youtube.com/watch?v=uhJJgc-0iTQ) — **Anthropic video · Intermediate.** Distinguishes workflows from agents and favors the simplest sufficient pattern. **Exercise:** replace one proposed autonomous loop with deterministic routing and compare failure surfaces.

### Build

- [Hugging Face Agents Course](https://huggingface.co/learn/agents-course/en/unit0/introduction) — **Free course · Beginner–Intermediate.** Teaches agent fundamentals, frameworks, use cases, and evaluation. **Exercise:** implement the same two-tool task once manually and once with a framework, then compare trace clarity.
- [OpenAI Agents SDK for Python](https://github.com/openai/openai-agents-python) — **GitHub repository · Intermediate.** Provides a small production-oriented agent runtime with tracing and guardrails. **Exercise:** cap turns, tool calls, and total elapsed time.
- Start [Project 08](../../projects/08-production-operator/) with separate investigate, propose, await-approval, execute, and complete states.

### Prove

Test unauthorized tools, invalid arguments, repeated calls, exhausted budgets, tool timeouts, and model attempts to skip states. Store a trace showing that policy decisions came from application code rather than prompt text.

## Level 3 — MCP Without Accidental Trust

The Model Context Protocol standardizes how clients discover and invoke tools, resources, and prompts. It reduces integration-specific plumbing; it does not certify a server, sanitize returned content, authorize a user, or make a write safe.

Treat every MCP server as a separate security principal. Pin or approve server configuration, expose the minimum capability set, validate tool results, separate read and write credentials, and show users which server will perform a consequential action.

### Read

- [Model Context Protocol specification — latest](https://modelcontextprotocol.io/specification/latest) — **Official specification · Intermediate–Advanced.** Defines the current protocol, lifecycle, transports, and capabilities. **Exercise:** trace initialize, capability negotiation, tool discovery, invocation, and shutdown for one client-server pair.
- [Hugging Face MCP Course](https://huggingface.co/learn/context-course/en/unit0/introduction) — **Free course · Intermediate.** Teaches MCP concepts, servers, clients, and deployment. **Exercise:** build a local read-only server before exposing any mutation.

### Watch

- Use the video units embedded in the [Hugging Face MCP Course](https://huggingface.co/learn/context-course/en/unit0/introduction) — **Course videos · Intermediate.** They pair protocol concepts with implementations. **Exercise:** annotate which checks belong to the MCP client, server, application, and identity provider.

### Build

- [Model Context Protocol servers](https://github.com/modelcontextprotocol/servers) — **GitHub repository · Intermediate.** Contains educational reference servers; the repository explicitly does not present them as production-ready. **Exercise:** adapt one server to expose a single allowlisted read operation with schema validation and audit logging.
- Complete the real MCP server extension in [Project 08 exercises](../../projects/08-production-operator/exercises.md): one read tool and one write tool with distinct permissions.

### Prove

Demonstrate server allowlisting, capability minimization, read/write credential separation, schema rejection, timeout handling, audit records, and user-visible server identity before approval.

## Level 4 — Durable Workflows and Human Approval

Long-running AI work must survive process crashes, provider outages, delayed approval, and retries. Persist explicit workflow state rather than relying on conversation history. Every external write needs an idempotency key and a recorded result so replay after a crash does not repeat the side effect.

Human approval must bind the exact operation: tool, normalized arguments, target resource, evidence, expected effect, and expiry. If arguments change after approval, the approval is invalid. “Approve the agent” is not an enforceable control.

### Read

- [OpenAI Agents SDK: Human-in-the-loop](https://openai.github.io/openai-agents-python/human_in_the_loop/) — **Official docs · Intermediate.** Covers interrupted runs, approvals, rejections, and resumed state. **Exercise:** serialize a pending approval and resume it in a new process.
- [LangGraph interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts) — **Official docs · Intermediate.** Explains pause-and-resume workflow execution. **Exercise:** pause before a write and prove replay begins from persisted state rather than regenerating the proposal.

### Watch

- [Temporal AI Agents Workshop](https://github.com/temporal-community/ai-agents-workshop-python) — **Workshop repository · Intermediate–Advanced.** Uses exercises to teach durable agent execution. **Exercise:** follow the activity retry section and identify which operations require idempotency.

### Build

- [Temporal integration for OpenAI Agents](https://github.com/temporalio/sdk-python/blob/main/temporalio/contrib/openai_agents/README.md) — **GitHub integration guide · Advanced.** Shows how agent runs can execute inside durable workflows. **Exercise:** persist workflow state and inject a crash after an external write but before workflow completion.
- Implement [Project 08](../../projects/08-production-operator/) according to its [brief](../../projects/08-production-operator/brief.md), then complete transactional persistence, argument-change rejection, cancellation, timeout, and cost-ceiling exercises from [the exercise list](../../projects/08-production-operator/exercises.md).

### Prove

Run a crash-recovery test that records one external write, crashes before completion, resumes, and returns the recorded result without a second write. Show that stale, expired, rejected, or argument-mismatched approvals cannot execute.

## Level 4 — Cost and Latency Engineering

Optimize **cost per successful task**, not price per token. A cheap model that causes retries, escalations, or incorrect actions can cost more. Measure input tokens, output tokens, cached tokens, retrieval work, tool calls, retries, and evaluator spend by task and outcome.

Optimize latency by stage and percentile. Time to first useful event, retrieval latency, tool latency, generation latency, and p95 end-to-end time reveal different bottlenecks. Streaming improves perceived latency but does not reduce total compute by itself.

### Read

- [OpenAI Latency Optimization](https://developers.openai.com/api/docs/guides/latency-optimization) — **Official docs · Intermediate.** Covers model choice, token reduction, parallelization, streaming, and request design. **Exercise:** instrument stage timings before changing the architecture.
- [OpenAI Cost Optimization](https://developers.openai.com/api/docs/guides/cost-optimization) — **Official docs · Intermediate.** Covers model selection and token-efficiency strategies. **Exercise:** create a per-task cost budget and a hard ceiling for agent loops.

### Watch

- [Full Stack LLM Bootcamp](https://fullstackdeeplearning.com/llm-bootcamp/) — **Free recorded course · Intermediate.** Use the deployment and LLMOps material as conceptual guidance, then verify every provider-specific claim against current docs. **Exercise:** produce a latency waterfall for one complete user task.

### Build

- [OpenAI Cookbook](https://github.com/openai/openai-cookbook) — **GitHub examples · Beginner–Advanced.** Contains current recipes for API patterns, evals, retrieval, and optimization. **Exercise:** adapt one optimization recipe and benchmark it against an unchanged baseline.
- [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook) — **GitHub notebooks · Beginner–Advanced.** Provides provider-specific examples for prompting, tools, retrieval, and evaluation. **Exercise:** reproduce one workflow through your provider-neutral adapter.
- Add per-run limits to [Project 08](../../projects/08-production-operator/): maximum model calls, tool calls, elapsed time, and estimated cost.

### Prove

Publish a benchmark from a fixed commit, dataset, model configuration, and concurrency level. Report task success, p50 and p95 latency, time to first useful event, tokens, tool calls, retries, and cost per successful task.

## Level 4 — AI-Assisted Coding and Coding Agents

Coding agents are most reliable when the task has a bounded contract: repository scope, allowed files, acceptance criteria, verification commands, and explicit non-goals. The minimum trustworthy loop is **inspect, edit, verify, review the diff**. Chat output is not proof that code works.

Keep repository instructions versioned near the code. Start agents from the same commit when comparing them, provide the same prompt and tests, and score the resulting repository state rather than conversational confidence.

### Read

- [Codex CLI](https://learn.chatgpt.com/docs/codex/cli) — **Official docs · Beginner–Intermediate.** Covers local agent workflows, approvals, and command-line use. **Exercise:** assign a one-file change with an explicit verification command and inspect the final diff.
- [Codex `AGENTS.md`](https://learn.chatgpt.com/docs/agent-configuration/agents-md) — **Official docs · Intermediate.** Defines repository-scoped instructions for Codex. **Exercise:** write a short instruction file containing only commands, boundaries, and conventions that can be checked.
- [Claude Code common workflows](https://code.claude.com/docs/en/common-workflows) — **Official docs · Beginner–Intermediate.** Covers codebase exploration, bug fixing, testing, planning, and automation. **Exercise:** ask the agent to explain the relevant execution path before authorizing edits.
- [GitHub Copilot best practices](https://docs.github.com/en/copilot/get-started/best-practices) — **Official docs · Beginner.** Explains context, prompt scope, review, and validation. **Exercise:** split one broad feature request into independently verifiable prompts.
- [Cursor quickstart](https://cursor.com/docs/get-started/quickstart) and [Cursor rules](https://cursor.com/docs/rules) — **Official docs · Beginner–Intermediate.** Cover agent use and persistent project instructions. **Exercise:** add one narrowly scoped rule and test whether it improves behavior without suppressing necessary exploration.

### Watch

- Use the official walkthroughs embedded in the Codex, Claude Code, Copilot, and Cursor documentation above — **Product videos · Beginner.** Interfaces change faster than engineering principles. **Exercise:** record the product’s permission modes, context controls, and verification path rather than memorizing button locations.

### Build

Give each coding agent the same small repository task from the same commit. Include allowed files, acceptance criteria, required tests, and a prohibition on unrelated edits. Save the prompt, diff, command log, and test result.

### Prove

Review correctness, scope discipline, test quality, security, maintainability, and time-to-verified-result. Reject runs with passing prose but failing checks, hidden unrelated edits, weakened tests, or unverified assumptions.

## Project Milestones

### Milestone 1 — Deterministic support baseline

- Read the [Project 07 brief](../../projects/07-support-copilot/brief.md), [acceptance criteria](../../projects/07-support-copilot/acceptance.md), and [exercises](../../projects/07-support-copilot/exercises.md).
- Preserve the fake model and local versioned corpus first. This isolates retrieval, citations, refusal behavior, and event ordering from provider variance.
- Run from `projects/07-support-copilot/starter`:

```bash
pnpm install
pnpm dev -- "How do I reset my password?"
pnpm check:starter
```

- **Proof:** tests cover retrieval ranking, no-evidence refusal, citations, ordered events, and at least eight fixtures including user and document injection.

### Milestone 2 — Provider-backed support copilot

- Add a provider behind the existing model boundary; do not leak SDK types into retrieval or presentation code.
- Add validated structured output, an HTTP SSE endpoint, hybrid retrieval, and a v2 corpus while retaining v1.
- **Proof:** compare the deterministic baseline and provider-backed system on the same fixtures. Report retrieval changes separately from generation changes.

### Milestone 3 — Controlled production operator

- Read the [Project 08 brief](../../projects/08-production-operator/brief.md), [acceptance criteria](../../projects/08-production-operator/acceptance.md), and [exercises](../../projects/08-production-operator/exercises.md).
- Implement explicit workflow states. Investigation may read; execution may write only after an approval record binds the exact tool arguments and evidence.
- **Proof:** unauthorized transitions fail, changed arguments invalidate approval, and replaying an execution key returns the recorded result.

### Milestone 4 — Durable operator extension

- Add transactional persistence, one read-only MCP tool, one write MCP tool, cancellation, timeout, and a per-run cost ceiling.
- Inject a crash after the external write and before completion.
- **Proof:** resume from serialized state without repeating the write. Complete the runbook cases required by [Project 08 acceptance](../../projects/08-production-operator/acceptance.md): provider outage, cost spike, bad release, and rollback.

## Model-Building Branch

This branch explains model internals and training. Keep its proof artifacts separate from product evals: lower training loss does not prove grounded answers, safe tool use, durable execution, or acceptable product cost.

### Foundation level — Tokenization and transformers

#### Read

- [Build a Large Language Model (From Scratch) by Sebastian Raschka](https://www.manning.com/books/build-a-large-language-model-from-scratch) — **Book · Intermediate.** Implements the complete path from text preparation through pretraining and fine-tuning. **Exercise:** build the tokenizer and attention components, then document tensor shapes and parameter counts.

#### Watch

- [Neural Networks: Zero to Hero](https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ) — **Video course · Beginner–Intermediate.** Builds neural networks and language models from basic operations. **Exercise:** reimplement one lesson without copying the final notebook.
- [Let’s build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY) — **Video · Intermediate.** Builds a GPT-style model while explaining attention and autoregressive generation. **Exercise:** add a validation split and plot overfitting rather than reporting training loss alone.

#### Build

Train a small character- or subword-level transformer on a permitted dataset. Record tokenizer, context length, architecture, parameter count, optimizer, seed, hardware, and training time.

#### Prove

Report train and validation loss, held-out samples, reproducibility limits, and one ablation such as context length or model width. Do not claim product readiness from plausible samples.

### Adaptation level — Open models and fine-tuning

#### Read

- [Hands-On Large Language Models](https://www.oreilly.com/library/view/hands-on-large-language/9781098150952/) — **Book · Intermediate.** Covers representation, generation, fine-tuning, and practical open-model workflows. **Exercise:** compare prompting and parameter-efficient adaptation on the same labeled task.
- [Hugging Face LLM Course](https://huggingface.co/learn/llm-course/en/chapter1/1) — **Free course · Beginner–Intermediate.** Teaches Transformers, Datasets, Tokenizers, fine-tuning, and sharing models. **Exercise:** fine-tune a small model with a documented dataset split and baseline.

#### Watch

- Use the videos and notebooks linked throughout the [Hugging Face LLM Course](https://huggingface.co/learn/llm-course/en/chapter1/1) — **Course media · Beginner–Intermediate.** They pair library mechanics with conceptual lessons. **Exercise:** explain which preprocessing decisions change the training distribution.

#### Build

Adapt a small open model with a reproducible script. Keep raw data, transformed data, train/validation/test splits, checkpoint configuration, and license notes explicit.

#### Prove

Compare the base and adapted model on a held-out set and regression set. Report quality by category, training cost, inference cost, and regressions; include examples where fine-tuning harmed general behavior.

### Systems level — Pretraining and scaling mechanics

#### Read

- [Stanford CS336: Language Modeling from Scratch](https://cs336.stanford.edu/) — **University course · Advanced.** Covers tokenization, architectures, optimization, systems, scaling, data, and alignment through implementation-heavy assignments. **Exercise:** complete the tokenizer and transformer assignments with profiling enabled.

#### Watch

- [Stanford CS336 lecture playlist](https://www.youtube.com/playlist?list=PLoROMvodv4rMqXOcazWaTUHhq-yembLCV) — **University lecture playlist · Advanced.** Provides the conceptual sequence behind the course assignments. **Exercise:** produce a compute and memory estimate before running one training experiment.
- [Let’s reproduce GPT-2 (124M)](https://www.youtube.com/watch?v=l8pRSuU81PU) — **Video · Advanced.** Walks through a compact GPT-2 reproduction and performance work. **Exercise:** profile tokens per second before and after one justified optimization.

#### Build

- [build-nanogpt](https://github.com/karpathy/build-nanogpt) — **GitHub repository · Advanced.** Provides the progression used in the GPT-2 reproduction. **Exercise:** reproduce one tagged step, pin the environment, and explain every optimization that changes throughput or numerics.

#### Prove

Report hardware, precision, batch construction, effective tokens per update, throughput, utilization estimate, checkpoint behavior, validation loss, and divergence recovery. A faster run is not valid if numerics or evaluation changed silently.

## Evidence Required Before Calling a System Production-Ready

- **Behavior:** a versioned eval set with named failure categories and release thresholds.
- **Grounding:** retrieval metrics, citation checks, no-evidence abstention, and document-version tests.
- **Security:** a trust-boundary diagram, tool authorization matrix, injection fixtures, and secret-isolation checks.
- **Control:** explicit workflow states, bounded loops, exact approvals, idempotency keys, and replay tests.
- **Operations:** traces, request IDs, model and prompt versions, p50/p95 latency, cost per successful task, and runbooks.
- **Change discipline:** fixed inputs for comparisons, reviewed diffs, independent verification, and no weakened tests.

## Resource Maintenance

- Treat official specifications and provider docs as the source of truth for current APIs.
- Keep the MCP link on `/specification/latest`; record the dated specification version used by an implementation.
- Label older courses by year when their APIs have aged. The Full Stack LLM Bootcamp remains useful for concepts but should not override current provider docs.
- Re-run links and re-check model, SDK, protocol, and security guidance at least quarterly.
- Pin repository commits or release tags for exercises so learners can reproduce results after upstream changes.
