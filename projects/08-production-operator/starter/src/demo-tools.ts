import type { JsonValue, ToolDefinition } from "./contracts.js";
import { OperatorError } from "./errors.js";
import { JsonRefundGateway } from "./refund-gateway.js";
import { ToolRegistry } from "./tool-registry.js";

function objectInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new OperatorError("INVALID_TOOL_ARGUMENTS", "Tool arguments must be an object", 422);
  }
  return input as Record<string, unknown>;
}

function exactKeys(input: Record<string, unknown>, keys: string[]): void {
  const unexpected = Object.keys(input).filter((key) => !keys.includes(key));
  if (unexpected.length > 0) {
    throw new OperatorError("INVALID_TOOL_ARGUMENTS", `Unexpected arguments: ${unexpected.join(", ")}`, 422);
  }
}

function requiredString(input: Record<string, unknown>, key: string, maxLength?: number): string {
  const value = input[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new OperatorError("INVALID_TOOL_ARGUMENTS", `${key} must be a non-empty string`, 422);
  }
  const normalized = value.trim();
  if (maxLength !== undefined && normalized.length > maxLength) {
    throw new OperatorError("INVALID_TOOL_ARGUMENTS", `${key} must be at most ${maxLength} characters`, 422);
  }
  return normalized;
}

export function createDemoToolDefinitions(gateway: JsonRefundGateway): ToolDefinition[] {
  return [
    {
      name: "account.lookup",
      kind: "read",
      description: "Read the current support account and recent duplicate-charge signal.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["accountId"],
        properties: { accountId: { type: "string", minLength: 1 } }
      },
      validate(input) {
        const object = objectInput(input);
        exactKeys(object, ["accountId"]);
        return { accountId: requiredString(object, "accountId") };
      },
      async execute(args) {
        return {
          accountId: String(args.accountId),
          status: "active",
          currency: "USD",
          duplicateChargeConfirmed: true,
          refundableBalanceCents: 10000
        };
      }
    },
    {
      name: "refund.issue",
      kind: "write",
      description: "Issue one refund through an idempotent external gateway.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["accountId", "amountCents", "reason"],
        properties: {
          accountId: { type: "string", minLength: 1 },
          amountCents: { type: "integer", minimum: 1, maximum: 10000 },
          reason: { type: "string", minLength: 1, maxLength: 200 }
        }
      },
      validate(input) {
        const object = objectInput(input);
        exactKeys(object, ["accountId", "amountCents", "reason"]);
        const amountCents = object.amountCents;
        if (!Number.isInteger(amountCents) || Number(amountCents) < 1 || Number(amountCents) > 10000) {
          throw new OperatorError("INVALID_TOOL_ARGUMENTS", "amountCents must be an integer from 1 to 10000", 422);
        }
        return {
          accountId: requiredString(object, "accountId"),
          amountCents: Number(amountCents),
          reason: requiredString(object, "reason", 200)
        };
      },
      async execute(args, context): Promise<JsonValue> {
        return gateway.issueRefund(args, context.executionKey!);
      }
    }
  ];
}

export function createDemoToolRegistry(gateway: JsonRefundGateway): ToolRegistry {
  return new ToolRegistry(createDemoToolDefinitions(gateway));
}
