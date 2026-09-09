import assert from "node:assert/strict";
import test from "node:test";
import { createMcpToolDefinition, type McpClientBoundary } from "../src/mcp-adapter.js";

test("MCP adapter forwards validated arguments and execution metadata", async () => {
  const calls: Parameters<McpClientBoundary["callTool"]>[0][] = [];
  const client: McpClientBoundary = {
    async callTool(input) {
      calls.push(input);
      return { structuredContent: { ticketId: "ticket-1" } };
    }
  };
  const definition = createMcpToolDefinition({
    client,
    name: "ticket.close",
    kind: "write",
    description: "Close a support ticket",
    inputSchema: { type: "object" },
    validate(value) {
      const input = value as { ticketId: string };
      return { ticketId: input.ticketId };
    }
  });

  const result = await definition.execute(
    definition.validate({ ticketId: "ticket-1" }),
    { workflowId: "workflow-1", executionKey: "execution-1" }
  );
  assert.deepEqual(result, { ticketId: "ticket-1" });
  assert.deepEqual(calls, [
    {
      name: "ticket.close",
      arguments: { ticketId: "ticket-1" },
      metadata: { workflowId: "workflow-1", executionKey: "execution-1" }
    }
  ]);
});

test("MCP error results become retryable operator failures", async () => {
  const definition = createMcpToolDefinition({
    client: { async callTool() { return { isError: true, content: { message: "offline" } }; } },
    name: "account.lookup",
    kind: "read",
    description: "Read account",
    inputSchema: { type: "object" },
    validate() { return {}; }
  });

  await assert.rejects(() => definition.execute({}, { workflowId: "workflow-1" }), (error: unknown) => {
    return error instanceof Error && error.message.includes("returned an error");
  });
});
