/**
 * Layer 3 — RAG Retriever.
 * Primary path: Supabase pgvector RPC `match_farmiq_docs` (spec section 4c), used
 * when the Supabase keys and an embedding provider are configured (FIQ-020 pending).
 * Fallback path: deterministic lexical scoring over the local in-memory knowledge
 * index with its own calibrated threshold (documented in docs/DECISIONS.md ADR-008).
 */

import { getProviderConfig } from './config';
import { getLocalKnowledgeIndex } from './knowledgeIndex';
import { tokenize } from './text';
import { knowledgeBasesForIntent } from './intentClassifier';
import { IntentLabel, RetrievalResult, RetrievedChunk } from './types';

/** pgvector cosine similarity threshold from the pipeline spec. */
export const PGVECTOR_MATCH_THRESHOLD = 0.72;
/**
 * The local lexical scorer measures query-term coverage, not cosine distance, so
 * it uses its own calibrated threshold. 0.2 accepts queries where a minority of
 * terms hit (e.g. location/season words like "Punjab" or "November" are absent
 * from the index) while gibberish still scores 0 and triggers the gate.
 * Chunks below this score are treated as "no relevant documents found".
 */
export const LOCAL_MATCH_THRESHOLD = 0.2;

export const DEFAULT_MATCH_COUNT = 4;

export const INSUFFICIENT_EVIDENCE_RESPONSE =
  'I don\u2019t have enough information about that right now. You can ask me about crops, diseases, government schemes, market guidance, or FarmIQ features.';

function scoreChunkAgainstQuery(queryTokens: string[], chunkContent: string): number {
  if (queryTokens.length === 0) return 0;
  const chunkTokens = new Set(tokenize(chunkContent));
  let hits = 0;
  for (const token of queryTokens) {
    if (chunkTokens.has(token)) hits += 1;
  }
  const coverage = hits / queryTokens.length;
  // Slightly reward multiple distinct hits so single-word coincidences stay low.
  const distinctBonus = hits >= 2 ? 0.05 : 0;
  return Math.min(1, coverage + distinctBonus);
}

export function retrieveLocally(message: string, intent: IntentLabel): RetrievalResult {
  const knowledgeBases = knowledgeBasesForIntent(intent);
  const queryTokens = tokenize(message);
  const candidates = getLocalKnowledgeIndex().filter((chunk) => knowledgeBases.includes(chunk.kbName));

  const scored = candidates
    .map((chunk) => ({ ...chunk, similarity: scoreChunkAgainstQuery(queryTokens, chunk.content) }))
    .filter((chunk) => chunk.similarity >= LOCAL_MATCH_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, DEFAULT_MATCH_COUNT);

  return {
    chunks: scored,
    providerConfigured: false,
    method: 'local_lexical_index',
    thresholdUsed: LOCAL_MATCH_THRESHOLD
  };
}

interface PgVectorMatch {
  content: string;
  source: string;
  similarity: number;
}

async function retrieveViaPgVector(
  queryEmbedding: number[],
  intent: IntentLabel
): Promise<RetrievalResult | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;

  const knowledgeBases = knowledgeBasesForIntent(intent);
  const allChunks: RetrievedChunk[] = [];

  try {
    for (const knowledgeBase of knowledgeBases) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      let payload: unknown;
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/match_farmiq_docs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`
          },
          body: JSON.stringify({
            query_embedding: queryEmbedding,
            knowledge_base: knowledgeBase,
            match_threshold: PGVECTOR_MATCH_THRESHOLD,
            match_count: DEFAULT_MATCH_COUNT
          }),
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(`pgvector_rpc_error_${response.status}`);
        }
        payload = (await response.json()) as unknown;
      } finally {
        clearTimeout(timer);
      }

      if (!Array.isArray(payload)) continue;
      for (const row of payload as unknown[]) {
        if (typeof row !== 'object' || row === null) continue;
        const match = row as Record<string, unknown>;
        if (typeof match.content !== 'string' || typeof match.similarity !== 'number') continue;
        const pgMatch: PgVectorMatch = {
          content: match.content,
          source: typeof match.source === 'string' ? match.source : knowledgeBase,
          similarity: match.similarity
        };
        allChunks.push({
          chunkId: `${knowledgeBase}-${allChunks.length}`,
          kbName: knowledgeBase as RetrievedChunk['kbName'],
          content: pgMatch.content,
          sourceLabel: pgMatch.source,
          similarity: pgMatch.similarity
        });
      }
    }
  } catch (error) {
    console.warn('[FarmIQ] pgvector retrieval failed; falling back to local index.', error instanceof Error ? error.message : error);
    return null;
  }

  allChunks.sort((a, b) => b.similarity - a.similarity);
  return {
    chunks: allChunks.slice(0, DEFAULT_MATCH_COUNT),
    providerConfigured: true,
    method: 'pgvector_rpc',
    thresholdUsed: PGVECTOR_MATCH_THRESHOLD
  };
}

export async function retrieve(message: string, intent: IntentLabel): Promise<RetrievalResult> {
  const config = getProviderConfig();

  if (config.retrieval && config.embeddings) {
    try {
      const { embedText, isEmbeddingConfigured } = await import('../../integrations/ai');
      if (isEmbeddingConfigured()) {
        const queryEmbedding = await embedText(message);
        const pgResult = await retrieveViaPgVector(queryEmbedding, intent);
        if (pgResult) return pgResult;
      }
    } catch (error) {
      // Retrieval must degrade to the local index when the provider fails,
      // never surface a 500 to the user.
      console.warn(
        '[FarmIQ] Embedding/pgvector retrieval failed; using local index.',
        error instanceof Error ? error.message : error
      );
    }
  }

  return retrieveLocally(message, intent);
}

/**
 * "I don't know" gate (spec section 6). Weak retrieval must never reach the
 * generation layer.
 */
export function hasSufficientEvidence(result: RetrievalResult): boolean {
  return result.chunks.length > 0;
}
