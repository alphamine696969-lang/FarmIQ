/**
 * Layer 1 — Input Guard.
 * Runs before any expensive LLM call. Rejects empty/oversized input, blocks
 * prompt-injection patterns, flags likely off-topic messages, and detects
 * languages that would require the (optional) translation layer.
 */

import { getProviderConfig } from './config';
import { GuardResult } from './types';

export const MAX_MESSAGE_LENGTH = 2000;
export const MIN_MESSAGE_LENGTH = 2;

const OFF_TOPIC_PATTERNS: Array<{ regex: RegExp; label: string }> = [
  { regex: /\b(president|prime minister|election|parliament|politics|political|vote|voting)\b/i, label: 'politics' },
  { regex: /\b(stock market|stock price|crypto|bitcoin|forex|share market)\b/i, label: 'finance_general' },
  { regex: /\b(write|compose|generate)\b.*\b(poem|song|story|essay|code|website|app|program)\b/i, label: 'content_creation' },
  { regex: /\b(chatgpt|openai|claude|anthropic|gemini|bard|llm|gpt-?[45o]?)\b/i, label: 'ai_identity' },
  { regex: /\b(movie|actor|actress|football|cricket match|celebrity|game|video game)\b/i, label: 'entertainment' },
  { regex: /\b(what is|who is|tell me about)\s+(?:the\s+)?(capital|population|history)\b/i, label: 'general_knowledge' }
];

export const OFF_TOPIC_EXAMPLES = [
  'who is the president',
  'write me a poem',
  'stock market',
  'code a website'
];

const INJECTION_PATTERNS: Array<{ regex: RegExp; label: string }> = [
  { regex: /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions|prompts|rules)/i, label: 'instruction_override' },
  { regex: /disregard\s+(your|all|previous|prior|the)\s+(instructions|rules|prompt)/i, label: 'instruction_override' },
  { regex: /(system\s*prompt|reveal|show)\s*(your|the)?\s*(system\s*)?(prompt|instructions)/i, label: 'prompt_leak_attempt' },
  { regex: /<\s*\/?\s*(context|system|chunk)\s*>/i, label: 'markup_spoofing' },
  { regex: /\b(chunks?\s*\[|CHUNK\s+\d+|SYSTEM\s*:)\b/i, label: 'markup_spoofing' },
  { regex: /\byou\s+are\s+now\b/i, label: 'persona_override' },
  { regex: /\b(developer|god|dan)\s+mode\b/i, label: 'jailbreak' },
  { regex: /\bjailbreak\b/i, label: 'jailbreak' },
  { regex: /\b(act|pretend)\s+(as\s+)?(if\s+)?(you\s+)?(were\s+)?(an?\s+)?(unrestricted|uncensored|unfiltered)/i, label: 'jailbreak' }
];

const FARMING_KEYWORDS = [
  'crop', 'crops', 'soil', 'fertilizer', 'fertiliser', 'seed', 'seeds', 'harvest',
  'irrigation', 'irrigate', 'pest', 'pests', 'pesticide', 'disease', 'diseases',
  'weather', 'mandi', 'yield', 'livestock', 'farmiq', 'sowing', 'kharif', 'rabi',
  'farm', 'farming', 'farmer', 'field', 'agronomy', 'agriculture', 'wheat', 'rice',
  'maize', 'corn', 'tomato', 'potato', 'soybean', 'cotton', 'sugarcane', 'paddy',
  'blight', 'rust', 'fungus', 'fungal', 'insect', 'weeds', 'weed', 'spray',
  'ph', 'nitrogen', 'lime', 'mulch', 'millet', 'sorghum', 'chickpea', 'barley',
  'et0', 'evapotranspiration', 'drainage', 'compost', 'manure', 'orchard',
  'scheme', 'subsidy', 'msp', 'price', 'prices', 'market', 'markets', 'rain',
  'rainfall', 'drought', 'flood', 'temperature', 'humidity', 'tractor',
  'planting', 'sow', 'sprouting', 'gemination', 'germination', 'crop insurance'
];

const NON_LATIN_SCRIPT_RANGES: RegExp[] = [
  /[\u0900-\u097F]/, // Devanagari (Hindi, Marathi)
  /[\u0A00-\u0A7F]/, // Gurmukhi (Punjabi)
  /[\u0980-\u09FF]/, // Bengali
  /[\u0B80-\u0BFF]/, // Tamil
  /[\u0C00-\u0C7F]/, // Telugu
  /[\u0600-\u06FF]/, // Arabic
  /[\u4E00-\u9FFF]/, // CJK ideographs
  /[\u3040-\u30FF]/, // Hiragana / Katakana
  /[\uAC00-\uD7AF]/, // Hangul
  /[\u0400-\u04FF]/ // Cyrillic
];

export function hasFarmingKeyword(message: string): boolean {
  const lower = message.toLowerCase();
  return FARMING_KEYWORDS.some((keyword) => lower.includes(keyword));
}

