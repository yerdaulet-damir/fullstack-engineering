import { TeamSaas } from "./saas.mjs";

const app = new TeamSaas();
app.createIssue({ tenantId: "acme", role: "member", title: "Export failed", actorId: "user-1" });
console.log(app.listIssues({ tenantId: "acme", role: "viewer" }));
