import type { JsonValue, ToolContext, ToolDefinition, ToolKind } from "./contracts.js";
import { OperatorError } from "./errors.js";

export class ToolRegistry {
  #definitions = new Map<string, ToolDefinition>();

  constructor(definitions: ToolDefinition[] = []) {
    for (const definition of definitions) this.register(definition);
  }

  register(definition: ToolDefinition): void {
    if (this.#definitions.has(definition.name)) {
      throw new OperatorError("DUPLICATE_TOOL", `Tool ${definition.name} is already registered`, 500);
    }
    this.#definitions.set(definition.name, definition);
  }

  describe(): Array<Pick<ToolDefinition, "name" | "kind" | "description" | "inputSchema">> {
    return [...this.#definitions.values()].map(({ name, kind, description, inputSchema }) => ({
      name,
      kind,
      description,
      inputSchema: structuredClone(inputSchema)
    }));
  }

  validate(name: string, kind: ToolKind, input: unknown): Record<string, JsonValue> {
    const definition = this.#get(name);
    if (definition.kind !== kind) {
      throw new OperatorError(
        kind === "read" ? "READ_TOOL_REQUIRED" : "WRITE_TOOL_REQUIRED",
        `${name} is not a ${kind} tool`,
        403
      );
    }
    return definition.validate(input);
  }

  async callRead(name: string, input: unknown, context: ToolContext): Promise<JsonValue> {
    const args = this.validate(name, "read", input);
    return this.#get(name).execute(args, context);
  }

  async callWrite(name: string, input: unknown, context: ToolContext): Promise<JsonValue> {
    if (!context.executionKey) {
      throw new OperatorError("IDEMPOTENCY_KEY_REQUIRED", "Write tools require an execution key", 500);
    }
    const args = this.validate(name, "write", input);
    return this.#get(name).execute(args, context);
  }

  #get(name: string): ToolDefinition {
    const definition = this.#definitions.get(name);
    if (!definition) throw new OperatorError("TOOL_NOT_FOUND", `Tool ${name} is not registered`, 404);
    return definition;
  }
}
