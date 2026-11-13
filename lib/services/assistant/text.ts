/**
 * Deterministic text utilities shared by the chatbot pipeline layers.
 * Used for lexical retrieval scoring and off-topic detection while the
 * embedding provider is unconfigured (see docs/DECISIONS.md ADR-008).
 */

const TOKEN_SPLIT = /[^\p{L}\p{N}]+/u;

/** Very common words excluded from lexical scoring. */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'to', 'of', 'in', 'on',
  'for', 'and', 'or', 'what', 'which', 'how', 'when', 'should', 'i', 'my',
  'can', 'do', 'does', 'it', 'this', 'that', 'with', 'at', 'by', 'from',
  'about', 'me', 'you', 'your', 'will', 'there', 'their', 'have', 'has'
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(TOKEN_SPLIT)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

/** Jaccard-style overlap in [0, 1] used by the local lexical scorer. */
export function lexicalSimilarity(a: string, b: string): number {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) overlap += 1;
  }
  return overlap / (tokensA.size + tokensB.size - overlap);
}

/** Cosine similarity between two equal-length numeric vectors (used with embeddings). */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
