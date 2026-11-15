/**
 * FarmIQ AI Chatbot Pipeline — orchestrator (spec sections 1 and 10).
 * Runs the layers in order and returns a single typed result for the API route:
 * Input Guard -> Intent Classifier -> RAG Retriever -> Context Assembly ->
 * Generation -> Output Guard -> Response -> Logging.
 */

import { getProviderConfig } from './config';
import {
  isChemicalDosageRequest,
  OFF_TOPIC_CANNED_RESPONSE,
  runInputGuard
} from './inputGuard';
import { classifyIntent, INTENT_FOLLOW_UPS } from './intentClassifier';
import { buildSystemPrompt } from './contextAssembly';
import { chemicalDosageRefusal, generateResponse } from './generation';
import { validateOutput } from './outputGuard';
import { buildTurnLog, recordTurnLog } from './logging';
import { INSUFFICIENT_EVIDENCE_RESPONSE, retrieve } from './retriever';
import {
  AssistantSourceRef,
  AssistantChatRequestBody,
  ChatTurn,
  IntentLabel,
  IntentResult,
  PipelineResult
} from './types';
import { isTranslationConfigured, translateText, detectTargetLanguage } from './translation';

const MAX_LOGGED_MESSAGE_LENGTH = 2000;

function sanitizeHistory(history: ChatTurn[] | undefined): ChatTurn[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (turn): turn is ChatTurn =>
        turn !== null &&
        typeof turn === 'object' &&
        (turn.role === 'user' || turn.role === 'assistant') &&
        typeof turn.content === 'string' &&
        turn.content.trim().length > 0
    )
    .slice(-4)
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, 500) }));
}

function blockedResult(params: {
  answer: string;
  intent: IntentResult;
  latencyMs: number;
  userId?: string;
  userMessage: string;
  blocked: boolean;
  limitations?: string[];
}): PipelineResult {
  const log = buildTurnLog({
    userMessage: params.userMessage.slice(0, MAX_LOGGED_MESSAGE_LENGTH),
    intent: params.intent,
    retrieval: { chunks: [], providerConfigured: false, method: 'local_lexical_index', thresholdUsed: 0 },
    modelUsed: 'none',
    response: params.answer,
    outputValid: true,
    latencyMs: params.latencyMs,
    userId: params.userId
  });
  recordTurnLog(log);
  return {
    blocked: params.blocked,
    answer: params.answer,
    sources: [],
    followUps: [],
    intent: params.intent,
    evidenceStatus: 'insufficient',
    limitations: params.limitations ?? [],
    warnings: [],
    providerConfigured: {
      generation: getProviderConfig().generation,
      embeddings: getProviderConfig().embeddings,
      translation: isTranslationConfigured(),
      retrieval: getProviderConfig().retrieval,
      webSearch: getProviderConfig().webSearch
    },
    log
  };
}

function buildSources(chunks: Array<{ chunkId: string; sourceId?: string; sourceLabel: string; sourceUrl?: string; content: string; similarity: number }>): AssistantSourceRef[] {
  // One card per source (chunks arrive sorted by relevance, so the strongest
  // excerpt wins) — source count follows query relevance, not a fixed quota.
  const seen = new Set<string>();
  const sources: AssistantSourceRef[] = [];
  for (const chunk of chunks) {
    const key = chunk.sourceId || chunk.sourceLabel;
    if (seen.has(key)) continue;
    seen.add(key);
    sources.push({
      sourceId: chunk.sourceId,
      sourceLabel: chunk.sourceLabel,
      url: chunk.sourceUrl,
      excerpt: chunk.content,
      similarity: Number(chunk.similarity.toFixed(4))
    });
  }
  return sources;
}

