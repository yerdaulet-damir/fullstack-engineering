import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { createDemoToolRegistry } from "../src/demo-tools.js";
import { JsonRefundGateway } from "../src/refund-gateway.js";
import { FileOperatorStore } from "../src/store.js";
import { OperatorService } from "../src/workflow.js";

export async function createHarness(options: ConstructorParameters<typeof OperatorService>[2] = {}) {
  const directory = await mkdtemp(resolve(tmpdir(), "production-operator-"));
  const storePath = resolve(directory, "operator.json");
  const gatewayPath = resolve(directory, "gateway.json");
  const store = new FileOperatorStore(storePath);
  const gateway = new JsonRefundGateway(gatewayPath);
  await Promise.all([store.initialize(), gateway.initialize()]);
  const tools = createDemoToolRegistry(gateway);
  const service = new OperatorService(store, tools, options);
  return { directory, storePath, gatewayPath, store, gateway, tools, service };
}

export async function prepareWorkflow(service: OperatorService) {
  return service.prepare({
    accountId: "acct-100",
    issue: "Duplicate charge confirmed by support",
    requestedAmountCents: 2500
  });
}
