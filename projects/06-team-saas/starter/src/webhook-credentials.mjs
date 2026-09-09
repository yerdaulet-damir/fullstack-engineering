import { timingSafeEqual } from "node:crypto";

const credentialKey = (tenantId, source) => `${tenantId}:${source}`;

function secretsMatch(actual, expected) {
  if (typeof actual !== "string") return false;
  const provided = Buffer.from(actual);
  const configured = Buffer.from(expected);
  return provided.length === configured.length && timingSafeEqual(provided, configured);
}

export class InMemoryWebhookCredentialStore {
  #credentials = new Map();

  constructor(credentials = []) {
    for (const credential of credentials) {
      this.#credentials.set(credentialKey(credential.tenantId, credential.source), { ...credential });
    }
  }

  authenticate({ tenantId, source, secret }) {
    if (typeof tenantId !== "string" || typeof source !== "string") return null;
    const configured = this.#credentials.get(credentialKey(tenantId, source));
    if (!configured || !secretsMatch(secret, configured.secret)) return null;
    return Object.freeze({
      kind: "webhook",
      tenantId: configured.tenantId,
      source: configured.source,
      credentialId: configured.id
    });
  }
}

export function createDemoWebhookCredentialStore(environment = process.env) {
  return new InMemoryWebhookCredentialStore([
    { id: "acme-billing", tenantId: "acme", source: "billing", secret: environment.WEBHOOK_ACME_BILLING_SECRET ?? "acme-billing-demo-secret" },
    { id: "acme-crm", tenantId: "acme", source: "crm", secret: environment.WEBHOOK_ACME_CRM_SECRET ?? "acme-crm-demo-secret" },
    { id: "globex-billing", tenantId: "globex", source: "billing", secret: environment.WEBHOOK_GLOBEX_BILLING_SECRET ?? "globex-billing-demo-secret" }
  ]);
}
