/**
 * Layer 5 — Output Guard.
 * Validates the generated answer before it reaches the user (spec section 7).
 * Validation failures return the insufficient-information fallback rather than
 * an unverified answer.
 */

import { INSUFFICIENT_EVIDENCE_RESPONSE } from './retriever';
import { OutputValidation } from './types';

const OFF_DOMAIN_SIGNALS = [
  'As an AI language model',
  'As an AI, I',
  'As ChatGPT',
  'I am ChatGPT',
  'I am Claude',
  'I am Gemini',
  'I am OpenAI',
  'According to my training data',
  'I cannot browse the internet',
  'as a large language model'
];

const UNCERTAINTY_SIGNALS = ['I think', 'I believe', 'probably', 'maybe', "I'm not sure"];

export function validateOutput(response: string): OutputValidation {
  if (response.length < 10) {
    return { valid: false, reason: 'Response too short' };
  }

  if (response.includes('SYSTEM:') || response.includes('<context>') || response.includes('[CHUNK')) {
    return { valid: false, reason: 'Prompt leak detected' };
  }

  for (const signal of OFF_DOMAIN_SIGNALS) {
    if (response.toLowerCase().includes(signal.toLowerCase())) {
      return { valid: false, reason: 'Identity leak' };
    }
  }

  const uncertaintyCount = UNCERTAINTY_SIGNALS.filter((signal) =>
    response.toLowerCase().includes(signal.toLowerCase())
  ).length;
  if (uncertaintyCount >= 3) {
    return { valid: false, reason: 'High uncertainty — possible hallucination' };
  }

  return { valid: true };
}

/** The canned response returned whenever validation fails. */
export function getInsufficientEvidenceResponse(): string {
  return INSUFFICIENT_EVIDENCE_RESPONSE;
}
