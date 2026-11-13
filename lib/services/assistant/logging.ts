/**
 * Layer 7 — Logging & Evaluation.
 * Every conversation turn is recorded for quality monitoring (spec section 9).
 * Logs are stored in the in-memory ring buffer and, once Supabase is configured
 * (FIQ-020), persisted to the `chatbot_logs` table. No secrets are logged.
 */

import { IntentResult, RetrievalResult, TurnLog } from './types';

const MAX_IN_MEMORY_LOGS = 200;
const inMemoryLogs: TurnLog[] = [];

export interface TurnLogInput {
  userMessage: string;
  intent: IntentResult;
  retrieval: RetrievalResult;
  modelUsed: string;
  response: string;
  outputValid: boolean;
  latencyMs: number;
  userId?: string;
}

export function buildTurnLog(input: TurnLogInput): TurnLog {
  return {
    turn_id: `turn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: input.userId && input.userId.trim().length > 0 ? input.userId : 'anonymous',
    timestamp: new Date().toISOString(),
    user_message: input.userMessage,
    detected_intent: input.intent.label,
    retrieved_chunks: input.retrieval.chunks.map((chunk) => ({
      source: chunk.kbName,
      similarity: Number(chunk.similarity.toFixed(4))
    })),
    model_used: input.modelUsed,
    response: input.response,
    output_valid: input.outputValid,
    latency_ms: Math.round(input.latencyMs)
  };
}

export function recordTurnLog(log: TurnLog): void {
  inMemoryLogs.push(log);
  if (inMemoryLogs.length > MAX_IN_MEMORY_LOGS) {
    inMemoryLogs.shift();
  }
  void persistTurnLog(log);
}

/**
 * Persistence boundary. Supabase insert happens only when the service role key
 * and project URL are configured; failures must never break the user response.
 */
async function persistTurnLog(log: TurnLog): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    try {
      await fetch(`${supabaseUrl}/rest/v1/chatbot_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(log),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    console.warn(
      '[FarmIQ] chatbot_logs persist failed (turn kept in memory).',
      error instanceof Error ? error.message : error
    );
  }
}

/** Read access for tests, dashboards, and eval jobs. */
export function getRecentTurnLogs(): TurnLog[] {
  return [...inMemoryLogs];
}

/** Quality metrics per spec section 9. */
export interface PipelineQualityMetrics {
  totalTurns: number;
  outputGuardPassRate: number;
  retrievalHitRate: number;
  averageLatencyMs: number;
}

export function computeQualityMetrics(logs: TurnLog[] = inMemoryLogs): PipelineQualityMetrics {
  if (logs.length === 0) {
    return { totalTurns: 0, outputGuardPassRate: 0, retrievalHitRate: 0, averageLatencyMs: 0 };
  }
  const guardPasses = logs.filter((log) => log.output_valid).length;
  const retrievalHits = logs.filter((log) => log.retrieved_chunks.length > 0).length;
  const totalLatency = logs.reduce((sum, log) => sum + log.latency_ms, 0);
  return {
    totalTurns: logs.length,
    outputGuardPassRate: guardPasses / logs.length,
    retrievalHitRate: retrievalHits / logs.length,
    averageLatencyMs: totalLatency / logs.length
  };
}
