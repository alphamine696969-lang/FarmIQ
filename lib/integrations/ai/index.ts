/**
 * AI provider adapter boundary (ADR-003, ADR-009).
 * Uses the TokenHarbor OpenAI-compatible gateway (AI_BASE_URL / AI_API_KEY).
 * All provider calls happen server-side only. When no provider key is configured,
 * callers must use the clearly-labeled deterministic fallbacks instead of
 * pretending a model ran (ADR-005). This module never logs or exposes secrets.
 */

import type { ChatTurn } from '../../services/assistant/types';
import { getProviderConfig } from '../../services/assistant/config';

// Free-tier gateways queue requests; observed completions take ~100s under load,
// so classification fails fast (keyword cascade) while generation gets a long window.
const CLASSIFICATION_TIMEOUT_MS = 15_000;
const GENERATION_TIMEOUT_MS = 120_000;
const EMBEDDING_TIMEOUT_MS = 20_000;
const VISION_TIMEOUT_MS = 90_000;
const MAX_IMAGE_BYTES = 1_500_000;

/** OpenAI-compatible gateway; override with AI_BASE_URL for other deployments. */
export const DEFAULT_AI_BASE_URL = 'https://tokenharbor.ai/v1';

export interface GenerationResult {
  text: string;
  modelUsed: string;
}

export interface ProviderStatus {
  generationConfigured: boolean;
  generationProvider: 'tokenharbor' | 'none';
  generationModel: string;
  intentModel: string;
  embeddingConfigured: boolean;
  embeddingModel: string;
}

function getGateway(): { baseUrl: string; apiKey: string } | null {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;
  const baseUrl = (process.env.AI_BASE_URL?.trim() || DEFAULT_AI_BASE_URL).replace(/\/+$/, '');
  return { baseUrl, apiKey: apiKey.trim() };
}

export function describeProviderStatus(): ProviderStatus {
  const gateway = getGateway();
  return {
    generationConfigured: gateway !== null,
    generationProvider: gateway ? 'tokenharbor' : 'none',
    // Defaults chosen from observed free-tier availability (ADR-009): mimo is
    // the primary generation model; deepseek handles the occasional uncertain
    // classification. Override via AI_GENERATION_MODEL / AI_INTENT_MODEL.
    generationModel: process.env.AI_GENERATION_MODEL?.trim() || 'mimo-v2.6-flash:free',
    intentModel: process.env.AI_INTENT_MODEL?.trim() || 'deepseek-v4.1-flash:free',
    // No embedding model ships with the gateway by default; operators opt in by
    // setting AI_EMBEDDING_MODEL to a model their gateway actually serves.
    embeddingConfigured: gateway !== null && Boolean(process.env.AI_EMBEDDING_MODEL?.trim()),
    embeddingModel: process.env.AI_EMBEDDING_MODEL?.trim() || ''
  };
}

export function isGenerationConfigured(): boolean {
  return getGateway() !== null;
}

export function isEmbeddingConfigured(): boolean {
  return describeProviderStatus().embeddingConfigured;
}

async function postJson(url: string, headers: Record<string, string>, body: unknown, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`provider_error_${response.status}: ${detail.slice(0, 200)}`);
    }
    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

async function chatCompletion(payload: Record<string, unknown>, timeoutMs: number): Promise<unknown> {
  const gateway = getGateway();
  if (!gateway) throw new Error('provider_error_unconfigured: AI_API_KEY missing');
  return postJson(
    `${gateway.baseUrl}/chat/completions`,
    { Authorization: `Bearer ${gateway.apiKey}` },
    payload,
    timeoutMs
  );
}

/* ---------------------------- Intent classification ---------------------------- */

/** Returns exactly one label string, or null when the provider fails. */
export async function classifyIntentLabel(message: string, history: ChatTurn[]): Promise<string | null> {
  const status = describeProviderStatus();
  if (!status.generationConfigured) return null;

  const contextBlock = history.length
    ? `\nRecent conversation:\n${history
        .slice(-4)
        .map((turn) => `${turn.role}: ${turn.content}`)
        .join('\n')}\n`
    : '';
  const userPrompt = `Categories: crop_advice | disease_diagnosis | weather_query | price_query | scheme_query | croppath_query | general_farming | off_topic${contextBlock}\nMessage: ${message}`;

  const raw = await chatCompletion({
    model: status.intentModel,
    max_tokens: 8,
    temperature: 0,
    messages: [
      {
        role: 'system' as const,
        content: 'You are a routing classifier. Return ONLY one category label, nothing else.'
      },
      { role: 'user' as const, content: userPrompt }
    ]
  }, CLASSIFICATION_TIMEOUT_MS);
  const text = extractText(raw).trim().toLowerCase().replace(/[^a-z_]/g, '');
  return text || null;
}

/* ------------------------------ Generation ------------------------------ */

/**
 * Locked-prompt generation (spec section 6). The system prompt template is owned
 * by the context-assembly layer; every model receives the same template so
 * persona and domain rules stay consistent across providers.
 */
export async function generateAnswer(
  systemPrompt: string,
  history: ChatTurn[],
  userMessage: string
): Promise<GenerationResult | null> {
  const status = describeProviderStatus();
  if (!status.generationConfigured) return null;

  const messages = [...history.slice(-4), { role: 'user' as const, content: userMessage }];

  const raw = await chatCompletion({
    model: status.generationModel,
    max_tokens: 1000,
    temperature: 0.1,
    messages: [{ role: 'system' as const, content: systemPrompt }, ...messages]
  }, GENERATION_TIMEOUT_MS);
  const text = extractText(raw);
  return text ? { text, modelUsed: status.generationModel } : null;
}