/** ADR-006: pesticide dosage or chemical mixing instructions are refused outright. */
export function isChemicalDosageRequest(message: string): boolean {
  const lower = message.toLowerCase();
  const chemicalTerms = ['chemical', 'spray', 'dose', 'dosage', 'pesticide', 'fungicide', 'insecticide', 'herbicide', 'weedicide'];
  const dosageTerms = ['dosage', 'dose', 'how much', 'quantity', 'how many ml', 'how many grams', 'mix rate', 'mixing rate', 'per litre', 'per liter', 'per acre'];
  const mentionsChemical = chemicalTerms.some((term) => lower.includes(term));
  const asksForRate = dosageTerms.some((term) => lower.includes(term));
  return mentionsChemical && asksForRate;
}

export function detectNeedsTranslation(message: string): boolean {
  return NON_LATIN_SCRIPT_RANGES.some((range) => range.test(message));
}

function matchInjectionPatterns(message: string): string[] {
  return INJECTION_PATTERNS.filter((pattern) => pattern.regex.test(message)).map((pattern) => pattern.label);
}

/** Fast off-topic check without an LLM: blocklist patterns + optional embedding similarity. */
export async function isOffTopic(message: string): Promise<{ offTopic: boolean; matchedPatterns: string[] }> {
  const matchedPatterns: string[] = [];
  const lower = message.toLowerCase();

  // Farming relevance always wins: a message containing explicit farming keywords
  // is routed to the pipeline even if it also matches an off-topic pattern.
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.regex.test(lower) && !hasFarmingKeyword(message)) {
      matchedPatterns.push(pattern.label);
    }
  }

  if (matchedPatterns.length > 0) {
    return { offTopic: true, matchedPatterns };
  }

  // Embedding-based similarity against known off-topic examples (spec threshold 0.82).
  // Only when the embedding provider is configured; the lexical fallback alone is not
  // reliable enough to reject messages, so unconfigured mode relies on the blocklist
  // plus the intent classifier's farming-relevance check.
  const { embeddings } = getProviderConfig();
  if (embeddings) {
    try {
      const { embedText, isEmbeddingConfigured } = await import('../../integrations/ai');
      if (isEmbeddingConfigured()) {
        const queryEmbedding = await embedText(message);
        const exampleEmbeddings = await Promise.all(OFF_TOPIC_EXAMPLES.map((example) => embedText(example)));
        const { cosineSimilarity } = await import('./text');
        const maxSimilarity = Math.max(
          ...exampleEmbeddings.map((example) => cosineSimilarity(queryEmbedding, example))
        );
        if (maxSimilarity > 0.82 && !hasFarmingKeyword(message)) {
          return { offTopic: true, matchedPatterns: ['embedding_off_topic'] };
        }
      }
    } catch (error) {
      // The guard must never fail the request because a provider is misconfigured;
      // degrade to blocklist behavior and continue.
      console.warn(
        '[FarmIQ] Embedding off-topic check failed; using blocklist fallback.',
        error instanceof Error ? error.message : error
      );
    }
  }

  return { offTopic: false, matchedPatterns };
}

const OFF_TOPIC_CANNED_RESPONSE =
  'I can only help with farming topics. You can ask me about crops, diseases, government schemes, market prices, weather, or FarmIQ features.';

export async function runInputGuard(rawMessage: string): Promise<GuardResult> {
  const message = rawMessage.trim();

  if (message.length < MIN_MESSAGE_LENGTH) {
    return {
      action: 'reject',
      message: 'Please type your question.',
      processedMessage: '',
      reason: 'empty_input',
      needsTranslation: false,
      translationAvailable: getProviderConfig().translation
    };
  }

  const matchedInjection = matchInjectionPatterns(message);
  if (matchedInjection.length > 0) {
    return {
      action: 'reject',
      message: 'Your message could not be processed. Please rephrase your farming question.',
      processedMessage: '',
      reason: 'injection_detected',
      matchedPatterns: matchedInjection,
      needsTranslation: false,
      translationAvailable: getProviderConfig().translation
    };
  }

  const processedMessage =
    message.length > MAX_MESSAGE_LENGTH ? message.slice(0, MAX_MESSAGE_LENGTH) : message;

  const { offTopic } = await isOffTopic(processedMessage);
  if (offTopic && !hasFarmingKeyword(processedMessage)) {
    return {
      action: 'redirect',
      message: OFF_TOPIC_CANNED_RESPONSE,
      processedMessage,
      reason: 'off_topic',
      needsTranslation: false,
      translationAvailable: getProviderConfig().translation
    };
  }

  return {
    action: 'pass',
    message: '',
    processedMessage,
    needsTranslation: detectNeedsTranslation(processedMessage),
    translationAvailable: getProviderConfig().translation
  };
}

export { OFF_TOPIC_CANNED_RESPONSE };