export async function runChatPipeline(body: AssistantChatRequestBody): Promise<PipelineResult> {
  const startedAt = Date.now();
  const rawMessage = typeof body.message === 'string' ? body.message : '';
  const userId = typeof body.userId === 'string' ? body.userId : undefined;
  const history = sanitizeHistory(body.history);
  const config = getProviderConfig();
  const providerConfigured = {
    generation: config.generation,
    embeddings: config.embeddings,
    translation: isTranslationConfigured(),
    retrieval: config.retrieval,
    webSearch: config.webSearch
  };

  const latency = () => Date.now() - startedAt;

  // Layer 1 — Input Guard (before any expensive model call)
  const guard = await runInputGuard(rawMessage);
  if (guard.action !== 'pass') {
    const intent: IntentResult = {
      label: guard.reason === 'injection_detected' || guard.reason === 'off_topic' ? 'off_topic' : 'general_farming',
      confidence: 0,
      method: 'keyword_fallback'
    };
    return blockedResult({
      answer: guard.message,
      intent,
      latencyMs: latency(),
      userId,
      userMessage: guard.processedMessage || rawMessage,
      blocked: true,
      limitations: ['Message rejected by the input guard before retrieval.']
    });
  }

  const message = guard.processedMessage;

  // ADR-006 — refuse pesticide dosage / chemical mixing requests outright.
  if (isChemicalDosageRequest(message)) {
    const refusal = chemicalDosageRefusal();
    const intent: IntentResult = { label: 'disease_diagnosis', confidence: 0.9, method: 'keyword_fallback' };
    const log = buildTurnLog({
      userMessage: message.slice(0, MAX_LOGGED_MESSAGE_LENGTH),
      intent,
      retrieval: { chunks: [], providerConfigured: false, method: 'local_lexical_index', thresholdUsed: 0 },
      modelUsed: refusal.modelUsed,
      response: refusal.answer,
      outputValid: true,
      latencyMs: latency(),
      userId
    });
    recordTurnLog(log);
    return {
      blocked: false,
      answer: refusal.answer,
      sources: [],
      followUps: INTENT_FOLLOW_UPS.disease_diagnosis,
      intent,
      evidenceStatus: 'insufficient',
      limitations: [
        'No verified jurisdiction-specific product label was available, so no dosage can be given (ADR-006).'
      ],
      warnings: [
        'Applying unverified chemical rates risks crop phytotoxicity, environmental contamination, and illegal residue violations.',
        'Always observe the Pre-Harvest Interval (PHI) and Re-Entry Interval (REI) printed on the locally registered product label.'
      ],
      providerConfigured,
      log
    };
  }

  // Layer 2 — Intent Classifier
  const intent = await classifyIntent(message, history);

  if (intent.label === 'off_topic') {
    return blockedResult({
      answer: OFF_TOPIC_CANNED_RESPONSE,
      intent,
      latencyMs: latency(),
      userId,
      userMessage: message,
      blocked: true,
      limitations: ['No farming relevance detected; retrieval was skipped.']
    });
  }

  // Translation boundary: non-English scripts are translated to English for
  // retrieval when the translation provider is configured; otherwise the raw
  // message is used and the limitation is disclosed.
  let retrievalMessage = message;
  let answerLanguageTranslated = false;
  let translationFailed = false;
  if (guard.needsTranslation) {
    if (isTranslationConfigured()) {
      try {
        const translated = await translateText(message, 'EN');
        if (translated) {
          retrievalMessage = translated;
        } else {
          // null means the provider rejected the pair (e.g. unsupported language)
          // or the request failed — disclose it rather than claim success.
          translationFailed = true;
        }
      } catch {
        translationFailed = true;
      }
    }
  }

  // Layer 3 — RAG Retriever
  const retrieval = await retrieve(retrievalMessage, intent.label);

  // Layer 3b — Context Assembly (locked system prompt + bounded history).
  // When retrieval finds nothing but the provider is configured, the
  // general-knowledge template lets the model answer live instead of refusing
  // (ADR-010); sources stay empty and the answer is labeled as general knowledge.
  const generalMode = retrieval.chunks.length === 0 && config.generation;
  const context = buildSystemPrompt(retrieval, history, { allowGeneralKnowledge: generalMode });

  // Layer 4 — Generation
  const generation = await generateResponse({
    retrieval,
    context,
    history,
    userMessage: retrievalMessage
  });

  // Layer 5 — Output Guard
  const validation = validateOutput(generation.answer);
  let answer = generation.answer;
  const researchItems = generation.research ?? [];
  let evidenceStatus: PipelineResult['evidenceStatus'];
  if (!validation.valid) {
    answer = INSUFFICIENT_EVIDENCE_RESPONSE;
    evidenceStatus = 'insufficient';
  } else if (retrieval.chunks.length > 0) {
    evidenceStatus = retrieval.providerConfigured
      ? retrieval.chunks[0].similarity >= 0.85
        ? 'supported'
        : 'partial'
      : // Offline crop/disease profile answers stay honest partial evidence.
        'partial';
  } else if (generation.method === 'llm_generation') {
    // Live answer: real-time model output — grounded in web research the model
    // actually performed (ADR-019), or general farming knowledge without it.
    // Never claim more than partial without knowledge-base evidence.
    evidenceStatus = 'partial';
  } else {
    evidenceStatus = 'insufficient';
  }

  // Translate the final answer back when the input was non-English and the
  // translation provider is configured.
  if (guard.needsTranslation && isTranslationConfigured()) {
    try {
      const targetLanguage = detectTargetLanguage(message);
      const translatedBack = await translateText(answer, targetLanguage);
      if (translatedBack) {
        answer = translatedBack;
        answerLanguageTranslated = true;
      } else {
        translationFailed = true;
      }
    } catch {
      translationFailed = true;
    }
  }

  // Sources, follow-ups, limitations, warnings.
  // Knowledge-base cards first, then real pages the model researched (deduped
  // by URL) — research items are actual fetched results, never invented.
  const sources = buildSources(retrieval.chunks);
  const seenUrls = new Set(sources.map((s) => s.url).filter(Boolean));
  for (const item of researchItems) {
    if (seenUrls.has(item.url)) continue;
    seenUrls.add(item.url);
    sources.push({
      sourceLabel: item.title || item.url,
      url: item.url,
      excerpt: item.snippet || (item.kind === 'page' ? 'Page read by the assistant.' : 'Search result used by the assistant.'),
      similarity: 0.9
    });
  }
  const followUps = INTENT_FOLLOW_UPS[intent.label as Exclude<IntentLabel, 'off_topic'>] ?? [];

  const limitations: string[] = [];
  if (generation.method === 'extractive_fallback') {
    limitations.push(
      config.generation
        ? 'The AI generation provider could not be reached (free-tier rate limits and slow queues are common), so this answer is an extractive summary of retrieved knowledge-base chunks rather than a model-written response.'
        : 'The AI generation provider is not configured, so this answer is an extractive summary of retrieved knowledge-base chunks rather than a model-written response.'
    );
  }
  if (generation.method === 'llm_generation' && retrieval.chunks.length === 0 && researchItems.length === 0) {
    limitations.push(
      'No knowledge-base documents matched this question and no web research was performed, so this answer comes from the AI model\u2019s general farming knowledge. It is not verified against approved sources — confirm local conditions before acting.'
    );
  }
  if (generation.method === 'insufficient_evidence' && config.generation) {
    limitations.push(
      'The AI generation provider could not be reached (free-tier rate limits and slow queues are common), so no answer could be generated.'
    );
  }
  if (retrieval.method === 'local_lexical_index' && researchItems.length === 0) {
    limitations.push(
      'No live knowledge-base documents matched this turn (Supabase pgvector retrieval activates once database credentials are configured — FIQ-020), and no web research was performed for this answer.'
    );
  }
  if (researchItems.length > 0) {
    limitations.push(
      'The assistant researched live web results during this answer (web_search/web_fetch tools) — always open the linked sources to confirm prices, schemes, and local conditions before acting.'
    );
  }
  if (generation.skippedReason === 'weak_retrieval') {
    limitations.push(
      `No knowledge-base chunk reached the relevance threshold (${retrieval.thresholdUsed}), so no answer was generated.`
    );
  }
  if (guard.needsTranslation && !answerLanguageTranslated) {
    limitations.push(
      translationFailed
        ? 'Translation of your message failed; the answer may be incomplete for non-English input.'
        : 'Your message appears to be in a non-English script and no translation provider is configured yet, so the answer may not match your language.'
    );
  }
  if (intent.label === 'weather_query' || intent.label === 'price_query') {
    limitations.push(
      'Web research can surface recent articles about weather and prices, but FarmIQ does not invent live measurements — open the Weather or Markets pages for provider-labeled, timestamped data.'
    );
  }
  if (intent.label === 'disease_diagnosis') {
    limitations.push(
      'Disease guidance from the knowledge base is general; confirm serious or ambiguous cases with a local extension officer or laboratory.'
    );
  }

  const warnings: string[] = [];
  if (intent.label === 'disease_diagnosis') {
    warnings.push(
      'Treat this as candidate guidance, not a diagnosis. FarmIQ never provides unverified pesticide dosages (ADR-006).'
    );
  }

  // Layer 7 — Logging & Eval
  const log = buildTurnLog({
    userMessage: message.slice(0, MAX_LOGGED_MESSAGE_LENGTH),
    intent,
    retrieval,
    modelUsed: generation.modelUsed,
    response: answer.slice(0, 4000),
    outputValid: validation.valid,
    latencyMs: latency(),
    userId
  });
  recordTurnLog(log);

  return {
    blocked: false,
    answer,
    sources,
    followUps,
    intent,
    evidenceStatus,
    limitations,
    warnings,
    providerConfigured,
    log
  };
}
