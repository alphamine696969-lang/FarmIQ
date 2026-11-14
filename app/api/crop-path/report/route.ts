import { NextRequest, NextResponse } from 'next/server';
import { generateAnswer, describeProviderStatus } from '@/lib/integrations/ai';

export const maxDuration = 120;

const SYSTEM_PROMPT = `You are FarmIQ's crop growth assistant. Given a farmer's weekly crop report, write a short assessment (max 80 words): acknowledge the reported status, note what to watch in the coming week, and give practical non-chemical guidance. Rules:
- Never provide pesticide or fertilizer dosages, brand names, or treatment chemicals.
- Never invent weather data, prices, or citations.
- Be calm, specific, and farmer-friendly. Output plain text only.`;

/**
 * POST /api/crop-path/report — optional AI assessment of a weekly report.
 * Deterministic analysis always runs client-side; this endpoint only enriches
 * it and degrades silently (fallback: true) on any provider failure.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cropName = String(body?.cropName ?? '').slice(0, 60);
    const weekNumber = Number(body?.weekNumber ?? 0);
    const stageLabel = String(body?.stageLabel ?? '').slice(0, 60);

    if (!cropName || !weekNumber) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'cropName and weekNumber are required.' } },
        { status: 400 }
      );
    }

    const status = describeProviderStatus();
    if (!status.generationConfigured) {
      return NextResponse.json({ data: { summary: null, providerUsed: null, fallback: true } });
    }

    const rating = String(body?.rating ?? 'unspecified');
    const issues = String(body?.issues ?? 'none');
    const actions = body?.actionsCompleted && typeof body.actionsCompleted === 'object'
      ? Object.entries(body.actionsCompleted as Record<string, string>)
          .slice(0, 20)
          .map(([k, v]) => `${String(k).slice(0, 120)}: ${String(v).slice(0, 20)}`)
          .join('; ')
          .slice(0, 300)
      : 'none reported';
    const notes = String(body?.notes ?? '').slice(0, 500) || 'none';

    const userPrompt = [
      `Crop: ${cropName}. Week ${weekNumber}, stage: ${stageLabel}.`,
      `Farmer rating: ${rating}. Issues seen: ${issues}.`,
      `Actions completed: ${actions}.`,
      `Farmer notes: ${notes}.`,
      'Write the short weekly assessment.'
    ].join('\n');

    const result = await generateAnswer(SYSTEM_PROMPT, [], userPrompt);
    if (!result) {
      return NextResponse.json({ data: { summary: null, providerUsed: null, fallback: true } });
    }

    const summary = result.text.trim().slice(0, 800);
    return NextResponse.json({
      data: { summary: summary || null, providerUsed: result.modelUsed, fallback: false }
    });
  } catch (error) {
    console.error('[FarmIQ] crop-path report enhancement failed:', error);
    return NextResponse.json({ data: { summary: null, providerUsed: null, fallback: true } });
  }
}
