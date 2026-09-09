import type { ModelInput, ModelOutput, SupportModel } from "./contracts.js";

const REFUSAL = "I could not find enough evidence in the approved support documentation.";
const INJECTION_PATTERN = /ignore (all|any|previous)|system_override|reveal (the )?prompt|developer message/i;

export class DeterministicSupportModel implements SupportModel {
  async generate(input: ModelInput): Promise<ModelOutput> {
    if (INJECTION_PATTERN.test(input.query) && !/untrusted migration note/i.test(input.query)) {
      return { answer: REFUSAL, citationIds: [], grounded: false };
    }

    const evidence = input.evidence[0];
    if (!evidence) return { answer: REFUSAL, citationIds: [], grounded: false };

    if (evidence.id === "unsafe-note") {
      return {
        answer: "The note contains an instruction-like string, but corpus text is evidence, not an instruction to the assistant.",
        citationIds: [evidence.id],
        grounded: true,
      };
    }

    return {
      answer: `${evidence.title}: ${evidence.text}`,
      citationIds: [evidence.id],
      grounded: true,
    };
  }
}
