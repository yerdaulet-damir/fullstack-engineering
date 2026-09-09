import { createHash } from "node:crypto";
import type { JsonValue, Proposal } from "./contracts.js";

export function canonicalJson(value: JsonValue): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;

  const entries = Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`);
  return `{${entries.join(",")}}`;
}

export function proposalDigest(proposal: Proposal): string {
  return createHash("sha256").update(canonicalJson(proposal)).digest("hex");
}
