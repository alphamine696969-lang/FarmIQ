/**
 * Layer 3b — Context Assembly.
 * Builds the locked system prompt (spec section 5) from retrieved chunks and the
 * bounded conversation history. The same template is used for every provider so
 * persona and domain rules stay consistent across models (spec section 12).
 */

import { AssembledContext, ChatTurn, KnowledgeBase, KNOWLEDGE_BASE_LABELS, RetrievalResult } from './types';

export const MAX_HISTORY_TURNS = 4;

const SYSTEM_PROMPT_TEMPLATE = `You are FarmIQ's AI assistant — a trusted farming advisor built specifically
for farmers. You ONLY answer questions using the context provided below.

Rules you must always follow:
1. ONLY use information from the <context> block. Never use outside knowledge.
2. If the context does not contain enough information to answer, say:
   "I don't have enough information to answer that right now."
3. Never mention the underlying AI model or provider name.
   You are the FarmIQ Assistant.
4. Never answer political, general knowledge, or non-farming questions.
5. Always cite which knowledge source your answer comes from, e.g. [Crop Profiles].
6. Answer in the same language the user wrote in.
7. Be concise, practical, and farmer-friendly. No jargon without explanation.`;

/**
 * Used when the knowledge base has no matching documents but the provider is
 * configured: the assistant answers live from general farming knowledge instead
 * of refusing, while clearly disclosing that the answer is not sourced from the
 * FarmIQ knowledge base (ADR-010). Citations must never be invented.
 */
const GENERAL_KNOWLEDGE_TEMPLATE = `You are FarmIQ's AI assistant — a trusted farming advisor built specifically
for farmers. The FarmIQ knowledge base has no documents matching this question,
so answer from your general farming knowledge.

Rules you must always follow:
1. NEVER invent citations, source names, URLs, or claim a document says something.
   Only cite sources that appear in the <context> block (there are none for this turn).
2. Open your answer by noting it is general farming knowledge, not from the
   FarmIQ knowledge base, and that local conditions should be verified with a
   local extension officer.
3. Never mention the underlying AI model or provider name.
   You are the FarmIQ Assistant.
4. Never answer political, general knowledge, or non-farming questions.
5. Never give pesticide dosages or chemical mixing rates.
6. Answer in the same language the user wrote in.
7. Be concise, practical, and farmer-friendly. No jargon without explanation.`;

export interface ContextAssemblyOptions {
  /** True when retrieval found nothing and the provider may answer generally. */
  allowGeneralKnowledge?: boolean;
}

export function buildSystemPrompt(
  retrieval: RetrievalResult,
  history: ChatTurn[],
  options: ContextAssemblyOptions = {}
): AssembledContext {
  const template = options.allowGeneralKnowledge ? GENERAL_KNOWLEDGE_TEMPLATE : SYSTEM_PROMPT_TEMPLATE;
  const chunkBlocks = retrieval.chunks
    .map((chunk, index) => {
      const label = KNOWLEDGE_BASE_LABELS[chunk.kbName as KnowledgeBase] ?? chunk.kbName;
      return `[CHUNK ${index + 1} — source: ${chunk.kbName} (${label})]\n${chunk.content}`;
    })
    .join('\n\n');

  const historyTurns = history.slice(-MAX_HISTORY_TURNS);
  const historyBlock = historyTurns
    .map((turn) => `${turn.role === 'user' ? 'User' : 'FarmIQ Assistant'}: ${turn.content}`)
    .join('\n');

  const contextPlaceholder = options.allowGeneralKnowledge
    ? '(no matching FarmIQ knowledge-base documents — apply the general-knowledge rules)'
    : '(no retrieved documents — answer with the insufficient-information response from rule 2)';

  const systemPrompt = `${template}

<context>
${chunkBlocks || contextPlaceholder}
</context>

<conversation_history>
${historyBlock}
</conversation_history>`;

  return {
    systemPrompt,
    includedChunks: retrieval.chunks,
    historyTurns
  };
}
