/**
 * Server-side configuration for chatbot pipeline providers.
 * Reads environment variables only; never exposes secrets to the client.
 * Missing optional providers must not prevent the assistant from running —
 * unconfigured layers degrade to clearly-labeled deterministic fallbacks.
 *
 * Providers (ADR-009): TokenHarbor OpenAI-compatible gateway for generation,
 * classification, and (opt-in) embeddings; Google Translate for translation;
 * web research tools (ADR-019) — keyless Bing News RSS + Wikipedia + guarded
 * page fetch (WEB_FETCH_DISABLED=1 opts out).
 */

export interface PipelineProviderConfig {
  generation: boolean;
  generationProvider: 'tokenharbor' | 'none';
  embeddings: boolean;
  classifier: boolean;
  retrieval: boolean;
  translation: boolean;
  /** Web research tools for the model (ADR-019): keyless, server-side. */
  webSearch: boolean;
}

function hasKey(...names: string[]): boolean {
  return names.some((name) => Boolean(process.env[name] && process.env[name].trim().length > 0));
}

export function getProviderConfig(): PipelineProviderConfig {
  const generation = hasKey('AI_API_KEY');

  return {
    generation,
    generationProvider: generation ? 'tokenharbor' : 'none',
    // Embeddings require an explicit AI_EMBEDDING_MODEL served by the gateway.
    embeddings: hasKey('AI_API_KEY') && hasKey('AI_EMBEDDING_MODEL'),
    classifier: generation,
    // pgvector retrieval requires the Supabase service role key (FIQ-020 pending).
    retrieval: hasKey('SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_URL'),
    // Google Translate is the implemented translation provider (translation.ts).
    translation: hasKey('GOOGLE_TRANSLATE_API_KEY'),
    // Web research tools (ADR-019): keyless and on by default; opt out with
    // WEB_FETCH_DISABLED=1 (used by offline test runs).
    webSearch: process.env.WEB_FETCH_DISABLED !== '1'
  };
}
