import { conflict } from "./errors.mjs";

const deliveryKey = ({ tenantId, source, deliveryId }) => `${tenantId}:${source}:${deliveryId}`;

export class InMemoryWebhookInbox {
  #deliveries = new Map();

  async process(delivery, handler) {
    const key = deliveryKey(delivery);
    const known = this.#deliveries.get(key);
    if (known?.status === "completed") return { status: "duplicate", result: structuredClone(known.result) };
    if (known?.status === "processing") throw conflict("Webhook delivery is already being processed");
    this.#deliveries.set(key, { status: "processing" });
    try {
      const result = await handler(structuredClone(delivery.payload));
      this.#deliveries.set(key, { status: "completed", result: structuredClone(result) });
      return { status: "processed", result: structuredClone(result) };
    } catch (error) {
      this.#deliveries.delete(key);
      throw error;
    }
  }
}
