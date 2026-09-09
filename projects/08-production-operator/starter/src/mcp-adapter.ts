import type { JsonValue, ToolDefinition, ToolKind } from "./contracts.js";
import { OperatorError } from "./errors.js";

export type McpCallResult = {
  isError?: boolean;
  structuredContent?: JsonValue;
  content?: JsonValue;
};

export interface McpClientBoundary {
  callTool(input: {
    name: string;
    arguments: Record<string, JsonValue>;
    metadata: { workflowId: string; executionKey?: string };
  }): Promise<McpCallResult>;
}

export function createMcpToolDefinition(input: {
  client: McpClientBoundary;
  name: string;
  kind: ToolKind;
  description: string;
  inputSchema: JsonValue;
  validate: (value: unknown) => Record<string, JsonValue>;
}): ToolDefinition {
  return {
    name: input.name,
    kind: input.kind,
    description: input.description,
    inputSchema: input.inputSchema,
    validate: input.validate,
    async execute(args, context) {
      const result = await input.client.callTool({
        name: input.name,
        arguments: args,
        metadata: { workflowId: context.workflowId, executionKey: context.executionKey }
      });
      if (result.isError) {
        throw new OperatorError("MCP_TOOL_FAILED", `MCP tool ${input.name} returned an error`, 502, true);
      }
      const value = result.structuredContent ?? result.content;
      if (value === undefined) {
        throw new OperatorError("MCP_INVALID_RESULT", `MCP tool ${input.name} returned no content`, 502);
      }
      return value;
    }
  };
}
