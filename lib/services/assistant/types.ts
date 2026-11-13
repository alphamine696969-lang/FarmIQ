/**
 * FarmIQ AI Chatbot Pipeline — shared contracts.
 * Implements the layered pipeline spec (md files for work/FARMIQ_AI_CHATBOT_PIPELINE.md):
 * Input Guard -> Intent Classifier -> RAG Retriever -> Context Assembly ->
 * Generation -> Output Guard -> Response -> Logging.
 * Complies with ADR-005 (labeled demo/fallback data) and ADR-006 (abstain on weak evidence).
 */

export type KnowledgeBase =
  | 'kb_crops'
  | 'kb_diseases'
  | 'kb_schemes'
  | 'kb_agronomy'
  | 'kb_markets'
  | 'kb_farmiq';

export const KNOWLEDGE_BASE_LABELS: Record<KnowledgeBase, string> = {
  kb_crops: 'Crop Profiles',
  kb_diseases: 'Disease & Pest Profiles',
  kb_schemes: 'Government Schemes',
  kb_agronomy: 'Agronomy Guides',
  kb_markets: 'Market Guides',
  kb_farmiq: 'FarmIQ Feature Docs'
};

export type IntentLabel =
  | 'crop_advice'
  | 'disease_diagnosis'
  | 'weather_query'
  | 'price_query'
  | 'scheme_query'
  | 'croppath_query'
  | 'general_farming'
  | 'off_topic';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface GuardResult {
  action: 'pass' | 'reject' | 'redirect';
  message: string;
  /** Trimmed message when the raw input exceeded the cap. */
  processedMessage: string;
  reason?: 'empty_input' | 'injection_detected' | 'off_topic';
  matchedPatterns?: string[];
  needsTranslation: boolean;
  translationAvailable: boolean;
}

export interface IntentResult {
  label: IntentLabel;
  confidence: number;
  /** How the label was produced; deterministic fallback is used when no LLM key is configured. */
  method: 'llm_classifier' | 'keyword_fallback';
}

export interface RetrievedChunk {
  chunkId: string;
  kbName: KnowledgeBase;
  content: string;
  sourceId?: string;
  sourceLabel: string;
  sourceUrl?: string;
  similarity: number;
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  /** True when the pgvector-backed provider is active; false = local in-memory index. */
  providerConfigured: boolean;
  method: 'pgvector_rpc' | 'local_lexical_index';
  thresholdUsed: number;
}

export interface AssembledContext {
  systemPrompt: string;
  includedChunks: RetrievedChunk[];
  historyTurns: ChatTurn[];
}

export interface GenerationOutcome {
  answer: string;
  modelUsed: string;
  method: 'llm_generation' | 'extractive_fallback' | 'insufficient_evidence' | 'refusal';
  providerConfigured: boolean;
  skippedReason?: 'weak_retrieval' | 'provider_unconfigured';
}

export interface OutputValidation {
  valid: boolean;
  reason?: string;
}

export interface TurnLog {
  turn_id: string;
  user_id: string;
  timestamp: string;
  user_message: string;
  detected_intent: string;
  retrieved_chunks: Array<{ source: string; similarity: number }>;
  model_used: string;
  response: string;
  output_valid: boolean;
  latency_ms: number;
  user_feedback?: 'thumbs_up' | 'thumbs_down';
}

export interface AssistantSourceRef {
  sourceId?: string;
  sourceLabel: string;
  url?: string;
  section?: string;
  excerpt?: string;
  similarity: number;
}

export interface PipelineResult {
  blocked: boolean;
  answer: string;
  sources: AssistantSourceRef[];
  followUps: string[];
  intent: IntentResult;
  evidenceStatus: 'supported' | 'partial' | 'conflicting' | 'insufficient';
  limitations: string[];
  warnings: string[];
  providerConfigured: {
    generation: boolean;
    embeddings: boolean;
    translation: boolean;
    retrieval: boolean;
  };
  log: TurnLog;
}

/** Body accepted by POST /api/assistant/chat. */
export interface AssistantChatRequestBody {
  message: string;
  history?: ChatTurn[];
  userId?: string;
}
