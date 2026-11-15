import { NextRequest, NextResponse } from 'next/server';
import { generateVision, describeProviderStatus } from '@/lib/integrations/ai';
import { parseDiseaseReport, DiseaseReport } from '@/lib/services/disease/analysis';
import { APPROVED_SOURCES } from '@/lib/data/mockDatabase';

export const maxDuration = 120;

const SYSTEM_PROMPT = `You are FarmIQ's plant disease analyst. The farmer names their plant and uploads photo(s). Identify the plant, assess visible disease signs, and explain everything in simple, clear, actionable farmer-friendly language.

Return ONLY a JSON object, no markdown fences:
{
  "plant_identified": "plant name you see",
  "plant_match_confirmed": true | false,
  "plant_details": "brief plant overview in plain language (max 35 words)",
  "growing_conditions": "sun, soil and climate conditions (max 35 words)",
  "disease_name": "clean disease or condition name, or 'No clear disease signs visible'",
  "disease_why": "concise root cause in simple terms (max 35 words)",
  "severity": "none" | "early" | "moderate" | "severe" | "uncertain",
  "recovery_steps": ["action-oriented step with clear verb", ...] (max 4),
  "prevention_steps": ["practical preventative measure", ...] (max 4),
  "source_ids": ["ids from the provided list that best support the guidance"] (max 3)
}
Rules:
- Keep all explanations simple, direct, and farmer-friendly. No academic fluff, botanical lectures, or jargon.
- Prioritize clear, practical actions over long paragraphs.
- NEVER give pesticide/fertilizer dosages, chemical names, or product brands. Recovery and prevention must be cultural/hygiene/monitoring/resistant-variety advice plus "consult your local extension officer" where treatment would be needed.
- Only use source_ids from the list provided — never invent sources or URLs.
- If the plant does not match the entered name, set plant_match_confirmed false and explain. If no disease is visible, say so honestly instead of guessing.`;

/**
 * POST /api/disease/analyze — AI disease analysis of a named plant's photos
 * (FIQ-098). Source ids are validated against APPROVED_SOURCES and mapped to
 * real URLs server-side; the model can never supply links. Provider failure
 * degrades to fallback: true — never a 500 (ADR-006: no dosages, ever).
 */
export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 6 * 1024 * 1024) {
      return NextResponse.json(
        { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Photos are too large. Reattach smaller photos (the app compresses them automatically).' } },
        { status: 413 }
      );
    }

    const body = await req.json();
    const plantName = typeof body?.plantName === 'string' ? body.plantName.trim().slice(0, 80) : '';
    const rasterPattern = /^data:image\/(jpeg|png|webp);/;
    const images = Array.isArray(body?.images)
      ? body.images.filter((i: unknown) => typeof i === 'string' && rasterPattern.test(i)).slice(0, 3)
      : [];

    if (plantName.length < 2 || !images.length) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'A plant name and at least one JPEG/PNG/WebP photo are required.' } },
        { status: 400 }
      );
    }

    const status = describeProviderStatus();
    if (!status.generationConfigured) {
      return NextResponse.json({
        data: { report: null, sources: [], providerUsed: null, fallback: true, reason: 'No AI provider configured for image analysis.' }
      });
    }

    const registry = APPROVED_SOURCES.map((s) => `${s.id} — ${s.sourceName} (${s.organization})`).join('\n');
    const userText = `Farmer's plant name: "${plantName}". Attached ${images.length} photo(s) of this plant (check leaves, stems, fruit).
Approved source registry — pick at most 3 relevant ids for source_ids:
${registry}
Return the JSON analysis now.`;

    let result: Awaited<ReturnType<typeof generateVision>> = null;
    try {
      result = await generateVision(SYSTEM_PROMPT, userText, images, 800);
    } catch (error) {
      console.error('[FarmIQ] disease vision analysis failed:', error);
    }

    if (!result) {
      return NextResponse.json({
        data: { report: null, sources: [], providerUsed: null, fallback: true, reason: 'Image analysis is unavailable right now (vision model unreachable or image rejected).' }
      });
    }

    const report: DiseaseReport | null = parseDiseaseReport(result.text, APPROVED_SOURCES.map((s) => s.id));
    if (!report) {
      return NextResponse.json({
        data: { report: null, sources: [], providerUsed: result.modelUsed, fallback: true, reason: 'The analysis could not be structured this time. Try a clearer photo.' }
      });
    }

    const sources = report.sourceIds
      .map((id) => APPROVED_SOURCES.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({ id: s.id, sourceName: s.sourceName, organization: s.organization, canonicalUrl: s.canonicalUrl }));

    return NextResponse.json({
      data: { report, sources, providerUsed: result.modelUsed, fallback: false }
    });
  } catch (error) {
    console.error('[FarmIQ] disease analyze failed:', error);
    return NextResponse.json({
      data: { report: null, sources: [], providerUsed: null, fallback: true, reason: 'Analysis failed this time. Please try again.' }
    });
  }
}
