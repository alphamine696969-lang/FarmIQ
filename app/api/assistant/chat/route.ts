import { NextRequest, NextResponse } from 'next/server';
import { runChatPipeline } from '@/lib/services/assistant/pipeline';

// Free-tier gateway completions can queue for ~100s; give the function headroom
// on Vercel (ignored by local dev).
export const maxDuration = 180;

/**
 * POST /api/assistant/chat — FarmIQ AI chatbot pipeline endpoint.
 * Runs the full layered pipeline (input guard, intent classification, retrieval,
 * context assembly, generation, output guard, logging) and returns a typed
 * envelope. Provider keys are read server-side only; unconfigured providers
 * degrade to clearly-labeled deterministic fallbacks.
 */
export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const body = await req.json();
    const message = body?.message ?? body?.query;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'A message string is required.'
          }
        },
        { status: 400 }
      );
    }

    const history = Array.isArray(body?.history) ? body.history : undefined;
    const userId = typeof body?.userId === 'string' ? body.userId : undefined;

    const result = await runChatPipeline({ message, history, userId });

    return NextResponse.json({
      data: {
        answer: result.answer,
        intent: result.intent,
        sources: result.sources,
        followUps: result.followUps,
        evidenceStatus: result.evidenceStatus,
        limitations: result.limitations,
        warnings: result.warnings,
        blocked: result.blocked,
        providerConfigured: result.providerConfigured
      },
      meta: {
        retrievedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
        citationCount: result.sources.length,
        modelUsed: result.log.model_used,
        turnId: result.log.turn_id
      }
    });
  } catch (error) {
    console.error('[FarmIQ] assistant chat pipeline failed:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while processing your question. Please try again.'
        }
      },
      { status: 500 }
    );
  }
}