/* --------------------------- Vision (crop photos) --------------------------- */

/**
 * Crop photo analysis via an OpenAI-compatible multimodal model. The vision
 * model is opt-in (AI_VISION_MODEL) because multimodal availability varies by
 * gateway; callers must degrade honestly when this returns null.
 */
export async function analyzeCropPhotos(
  images: string[],
  cropName: string,
  weekNumber: number,
  stageLabel: string
): Promise<GenerationResult | null> {
  const status = describeProviderStatus();
  if (!status.generationConfigured || !images.length) return null;
  const visionModel = process.env.AI_VISION_MODEL?.trim() || 'mimo-v2.6-flash:free';

  const safeImages = images
    .filter((src) => /^data:image\/(jpeg|png|webp);/.test(src) && src.length <= MAX_IMAGE_BYTES)
    .slice(0, 3);
  if (!safeImages.length) return null;

  const content: Array<Record<string, unknown>> = [
    {
      type: 'text',
      text: `Crop: ${cropName}. Growth week ${weekNumber} (stage: ${stageLabel}). The farmer attached ${safeImages.length} photo(s) of the crop. Respond with ONLY a JSON object, no markdown fences, exactly these keys:
{
  "stage_match": "on_schedule" | "behind_1_week" | "behind_2_plus" | "ahead" | "uncertain",
  "disease_signs": ["short observable sign", ...] (max 3, [] if none),
  "nutrient_flags": ["possible deficiency pattern e.g. uniform yellowing", ...] (max 3, [] if none),
  "severity": "none" | "early" | "moderate" | "severe",
  "maturity_confirmed": true | false | null,
  "notes": "max 60 words for the farmer"
}
Rules: base stage_match on visible plant structure vs the expected stage. Never suggest pesticide/fertilizer dosages, brand names, or treatment chemicals — disease/nutrient entries are observational only; if unsure use "uncertain" and empty arrays. Use null for maturity_confirmed unless clear maturity cues (dry foliage, filled grain/fruit color) are visible.`
    },
    ...safeImages.map((src) => ({ type: 'image_url', image_url: { url: src } }))
  ];

  const payload = {
    model: visionModel,
    max_tokens: 600,
    temperature: 0.1,
    messages: [
      {
        role: 'system' as const,
        content: 'You are FarmIQ\u2019s crop photo analyst. Output plain text only; no citations, no invented data, no treatment dosages.'
      },
      { role: 'user' as const, content }
    ]
  };

  let raw: unknown;
  try {
    raw = await chatCompletion(payload, VISION_TIMEOUT_MS);
  } catch (err) {
    // Free-tier gateways answer 503 while queueing — one quick retry, then fail.
    const msg = err instanceof Error ? err.message : '';
    if (!msg.includes('provider_error_503') && !msg.includes('service_busy')) throw err;
    await new Promise((resolve) => setTimeout(resolve, 2500));
    raw = await chatCompletion(payload, VISION_TIMEOUT_MS);
  }
  const text = extractText(raw).trim();
  return text ? { text: text.slice(0, 1200), modelUsed: visionModel } : null;
}

/* ------------------------------ Embeddings ------------------------------ */
/**
 * Embeddings via the same OpenAI-compatible gateway. Only called when
 * AI_EMBEDDING_MODEL is explicitly configured; otherwise retrieval stays on the
 * local index.
 */
export async function embedText(text: string): Promise<number[]> {
  const gateway = getGateway();
  const model = describeProviderStatus().embeddingModel;
  if (!gateway || !model) throw new Error('provider_error_unconfigured: embedding model missing');

  const raw = await postJson(
    `${gateway.baseUrl}/embeddings`,
    { Authorization: `Bearer ${gateway.apiKey}` },
    { model, input: text },
    EMBEDDING_TIMEOUT_MS
  );
  const embedding = extractEmbedding(raw);
  if (!embedding) throw new Error('provider_error: malformed embedding payload');
  return embedding;
}

/* --------------------------- Payload extraction --------------------------- */

/** Provider payloads are untrusted input; validate shape before use. */
function extractText(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) return '';
  const record = payload as Record<string, unknown>;

  // OpenAI-compatible: { choices: [{ message: { content } }] }
  if (Array.isArray(record.choices)) {
    const first = record.choices[0];
    if (first && typeof first === 'object') {
      const message = (first as Record<string, unknown>).message;
      if (message && typeof message === 'object' && typeof (message as Record<string, unknown>).content === 'string') {
        return (message as Record<string, unknown>).content as string;
      }
    }
  }
  return '';
}

function extractEmbedding(payload: unknown): number[] | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const record = payload as Record<string, unknown>;
  if (!Array.isArray(record.data) || record.data.length === 0) return null;
  const first = record.data[0];
  if (first && typeof first === 'object') {
    const embedding = (first as Record<string, unknown>).embedding;
    if (Array.isArray(embedding)) {
      const numbers = embedding.filter((value): value is number => typeof value === 'number');
      return numbers.length === embedding.length ? numbers : null;
    }
  }
  return null;
}
