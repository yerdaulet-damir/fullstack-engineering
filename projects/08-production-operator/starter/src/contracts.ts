export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export const workflowStatuses = [
  "queued",
  "investigating",
  "awaiting_approval",
  "approved",
  "executing",
  "completed",
  "failed",
  "cancelled"
] as const;

export type WorkflowStatus = (typeof workflowStatuses)[number];

export type OperatorRequest = {
  accountId: string;
  issue: string;
  requestedAmountCents: number;
};

export type Evidence = {
  id: string;
  tool: string;
  observedAt: string;
  value: JsonValue;
};

export type Proposal = {
  id: string;
  tool: string;
  args: Record<string, JsonValue>;
  summary: string;
  evidenceIds: string[];
  createdAt: string;
};

export type Approval = {
  reviewerId: string;
  proposalDigest: string;
  approvedAt: string;
};

export type Rejection = {
  reviewerId: string;
  reason: string;
  rejectedAt: string;
};

export type WorkflowError = {
  code: string;
  message: string;
  phase: "investigation" | "execution";
  retryable: boolean;
  occurredAt: string;
};

export type WorkflowState = {
  id: string;
  status: WorkflowStatus;
  request: OperatorRequest;
  evidence: Evidence[];
  proposal: Proposal | null;
  proposalDigest: string | null;
  approval: Approval | null;
  rejection: Rejection | null;
  executionKey: string | null;
  result: JsonValue | null;
  lastError: WorkflowError | null;
  attempts: number;
  createdAt: string;
  updatedAt: string;
};

export type ExecutionRecord = {
  key: string;
  workflowId: string;
  proposalDigest: string;
  result: JsonValue;
  completedAt: string;
};

export type ToolKind = "read" | "write";

export type ToolContext = {
  workflowId: string;
  executionKey?: string;
};

export type ToolDefinition = {
  name: string;
  kind: ToolKind;
  description: string;
  inputSchema: JsonValue;
  validate: (input: unknown) => Record<string, JsonValue>;
  execute: (args: Record<string, JsonValue>, context: ToolContext) => Promise<JsonValue>;
};

export type PersistedOperatorData = {
  version: 1;
  workflows: Record<string, WorkflowState>;
  executions: Record<string, ExecutionRecord>;
};
