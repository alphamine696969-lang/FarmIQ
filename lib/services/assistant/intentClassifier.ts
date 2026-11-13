/**
 * Layer 2 — Intent Classifier.
 * Routes the message to the right pipeline. Uses a lightweight LLM classifier when
 * a provider key is configured; otherwise falls back to a deterministic keyword
 * classifier. Per spec, any message with farming relevance must never be classified
 * as off_topic, and low-confidence classifications fall back to general_farming.
 */

import { getProviderConfig } from './config';
import { hasFarmingKeyword } from './inputGuard';
import { lexicalSimilarity } from './text';
import { ChatTurn, IntentLabel, IntentResult } from './types';

export const INTENT_LABELS: IntentLabel[] = [
  'crop_advice',
  'disease_diagnosis',
  'weather_query',
  'price_query',
  'scheme_query',
  'croppath_query',
  'general_farming',
  'off_topic'
];

export const INTENT_SYSTEM_PROMPT = `
You are a routing classifier for FarmIQ, an AI farming assistant.
Classify the user's message into exactly one of these categories:
crop_advice | disease_diagnosis | weather_query | price_query |
scheme_query | croppath_query | general_farming | off_topic

Return ONLY the category label. No explanation. No punctuation.
If the message has any farming or agriculture relevance, do NOT classify as off_topic.
`.trim();

/** Confidence below this threshold routes to general_farming (never off_topic). */
export const INTENT_CONFIDENCE_GATE = 0.6;

interface IntentKeywordRule {
  label: IntentLabel;
  keywords: string[];
  weight: number;
}

const KEYWORD_RULES: IntentKeywordRule[] = [
  {
    label: 'disease_diagnosis',
    keywords: ['blight', 'rust', 'fungus', 'fungal', 'leaf spot', 'lesions', 'yellow leaves', 'wilting', 'disease', 'pest', 'insect', 'aphid', 'borer', 'symptoms', 'diagnose', 'my wheat leaves', 'leaves are turning', 'spots on'],
    weight: 0.9
  },
  {
    label: 'weather_query',
    keywords: ['weather', 'rain', 'rainfall', 'forecast', 'temperature', 'humidity', 'frost', 'wind', 'drought forecast', 'will it rain', 'climate this week'],
    weight: 0.95
  },
  {
    label: 'price_query',
    keywords: ['price', 'prices', 'rate', 'mandi', 'market rate', 'how much is', 'cost per', 'quintal', 'selling price', 'today'],
    weight: 0.9
  },
  {
    label: 'scheme_query',
    keywords: ['scheme', 'schemes', 'subsidy', 'government', 'pm-kisan', 'kisan', 'kcc', 'insurance', 'msp', 'loan', 'yojana'],
    weight: 0.9
  },
  {
    label: 'croppath_query',
    keywords: ['croppath', 'crop tracker', 'crop path', 'tracker', 'farmiq feature', 'how do i set up', 'farmiq app', 'dashboard feature'],
    weight: 0.95
  },
  {
    label: 'crop_advice',
    keywords: ['best crop', 'which crop', 'variety', 'varieties', 'suitable', 'sow', 'sowing', 'plant', 'planting', 'seed rate', 'crop for', 'grow in', 'rotation', 'season'],
    weight: 0.9
  },
  {
    label: 'general_farming',
    keywords: ['irrigat', 'fertilizer', 'fertiliser', 'soil', 'ph', 'nitrogen', 'compost', 'manure', 'weed', 'mulch', 'et0', 'water', 'tillage', 'yield', 'storage', 'harvest'],
    weight: 0.7
  }
];

const GREETING_PATTERN = /^(hi|hello|hey|hola|namaste|good (morning|afternoon|evening)|thanks|thank you|salaam)\b/i;

function classifyWithKeywords(message: string): IntentResult {
  const lower = message.toLowerCase();

  if (GREETING_PATTERN.test(lower) && lower.trim().split(/\s+/).length <= 4) {
    return { label: 'general_farming', confidence: 0.7, method: 'keyword_fallback' };
  }

  let best: { label: IntentLabel; score: number } | null = null;

  for (const rule of KEYWORD_RULES) {
    const hits = rule.keywords.filter((keyword) => lower.includes(keyword)).length;
    if (hits > 0) {
      const score = Math.min(0.95, rule.weight + (hits - 1) * 0.02);
      if (!best || score > best.score) {
        best = { label: rule.label, score };
      }
    }
  }

  if (!best) {
    // Messages with farming relevance but no strong keyword match fall back to
    // general_farming; messages with no farming relevance at all are off_topic.
    if (hasFarmingKeyword(message)) {
      return { label: 'general_farming', confidence: INTENT_CONFIDENCE_GATE, method: 'keyword_fallback' };
    }
    const offTopicLike = OFF_TOPIC_HINTS.some((hint) => lexicalSimilarity(lower, hint) > 0.3);
    return {
      label: offTopicLike ? 'off_topic' : 'general_farming',
      confidence: INTENT_CONFIDENCE_GATE,
      method: 'keyword_fallback'
    };
  }

  return { label: best.label, confidence: best.score, method: 'keyword_fallback' };
}

