import { randomUUID } from "node:crypto";
import { proposalDigest } from "./canonical.js";
import type {
  Evidence,
  ExecutionRecord,
  JsonValue,
  OperatorRequest,
  Proposal,
  WorkflowState,
  WorkflowStatus
} from "./contracts.js";
import { CrashAfterWriteError, OperatorError, toOperatorError } from "./errors.js";
import { FileOperatorStore } from "./store.js";
import { ToolRegistry } from "./tool-registry.js";

const transitions: Record<WorkflowStatus, WorkflowStatus[]> = {
  queued: ["investigating", "cancelled"],
  investigating: ["awaiting_approval", "failed", "cancelled"],
  awaiting_approval: ["approved", "cancelled"],
  approved: ["executing", "cancelled"],
  executing: ["completed", "failed"],
  completed: [],
  failed: ["queued", "approved", "cancelled"],
  cancelled: []
};

type Clock = () => string;

export class OperatorService {
  constructor(
    private readonly store: FileOperatorStore,
    private readonly tools: ToolRegistry,
    private readonly options: {
      now?: Clock;
      afterExternalWrite?: (workflow: WorkflowState, result: JsonValue) => Promise<void>;
    } = {}
  ) {}

  async create(request: OperatorRequest): Promise<WorkflowState> {
    if (!request.accountId.trim() || !request.issue.trim()) {
      throw new OperatorError("INVALID_REQUEST", "accountId and issue are required", 422);
    }
    if (request.issue.trim().length > 200) {
      throw new OperatorError("INVALID_REQUEST", "issue must be at most 200 characters", 422);
    }
    if (
      !Number.isInteger(request.requestedAmountCents) ||
      request.requestedAmountCents < 1 ||
      request.requestedAmountCents > 10000
    ) {
      throw new OperatorError("INVALID_REQUEST", "requestedAmountCents must be an integer from 1 to 10000", 422);
    }
    const now = this.#now();
    const workflow: WorkflowState = {
      id: randomUUID(),
      status: "queued",
      request: structuredClone(request),
      evidence: [],
      proposal: null,
      proposalDigest: null,
      approval: null,
      rejection: null,
      executionKey: null,
      result: null,
      lastError: null,
      attempts: 0,
      createdAt: now,
      updatedAt: now
    };
    await this.store.saveWorkflow(workflow);
    return structuredClone(workflow);
  }

  async get(id: string): Promise<WorkflowState> {
    return this.store.getWorkflow(id);
  }

  async list(): Promise<WorkflowState[]> {
    return this.store.listWorkflows();
  }

  async investigate(id: string): Promise<WorkflowState> {
    const workflow = await this.store.getWorkflow(id);
    this.#transition(workflow, "investigating");
    await this.#save(workflow);

    try {
      const value = await this.tools.callRead(
        "account.lookup",
        { accountId: workflow.request.accountId },
        { workflowId: workflow.id }
      );
      const evidence: Evidence = {
        id: randomUUID(),
        tool: "account.lookup",
        observedAt: this.#now(),
        value
      };
      workflow.evidence.push(evidence);
      workflow.lastError = null;
      await this.#save(workflow);
      return structuredClone(workflow);
    } catch (error) {
      await this.#fail(workflow, "investigation", error);
      throw error;
    }
  }

  async proposeRefund(id: string): Promise<WorkflowState> {
    const workflow = await this.store.getWorkflow(id);
    if (workflow.status !== "investigating") {
      throw new OperatorError("NOT_INVESTIGATING", "Workflow must be investigating before proposal", 409);
    }
    if (workflow.evidence.length === 0) {
      throw new OperatorError("EVIDENCE_REQUIRED", "A write proposal requires evidence", 409);
    }

    const args = this.tools.validate("refund.issue", "write", {
      accountId: workflow.request.accountId,
      amountCents: workflow.request.requestedAmountCents,
      reason: workflow.request.issue
    });
    const proposal: Proposal = {
      id: randomUUID(),
      tool: "refund.issue",
      args,
      summary: `Refund $${(workflow.request.requestedAmountCents / 100).toFixed(2)} to ${workflow.request.accountId}`,
      evidenceIds: workflow.evidence.map(({ id: evidenceId }) => evidenceId),
      createdAt: this.#now()
    };
    workflow.proposal = proposal;
    workflow.proposalDigest = proposalDigest(proposal);
    this.#transition(workflow, "awaiting_approval");
    await this.#save(workflow);
    return structuredClone(workflow);
  }

