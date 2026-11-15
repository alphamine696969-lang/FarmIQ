/**
 * Layer 4 — Generation.
 * Sends the assembled prompt to the configured LLM — for every on-topic farming
 * question, including ones the knowledge base does not cover (the prompt then
 * uses the general-knowledge template, ADR-010). When no provider is configured
 * or the call fails, an extractive fallback answers strictly from retrieved
 * chunks and is clearly labeled — it never pretends a model generated it
 * (ADR-005). With no chunks and no provider, the insufficient-evidence
 * response is returned.
 */

import { getProviderConfig } from './config';
import { AssembledContext, ChatTurn, GenerationOutcome, RetrievalResult } from './types';
import { INSUFFICIENT_EVIDENCE_RESPONSE } from './retriever';
import { KNOWLEDGE_BASE_LABELS, KnowledgeBase } from './types';
import { describeProviderStatus } from '../../integrations/ai';

const ADR006_REFUSAL =
  'FarmIQ cannot provide pesticide dosages or chemical mixing rates without verification against the official product label registered for your jurisdiction. ' +
  'Please consult your authorized local extension office or the manufacturer\u2019s registered label, and prioritize non-chemical integrated pest management practices.';

/** Split into sentences on terminal punctuation followed by whitespace. */
function firstSentences(text: string, maxSentences: number): string {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, maxSentences).join(' ');
}

export function buildExtractiveFallback(
  retrieval: RetrievalResult,
  providerState: 'unconfigured' | 'unreachable' = 'unconfigured'
): string {
  const seen = new Set<string>();
  const parts: string[] = [];

  for (const chunk of retrieval.chunks) {
    const label = KNOWLEDGE_BASE_LABELS[chunk.kbName as KnowledgeBase] ?? chunk.kbName;
    const sentence = firstSentences(chunk.content, 2);
    const key = sentence.toLowerCase();
    if (!sentence || seen.has(key)) continue;
    seen.add(key);
    parts.push(`${sentence} [Source: ${label}]`);
    if (parts.length >= 3) break;
  }

  const note =
    providerState === 'unconfigured' ? 'AI generation provider not configured' : 'AI generation provider unreachable';
  const body = parts.join('\n\n');
  return `Based on FarmIQ\u2019s retrieved sources (${note}):\n\n${body}`;
}

function insufficientOutcome(): GenerationOutcome {
  return {
    answer: INSUFFICIENT_EVIDENCE_RESPONSE,
    modelUsed: 'none',
    method: 'insufficient_evidence',
    providerConfigured: false,
    skippedReason: 'weak_retrieval'
  };
}

export async function generateResponse(params: {
  retrieval: RetrievalResult;
  context: AssembledContext;
  history: ChatTurn[];
  userMessage: string;
}): Promise<GenerationOutcome> {
  const { retrieval, context, history, userMessage } = params;
  const hasChunks = retrieval.chunks.length > 0;
  const config = getProviderConfig();

  // Unconfigured provider: extractive from chunks when possible, otherwise the
  // honest insufficient-evidence response (no model call).
  if (!config.generation) {
    if (!hasChunks) return insufficientOutcome();
    return {
      answer: buildExtractiveFallback(retrieval, 'unconfigured'),
      modelUsed: 'none',
      method: 'extractive_fallback',
      providerConfigured: false,
      skippedReason: 'provider_unconfigured'
    };
  }

  // Provider configured: always call the model. The pipeline builds the
  // general-knowledge prompt when retrieval returned nothing. The model may
  // research live pages via web_search/web_fetch tools (ADR-019).
  try {
    const { generateAnswer } = await import('../../integrations/ai');
    const result = await generateAnswer(context.systemPrompt, history, userMessage);
    if (result && result.text.trim().length > 0) {
      return {
        answer: result.text.trim(),
        modelUsed: result.modelUsed,
        method: 'llm_generation',
        providerConfigured: true,
        ...(result.research && result.research.length ? { research: result.research } : {})
      };
    }
  } catch (error) {
    console.warn(
      '[FarmIQ] Generation provider failed; using fallback.',
      error instanceof Error ? error.message : error
    );
  }

  // Provider failed or returned nothing.
  if (!hasChunks) return insufficientOutcome();
  return {
    answer: buildExtractiveFallback(retrieval, 'unreachable'),
    modelUsed: 'none',
    method: 'extractive_fallback',
    providerConfigured: false,
    skippedReason: 'provider_unconfigured'
  };
}

export function chemicalDosageRefusal(): GenerationOutcome {
  return {
    answer: ADR006_REFUSAL,
    modelUsed: 'none',
    method: 'refusal',
    providerConfigured: false
  };
}

/** Used by logging to attribute which model produced the answer. */
export function describeGenerationProvider(): string {
  const status = describeProviderStatus();
  return status.generationConfigured ? `${status.generationProvider}:${status.generationModel}` : 'unconfigured';
}
