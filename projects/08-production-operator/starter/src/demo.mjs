import { OperatorWorkflow, ToolBoundary } from "./operator.mjs";

const tools = new ToolBoundary({ refund: { kind: "write", run: ({ amount }) => ({ refundId: "refund-1", amount }) } });
const run = new OperatorWorkflow();
run.investigate([{ source: "invoice-7", fact: "duplicate charge" }]);
run.propose("refund", { amount: 25 });
run.approve({ reviewerId: "human-1", proposal: run.state.proposal });
console.log(run.execute("invoice-7:refund", tools));