  async approve(id: string, reviewerId: string, expectedDigest: string): Promise<WorkflowState> {
    const workflow = await this.store.getWorkflow(id);
    if (workflow.status !== "awaiting_approval" || !workflow.proposal || !workflow.proposalDigest) {
      throw new OperatorError("NOT_AWAITING_APPROVAL", "Workflow is not awaiting approval", 409);
    }
    const currentDigest = proposalDigest(workflow.proposal);
    if (expectedDigest !== workflow.proposalDigest || currentDigest !== workflow.proposalDigest) {
      throw new OperatorError("PROPOSAL_CHANGED", "Approval does not match the exact current proposal", 409);
    }
    if (!reviewerId.trim()) throw new OperatorError("REVIEWER_REQUIRED", "reviewerId is required", 422);

    workflow.approval = { reviewerId: reviewerId.trim(), proposalDigest: currentDigest, approvedAt: this.#now() };
    this.#transition(workflow, "approved");
    await this.#save(workflow);
    return structuredClone(workflow);
  }

  async reject(id: string, reviewerId: string, reason: string): Promise<WorkflowState> {
    const workflow = await this.store.getWorkflow(id);
    if (workflow.status !== "awaiting_approval") {
      throw new OperatorError("NOT_AWAITING_APPROVAL", "Workflow is not awaiting approval", 409);
    }
    if (!reviewerId.trim() || !reason.trim()) {
      throw new OperatorError("REJECTION_DETAILS_REQUIRED", "reviewerId and reason are required", 422);
    }
    workflow.rejection = { reviewerId: reviewerId.trim(), reason: reason.trim(), rejectedAt: this.#now() };
    this.#transition(workflow, "cancelled");
    await this.#save(workflow);
    return structuredClone(workflow);
  }

  async cancel(id: string): Promise<WorkflowState> {
    const workflow = await this.store.getWorkflow(id);
    this.#transition(workflow, "cancelled");
    await this.#save(workflow);
    return structuredClone(workflow);
  }

  async execute(id: string): Promise<WorkflowState> {
    const workflow = await this.store.getWorkflow(id);
    if (workflow.status !== "approved" && workflow.status !== "executing") {
      throw new OperatorError("APPROVAL_REQUIRED", "Workflow must have an exact approval before execution", 409);
    }
    const { proposal, proposalDigest: storedDigest, approval } = workflow;
    if (!proposal || !storedDigest || !approval) {
      throw new OperatorError("APPROVAL_REQUIRED", "Proposal and approval are required", 409);
    }
    const currentDigest = proposalDigest(proposal);
    if (currentDigest !== storedDigest || approval.proposalDigest !== storedDigest) {
      throw new OperatorError("PROPOSAL_CHANGED", "Approved proposal changed before execution", 409);
    }

    const executionKey = workflow.executionKey ?? `${workflow.id}:${storedDigest}`;
    workflow.executionKey = executionKey;
    const recorded = await this.store.getExecution(executionKey);
    if (recorded) return this.#completeFromRecord(workflow, recorded);

    if (workflow.status === "approved") this.#transition(workflow, "executing");
    workflow.attempts += 1;
    await this.#save(workflow);

    try {
      const result = await this.tools.callWrite(proposal.tool, proposal.args, {
        workflowId: workflow.id,
        executionKey
      });
      await this.options.afterExternalWrite?.(structuredClone(workflow), structuredClone(result));
      const execution: ExecutionRecord = {
        key: executionKey,
        workflowId: workflow.id,
        proposalDigest: storedDigest,
        result,
        completedAt: this.#now()
      };
      await this.store.saveExecution(execution);
      return this.#completeFromRecord(workflow, execution);
    } catch (error) {
      if (error instanceof CrashAfterWriteError) throw error;
      await this.#fail(workflow, "execution", error);
      throw error;
    }
  }

  async retry(id: string): Promise<WorkflowState> {
    const workflow = await this.store.getWorkflow(id);
    if (workflow.status !== "failed" || !workflow.lastError?.retryable) {
      throw new OperatorError("NOT_RETRYABLE", "Workflow has no retryable failure", 409);
    }
    this.#transition(workflow, workflow.proposal && workflow.approval ? "approved" : "queued");
    workflow.lastError = null;
    await this.#save(workflow);
    return workflow.proposal && workflow.approval ? this.execute(workflow.id) : this.investigate(workflow.id);
  }

  async prepare(request: OperatorRequest): Promise<WorkflowState> {
    const created = await this.create(request);
    await this.investigate(created.id);
    return this.proposeRefund(created.id);
  }

  async #completeFromRecord(workflow: WorkflowState, execution: ExecutionRecord): Promise<WorkflowState> {
    workflow.result = structuredClone(execution.result);
    workflow.lastError = null;
    if (workflow.status === "executing") this.#transition(workflow, "completed");
    else if (workflow.status !== "completed") {
      throw new OperatorError("INVALID_TRANSITION", `Cannot complete workflow from ${workflow.status}`, 409);
    }
    await this.#save(workflow);
    return structuredClone(workflow);
  }

  async #fail(workflow: WorkflowState, phase: "investigation" | "execution", error: unknown): Promise<void> {
    const failure = toOperatorError(error);
    workflow.lastError = {
      code: failure.code,
      message: failure.message,
      phase,
      retryable: failure.retryable,
      occurredAt: this.#now()
    };
    this.#transition(workflow, "failed");
    await this.#save(workflow);
  }

  #transition(workflow: WorkflowState, next: WorkflowStatus): void {
    if (!transitions[workflow.status].includes(next)) {
      throw new OperatorError("INVALID_TRANSITION", `${workflow.status} cannot transition to ${next}`, 409);
    }
    workflow.status = next;
    workflow.updatedAt = this.#now();
  }

  async #save(workflow: WorkflowState): Promise<void> {
    workflow.updatedAt = this.#now();
    await this.store.saveWorkflow(workflow);
  }

  #now(): string {
    return (this.options.now ?? (() => new Date().toISOString()))();
  }
}