const OFF_TOPIC_HINTS = ['who is the president', 'what is chatgpt', 'write me a poem', 'stock market', 'code a website'];

async function classifyWithLlm(message: string, history: ChatTurn[]): Promise<IntentResult | null> {
  const { isGenerationConfigured, classifyIntentLabel, describeProviderStatus } = await import('../../integrations/ai');
  if (!isGenerationConfigured()) return null;
  try {
    const label = await classifyIntentLabel(message, history);
    if (label && (INTENT_LABELS as string[]).includes(label)) {
      return { label: label as IntentLabel, confidence: 0.9, method: 'llm_classifier' };
    }
    return null;
  } catch {
    console.warn(`[FarmIQ] LLM intent classification failed (${describeProviderStatus().generationProvider}); using keyword fallback.`);
    return null;
  }
}

export async function classifyIntent(message: string, history: ChatTurn[] = []): Promise<IntentResult> {
  const { classifier } = getProviderConfig();

  // Cascade (ADR-009): the deterministic classifier handles clear queries
  // without spending rate-limit budget. The LLM classifier is consulted only
  // when the keyword result is uncertain (at or below the confidence gate).
  const keywordResult = classifyWithKeywords(message);
  const normalizedKeyword: IntentResult =
    keywordResult.label === 'off_topic' && hasFarmingKeyword(message)
      ? { ...keywordResult, label: 'general_farming' }
      : keywordResult;

  if (classifier && normalizedKeyword.confidence <= INTENT_CONFIDENCE_GATE) {
    const llmResult = await classifyWithLlm(message, history);
    if (llmResult) {
      // Spec: never classify farming-relevant messages as off_topic.
      if (llmResult.label === 'off_topic' && hasFarmingKeyword(message)) {
        return { ...llmResult, label: 'general_farming' };
      }
      // Confidence gate: weak classifications fall back to general_farming.
      if (llmResult.confidence < INTENT_CONFIDENCE_GATE) {
        return { ...llmResult, label: 'general_farming' };
      }
      return llmResult;
    }
  }

  return normalizedKeyword;
}

/** Knowledge bases to search for each intent (spec section 3). */
export function knowledgeBasesForIntent(intent: IntentLabel): string[] {
  switch (intent) {
    case 'crop_advice':
      return ['kb_crops', 'kb_agronomy'];
    case 'disease_diagnosis':
      return ['kb_diseases', 'kb_agronomy'];
    case 'weather_query':
      return ['kb_agronomy', 'kb_farmiq'];
    case 'price_query':
      return ['kb_markets', 'kb_farmiq'];
    case 'scheme_query':
      return ['kb_schemes'];
    case 'croppath_query':
      return ['kb_farmiq'];
    case 'general_farming':
      return ['kb_agronomy', 'kb_crops', 'kb_diseases', 'kb_schemes', 'kb_markets', 'kb_farmiq'];
    default:
      return [];
  }
}

export const INTENT_FOLLOW_UPS: Record<Exclude<IntentLabel, 'off_topic'>, string[]> = {
  crop_advice: [
    'What soil pH and rainfall does this crop need?',
    'Which varieties are recommended for my region?',
    'How long is the growth cycle and expected yield?'
  ],
  disease_diagnosis: [
    'What cultural practices prevent this disease?',
    'How can I confirm the diagnosis reliably?',
    'When should I contact a local extension officer?'
  ],
  weather_query: [
    'How does this affect my irrigation schedule?',
    'What crop alerts can FarmIQ provide?',
    'Where does FarmIQ weather data come from?'
  ],
  price_query: [
    'How do I compare prices across nearby mandis?',
    'How fresh is the market data shown?',
    'Can I track this price history over time?'
  ],
  scheme_query: [
    'How do I verify eligibility for this scheme?',
    'Which documents are usually required?',
    'Where is the official application portal?'
  ],
  croppath_query: [
    'How does the crop tracker work?',
    'Can I manage multiple farms and plots?',
    'How does the profit calculator use my data?'
  ],
  general_farming: [
    'How much water does my crop need?',
    'How can I improve soil health?',
    'What government schemes can support my farm?'
  ]
};
