import type { ModelInput, ModelOutput, SupportModel } from "./contracts.js";

const REFUSAL = "I could not find enough evidence in the approved support documentation.";
const INJECTION_PATTERN = /ignore (all|any|previous)|system_override|reveal (the )?prompt|developer message/i;

export class DeterministicSupportModel implements SupportModel {
  async generate(input: ModelInput): Promise<ModelOutput> {
    if (INJECTION_PATTERN.test(input.query) && !/untrusted migration note/i.test(input.query)) {
      return { answer: REFUSAL, citations: [], grounded: false };
    }

    const evidence = input.evidence[0];
    if (!evidence) return { answer: REFUSAL, citations: [], grounded: false };

    return {
      answer: `${evidence.title}: ${evidence.approvedAnswer}`,
      citations: [{ documentId: evidence.id, version: evidence.version }],
      grounded: true,
    };
  }
}
