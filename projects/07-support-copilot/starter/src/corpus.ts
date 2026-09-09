import { readFile } from "node:fs/promises";
import type { CorpusDocument } from "./contracts.js";

type CorpusFile = {
  version: string;
  documents: Array<Omit<CorpusDocument, "version">>;
};

export async function loadCorpus(version = "v1"): Promise<CorpusDocument[]> {
  if (!/^v\d+$/.test(version)) throw new Error(`Invalid corpus version: ${version}`);
  const url = new URL(`../corpus/${version}/documents.json`, import.meta.url);
  const parsed = JSON.parse(await readFile(url, "utf8")) as CorpusFile;
  if (parsed.version !== version) throw new Error(`Corpus version mismatch: ${parsed.version}`);
  return parsed.documents.map((document) => ({ ...document, version }));
}
