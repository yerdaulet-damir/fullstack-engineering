export type CorpusDocument = {
  id: string;
  title: string;
  text: string;
  approvedAnswer: string;
  version: string;
};

export type RetrievedEvidence = CorpusDocument & { score: number };

export interface RetrievalTool {
  search(input: { query: string; limit: number }): Promise<RetrievedEvidence[]>;
}

export type ModelInput = {
  query: string;
  evidence: readonly RetrievedEvidence[];
};

export type ModelOutput = {
  answer: string;
  citations: Array<{ documentId: string; version: string }>;
  grounded: boolean;
};

export interface SupportModel {
  generate(input: ModelInput): Promise<ModelOutput>;
}

export type CopilotEvent =
  | { type: "run.started"; runId: string; query: string }
  | { type: "retrieval.started"; runId: string }
  | { type: "retrieval.completed"; runId: string; evidence: RetrievedEvidence[] }
  | { type: "response.delta"; runId: string; delta: string }
  | { type: "response.completed"; runId: string; output: ModelOutput };
