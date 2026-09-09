import { SupportCopilot } from "./copilot.js";
import { loadCorpus } from "./corpus.js";
import { DeterministicSupportModel } from "./fake-model.js";
import { LocalRetrievalTool } from "./retrieval.js";

export async function createCopilot(version = "v1") {
  const corpus = await loadCorpus(version);
  return new SupportCopilot(new LocalRetrievalTool(corpus), new DeterministicSupportModel());
}
