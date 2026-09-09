import { createHash } from "node:crypto";
import type { CopilotEvent, RetrievalTool, SupportModel } from "./contracts.js";

function runIdFor(query: string): string {
  return createHash("sha256").update(query).digest("hex").slice(0, 12);
}

function chunks(value: string, size = 24): string[] {
  const result: string[] = [];
  for (let offset = 0; offset < value.length; offset += size) result.push(value.slice(offset, offset + size));
  return result;
}

export class SupportCopilot {
  constructor(
    private readonly retrieval: RetrievalTool,
    private readonly model: SupportModel,
  ) {}

  async *run(query: string): AsyncGenerator<CopilotEvent> {
    const runId = runIdFor(query);
    yield { type: "run.started", runId, query };
    yield { type: "retrieval.started", runId };
    const evidence = await this.retrieval.search({ query, limit: 3 });
    yield { type: "retrieval.completed", runId, evidence };
    const output = await this.model.generate({ query, evidence });
    for (const delta of chunks(output.answer)) yield { type: "response.delta", runId, delta };
    yield { type: "response.completed", runId, output };
  }

  async answer(query: string) {
    let completed: Extract<CopilotEvent, { type: "response.completed" }> | undefined;
    for await (const event of this.run(query)) {
      if (event.type === "response.completed") completed = event;
    }
    if (!completed) throw new Error("Copilot stream ended without a completed response");
    return completed.output;
  }
}
