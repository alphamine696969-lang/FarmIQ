import { NextRequest, NextResponse } from 'next/server';
import { analyzeCropPhotos, describeProviderStatus } from '@/lib/integrations/ai';
import { parseVisionReport } from '@/lib/services/cropPath/vision';

export const maxDuration = 120;

/**
 * POST /api/crop-path/photo — Phase 7 image analysis of weekly report photos.
 * Uses the configured vision model (AI_VISION_MODEL, default mimo-v2.6-flash:free)
 * and parses its structured JSON (stage match, disease/nutrient observations,
 * maturity). Provider failure degrades to fallback: true — never a 500 — so the
 * UI can show an honest "photo analysis unavailable" note. No dosages ever
 * (ADR-006); findings are observational and advisory.
 */
export async function POST(req: NextRequest) {
  try {
    // Bound the request: 3 compressed photos ≈ 200 KB each, allow generous headroom.
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 6 * 1024 * 1024) {
      return NextResponse.json(
        { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Photos are too large. Reattach smaller photos (the app compresses them automatically).' } },
        { status: 413 }
      );
    }

    const body = await req.json();
    const cropName = String(body?.cropName ?? '').slice(0, 60);
    const weekNumber = Number(body?.weekNumber ?? 0);
    const stageLabel = String(body?.stageLabel ?? '').slice(0, 60);
    const rasterPattern = /^data:image\/(jpeg|png|webp);/;
    const images = Array.isArray(body?.images)
      ? body.images.filter((i: unknown) => typeof i === 'string' && rasterPattern.test(i)).slice(0, 3)
      : [];

    if (!cropName || !weekNumber || !images.length) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'cropName, weekNumber and at least one JPEG/PNG/WebP photo are required.' } },
        { status: 400 }
      );
    }

    const status = describeProviderStatus();
    if (!status.generationConfigured) {
      return NextResponse.json({
        data: { analysis: null, report: null, providerUsed: null, fallback: true, reason: 'No AI provider configured.' }
      });
    }

    const result = await analyzeCropPhotos(images.slice(0, 3), cropName, weekNumber, stageLabel);
    if (!result) {
      return NextResponse.json({
        data: { analysis: null, report: null, providerUsed: null, fallback: true, reason: 'Photo analysis is not available right now (vision model unreachable or image rejected).' }
      });
    }

    const report = parseVisionReport(result.text);
    return NextResponse.json({
      data: {
        analysis: report?.notes || result.text.slice(0, 800),
        report,
        providerUsed: result.modelUsed,
        fallback: false
      }
    });
  } catch (error) {
    console.error('[FarmIQ] crop-path photo analysis failed:', error);
    return NextResponse.json({
      data: { analysis: null, report: null, providerUsed: null, fallback: true, reason: 'Photo analysis failed this time. You can submit the report without it.' }
    });
  }
}
