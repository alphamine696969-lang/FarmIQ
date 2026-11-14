import { NextRequest, NextResponse } from 'next/server';
import { generateAnswer, describeProviderStatus } from '@/lib/integrations/ai';
import { parseAiRanking } from '@/lib/services/cropPath/aiRank';
import { CropGoal } from '@/lib/services/cropPath/types';

export const maxDuration = 120;

const SYSTEM_PROMPT = `You are FarmIQ's crop recommendation engine. You receive a farmer's live field context (forecast, soil, season) and candidate crops with verified agronomic profiles. Decide the ranking that best fits the farmer's goal and the live conditions, and explain each choice briefly.

Return ONLY a JSON object, no markdown fences:
{
  "ranking": ["best-fit crop", "second", ...]  // every candidate exactly once, best first
  "reasons": { "crop": "why it ranks here given the live context (max 30 words)" }
}
Rules:
- Only use the candidate names provided — never invent crops.
- Never invent prices, profit numbers, government schemes, pesticide/fertilizer dosages, or citations.
- Weigh: goal fit, forecast temperatures/rainfall vs the crop's profile ranges, soil texture match, season length vs cycle length, and resilience.`;

interface CandidateInput {
  name: string;
  category: string;
  cycleDays: number;
  resilience: number;
  tempMinC: number;
  tempMaxC: number;
  phMin: number;
  phMax: number;
  rainMinMm: number;
  rainMaxMm: number;
  ruleScore: number;
  seasonSuitable: boolean;
}

/**
 * POST /api/crop-path/recommend — AI recommendation ranking + reasons over
 * the live context (v2 Phase 2, ADR-014). The model only reorders and
 * explains known candidates; agronomic facts come from verified profiles in
 * the prompt, never from the model. Provider failure or invalid output
 * degrades to the deterministic rule ordering (fallback: true) — never a 500.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCandidates = Array.isArray(body?.candidates) ? body.candidates : [];
    const candidates: CandidateInput[] = rawCandidates
      .filter((c: CandidateInput) => c && typeof c.name === 'string')
      .slice(0, 6)
      .map((c: CandidateInput) => ({
        name: String(c.name).slice(0, 60),
        category: String(c.category ?? '').slice(0, 40),
        cycleDays: Number(c.cycleDays) || 0,
        resilience: Number(c.resilience) || 0,
        tempMinC: Number(c.tempMinC) || 0,
        tempMaxC: Number(c.tempMaxC) || 0,
        phMin: Number(c.phMin) || 0,
        phMax: Number(c.phMax) || 0,
        rainMinMm: Number(c.rainMinMm) || 0,
        rainMaxMm: Number(c.rainMaxMm) || 0,
        ruleScore: Number(c.ruleScore) || 0,
        seasonSuitable: c.seasonSuitable !== false
      }));

    if (candidates.length < 2) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'At least two candidate crops are required.' } },
        { status: 400 }
      );
    }

    const status = describeProviderStatus();
    if (!status.generationConfigured) {
      return NextResponse.json({ data: { ranking: [], reasons: {}, providerUsed: null, fallback: true } });
    }

    const goal = String(body?.goal ?? '') as CropGoal;
    const season = String(body?.season ?? 'unknown').slice(0, 20);
    const region = String(body?.region ?? 'not specified').slice(0, 120);
    const context = body?.context && typeof body.context === 'object' ? body.context : {};
    const ctxLines = [
      `Season: ${season}. Region: ${region}.`,
      typeof context.currentTempC === 'number' ? `Current temperature: ${context.currentTempC}°C.` : '',
      typeof context.precip14dMm === 'number' ? `Forecast rainfall next 14 days: ${context.precip14dMm} mm.` : '',
      typeof context.tempMax14C === 'number' ? `Forecast 14-day high: ${context.tempMax14C}°C.` : '',
      typeof context.tempMin14C === 'number' ? `Forecast 14-day low: ${context.tempMin14C}°C.` : '',
      typeof context.soilTexture === 'string' ? `Soil texture: ${context.soilTexture}.` : ''
    ].filter(Boolean).join(' ');

    const userPrompt = [
      `Farmer goal: ${goal || 'unspecified'}. ${ctxLines}`,
      'Candidates (verified profiles). In "ranking" and "reasons" keys use the name field EXACTLY as given:',
      ...candidates.map(
        (c) =>
          `- name="${c.name}" | ${c.category} | cycle ${c.cycleDays}d, resilience ${c.resilience}/10, temp ${c.tempMinC}–${c.tempMaxC}°C, pH ${c.phMin}–${c.phMax}, rainfall ${c.rainMinMm}–${c.rainMaxMm}mm, season ${c.seasonSuitable ? 'suitable' : 'too long'}, deterministic score ${c.ruleScore}.`
      ),
      'Return the JSON ranking now.'
    ].join('\n');

    let ranking: string[] = [];
    let reasons: Record<string, string> = {};
    let providerUsed: string | null = null;
    let fallback = true;

    try {
      const result = await generateAnswer(SYSTEM_PROMPT, [], userPrompt);
      if (result) {
        const parsed = parseAiRanking(result.text, candidates.map((c) => c.name));
        if (parsed) {
          ranking = parsed.ranking;
          reasons = parsed.reasons;
          providerUsed = result.modelUsed;
          fallback = false;
        }
      }
    } catch (error) {
      console.error('[FarmIQ] AI recommendation ranking failed (using rule order):', error);
    }

    return NextResponse.json({
      data: { ranking, reasons, providerUsed, fallback }
    });
  } catch (error) {
    console.error('[FarmIQ] crop-path recommend failed:', error);
    return NextResponse.json({ data: { ranking: [], reasons: {}, providerUsed: null, fallback: true } });
  }
}
