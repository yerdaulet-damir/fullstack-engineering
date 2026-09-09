import { createHttpServer } from "./http.mjs";
import { createTeamSaas } from "./service.mjs";
import { createDemoWebhookCredentialStore } from "./webhook-credentials.mjs";

const port = Number(process.env.PORT ?? 3006);
const server = createHttpServer({ service: createTeamSaas(), webhookCredentials: createDemoWebhookCredentialStore() });

server.listen(port, "127.0.0.1", () => console.log(`Team SaaS starter: http://127.0.0.1:${port}`));

function shutdown() {
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
