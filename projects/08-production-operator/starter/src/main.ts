import { resolve } from "node:path";
import { createDemoToolRegistry } from "./demo-tools.js";
import { JsonRefundGateway } from "./refund-gateway.js";
import { createOperatorServer } from "./server.js";
import { FileOperatorStore } from "./store.js";
import { OperatorService } from "./workflow.js";

const dataDirectory = resolve(process.env.OPERATOR_DATA_DIR ?? ".data");
const store = new FileOperatorStore(resolve(dataDirectory, "operator.json"));
const gateway = new JsonRefundGateway(resolve(dataDirectory, "refund-gateway.json"));
await Promise.all([store.initialize(), gateway.initialize()]);

const service = new OperatorService(store, createDemoToolRegistry(gateway));
const server = createOperatorServer(service);
const port = Number(process.env.PORT ?? 3008);

server.listen(port, "127.0.0.1", () => {
  console.log(`Production Operator listening on http://127.0.0.1:${port}`);
  console.log(`Persistent starter data: ${dataDirectory}`);
});
