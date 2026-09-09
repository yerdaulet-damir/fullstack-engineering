import { createTeamSaas } from "./service.mjs";

const app = createTeamSaas();
const alice = { tenantId: "acme", userId: "alice" };
const bob = { tenantId: "globex", userId: "bob" };

console.log("Acme issues:", app.listIssues(alice));
console.log("Globex issues:", app.listIssues(bob));
console.log("Queued digest:", app.queueDigest(alice, { idempotencyKey: "demo-digest" }));
console.log("Processed job:", await app.runNextJob(alice));
console.log("Acme audit:", app.listAudit(alice));
