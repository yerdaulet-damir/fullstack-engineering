import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { JsonValue } from "./contracts.js";

type RefundResult = {
  refundId: string;
  accountId: string;
  amountCents: number;
  reason: string;
};

type GatewayData = { version: 1; refundsByKey: Record<string, RefundResult> };

export class JsonRefundGateway {
  #queue: Promise<void> = Promise.resolve();

  constructor(public readonly filePath: string) {}

  async initialize(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    try {
      await readFile(this.filePath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await this.#write({ version: 1, refundsByKey: {} });
    }
  }

  async issueRefund(args: Record<string, JsonValue>, idempotencyKey: string): Promise<JsonValue> {
    return this.#exclusive(async () => {
      const data = await this.#read();
      const existing = data.refundsByKey[idempotencyKey];
      if (existing) return structuredClone(existing);

      const result: RefundResult = {
        refundId: `rf_${createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 12)}`,
        accountId: String(args.accountId),
        amountCents: Number(args.amountCents),
        reason: String(args.reason)
      };
      data.refundsByKey[idempotencyKey] = result;
      await this.#write(data);
      return structuredClone(result);
    });
  }

  async count(): Promise<number> {
    return Object.keys((await this.#read()).refundsByKey).length;
  }

  async #read(): Promise<GatewayData> {
    return JSON.parse(await readFile(this.filePath, "utf8")) as GatewayData;
  }

  async #write(data: GatewayData): Promise<void> {
    const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    await rename(temporaryPath, this.filePath);
  }

  async #exclusive<T>(operation: () => Promise<T>): Promise<T> {
    let release: () => void = () => undefined;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previous = this.#queue;
    this.#queue = previous.then(() => next);
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }
}
