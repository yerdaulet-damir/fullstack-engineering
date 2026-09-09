import type { CorpusDocument, RetrievalTool } from "./contracts.js";

const STOP_WORDS = new Set(["a", "all", "and", "are", "can", "do", "does", "how", "i", "is", "it", "me", "my", "of", "say", "the", "to", "what", "when", "where", "you"]);

function tokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  );
}

export class LocalRetrievalTool implements RetrievalTool {
  constructor(private readonly documents: readonly CorpusDocument[]) {}

  async search(input: { query: string; limit: number }) {
    const queryTokens = tokens(input.query);
    return this.documents
      .map((document) => {
        const titleTokens = tokens(document.title);
        const bodyTokens = tokens(document.text);
        let score = 0;
        for (const token of queryTokens) {
          if (titleTokens.has(token)) score += 3;
          if (bodyTokens.has(token)) score += 1;
        }
        return { ...document, score };
      })
      .filter((document) => document.score >= 2)
      .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
      .slice(0, input.limit);
  }
}
