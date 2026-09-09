import assert from "node:assert/strict";
import test from "node:test";
import { OperatorWorkflow, ToolBoundary } from "../src/operator.mjs";

function setup() {
  const tools = new ToolBoundary({
    account: { kind: "read", run: ({ id }) => ({ id, status: "active" }) },
    refund: { kind: "write", run: ({ amount }) => ({ refundId: "r1", amount }) }
  });
  const run = new OperatorWorkflow();
  run.investigate([tools.callRead("account", { id: "a1" })]);
  run.propose("refund", { amount: 25 });
  return { run, tools };
}

test("cannot write before matching human approval", () => {
  const { run, tools } = setup();
  assert.throws(() => run.execute("refund-1", tools), /APPROVAL_REQUIRED/);
  assert.throws(() => run.approve({ reviewerId: "h1", proposal: { tool: "refund", args: { amount: 250 } } }), /PROPOSAL_CHANGED/);
});

test("resumes serialized state and deduplicates the side effect", () => {
  const { run, tools } = setup();
  run.approve({ reviewerId: "h1", proposal: run.state.proposal });
  const executions = new Map();
  const resumed = new OperatorWorkflow(JSON.parse(run.serialize()), executions);
  const first = resumed.execute("refund-1", tools);
  const again = resumed.execute("refund-1", tools);
  assert.deepEqual(again, first);
  assert.equal(tools.writeCount("refund"), 1);
  assert.equal(resumed.state.status, "completed");
});
