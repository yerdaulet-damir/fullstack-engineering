const transitions = {
  queued: ["investigating"],
  investigating: ["awaiting_approval", "failed"],
  awaiting_approval: ["approved", "cancelled"],
  approved: ["executing"],
  executing: ["completed", "failed"],
  completed: [],
  failed: [],
  cancelled: []
};

export class OperatorWorkflow {
  executions;

  constructor(state = { id: "run-1", status: "queued", evidence: [], proposal: null, approval: null }, executions = new Map()) {
    this.state = structuredClone(state);
    this.executions = executions;
  }

  transition(next) {
    if (!transitions[this.state.status].includes(next)) throw new Error("INVALID_TRANSITION");
    this.state.status = next;
  }

  investigate(evidence) {
    this.transition("investigating");
    this.state.evidence = structuredClone(evidence);
  }

  propose(tool, args) {
    if (this.state.status !== "investigating") throw new Error("NOT_INVESTIGATING");
    this.state.proposal = { tool, args: structuredClone(args) };
    this.transition("awaiting_approval");
  }

  approve({ reviewerId, proposal }) {
    if (JSON.stringify(proposal) !== JSON.stringify(this.state.proposal)) throw new Error("PROPOSAL_CHANGED");
    this.state.approval = { reviewerId, proposal: structuredClone(proposal) };
    this.transition("approved");
  }

  execute(executionKey, tools) {
    if (this.executions.has(executionKey)) return this.executions.get(executionKey);
    if (this.state.status !== "approved" || !this.state.approval) throw new Error("APPROVAL_REQUIRED");
    this.transition("executing");
    const result = tools.callWrite(this.state.proposal.tool, this.state.proposal.args);
    this.executions.set(executionKey, result);
    this.transition("completed");
    return result;
  }

  serialize() {
    return JSON.stringify(this.state);
  }
}

export class ToolBoundary {
  #writes = new Map();

  constructor(definitions) {
    this.definitions = definitions;
  }

  callRead(name, args) {
    const tool = this.definitions[name];
    if (!tool || tool.kind !== "read") throw new Error("READ_TOOL_REQUIRED");
    return tool.run(args);
  }

  callWrite(name, args) {
    const tool = this.definitions[name];
    if (!tool || tool.kind !== "write") throw new Error("WRITE_TOOL_REQUIRED");
    const result = tool.run(args);
    this.#writes.set(name, (this.#writes.get(name) ?? 0) + 1);
    return result;
  }

  writeCount(name) {
    return this.#writes.get(name) ?? 0;
  }
}
