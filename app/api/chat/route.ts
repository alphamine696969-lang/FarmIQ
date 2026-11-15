import { NextRequest } from 'next/server';
import { runChatPipeline } from '@/lib/services/assistant/pipeline';
import { generateVision } from '@/lib/integrations/ai';

export const maxDuration = 180;

function normalizeAgronomyText(text: string): string {
  let cleaned = text;

  // 0. Strip any leaked tool-call markup (<invoke>/<function_calls>/<parameter>)
  cleaned = cleaned
    .replace(/<\/?(?:antml:)?function_calls>/gi, '')
    .replace(/<(?:antml:)?invoke\b[^>]*>[\s\S]*?<\/(?:antml:)?invoke>/gi, '')
    .replace(/<\/?(?:antml:)?invoke\b[^>]*>/gi, '')
    .replace(/<(?:antml:)?parameter\b[^>]*>[\s\S]*?<\/(?:antml:)?parameter>/gi, '')
    .replace(/<\/?(?:antml:)?parameter\b[^>]*>/gi, '');

  // 1. Scrub internal knowledge-base tags like [Crop Profiles / kb_diseases] or [CHUNK 1 — ...]
  cleaned = cleaned
    .replace(/\[\s*(?:Crop Profiles\s*\/\s*)?kb_[a-z0-9_-]+[^\]]*\]/gi, '')
    .replace(/\[\s*CHUNK\s*\d+[^\]]*\]/gi, '')
    .replace(/\[\s*Source:\s*kb_[a-z0-9_-]+[^\]]*\]/gi, '');

  // 2. Remove unfinished cutoff phrases at the end like "**Important:** I don't have"
  cleaned = cleaned
    .replace(/\s*\*\*Important:\*\*\s*(?:I don'?t have|Note:)?\s*$/i, '')
    .replace(/\s*\*\*(?:Note|Warning|Important):\*\*\s*$/i, '')
    .trim();

  // 3. Ensure bullet points start on their own lines
  cleaned = cleaned.replace(/([^\n])\s+[-•]\s+/g, '$1\n- ');

  // 4. Ensure bold section headings start on their own lines
  cleaned = cleaned.replace(/([^\n])\s+(\*\*[^*:]+:\*\*)/g, '$1\n\n$2\n');

  // 5. Clean up duplicate newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

/**
 * POST /api/chat — Plain-text streaming chat route for ChatPage.
 * Expects JSON or FormData with message, mode ('ask' | 'plan'), field, and optional files.
 * Streams plain text back as specified in FARMIQ-SETUP-ALL-PLATFORMS.md.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let message = '';
    let mode: 'ask' | 'plan' = 'ask';
    let field = 'All fields';
    const fileNames: string[] = [];
    const imageUrls: string[] = [];
    const docSnippets: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      message = String(form.get('message') ?? '');
      mode = (form.get('mode') as 'ask' | 'plan') || 'ask';
      field = String(form.get('field') ?? 'All fields');
      const files = form.getAll('files');
      for (const file of files) {
        if (typeof file === 'object' && file && 'name' in file) {
          const f = file as File;
          fileNames.push(f.name);
          if (f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(f.name)) {
            try {
              const buf = await f.arrayBuffer();
              const base64 = Buffer.from(buf).toString('base64');
              const mime = f.type || 'image/jpeg';
              imageUrls.push(`data:${mime};base64,${base64}`);
            } catch (e) {
              console.warn('[FarmIQ] Failed to read image buffer:', f.name, e);
            }
          } else if (f.type.includes('text') || /\.(txt|csv|json|md)$/i.test(f.name)) {
            try {
              const text = await f.text();
              docSnippets.push(`[Attached Document: ${f.name}]\n${text.slice(0, 2500)}`);
            } catch (e) {
              console.warn('[FarmIQ] Failed to read document text:', f.name, e);
            }
          }
        }
      }
    } else {
      const json = await req.json();
      message = json.message ?? '';
      mode = json.mode || 'ask';
      field = json.field || 'All fields';
    }

    if (!message.trim() && fileNames.length === 0) {
      return new Response('A question or attachment is required.', { status: 400 });
    }

    let answerText = '';

    // 1. If crop or soil photos are attached, perform multimodal AI vision analysis
    if (imageUrls.length > 0) {
      try {
        const visionSystemPrompt = `You are FarmIQ Agronomic AI. You are examining photos attached by a farmer.
Analyze the images thoroughly:
1. Plant & Crop Identification: Name the crop, variety, or growth stage visible.
2. Visual Symptoms & Pathology: Detail visible discoloration, lesions, blight, wilting, curling, insect damage, or deficiency patterns.
3. Agronomic Assessment: Provide candidate diagnosis or health status.
4. Immediate Organic & Cultural Actions: Actionable steps (pruning, irrigation changes, air circulation, sanitation, bio-fungicides). Strictly avoid unverified pesticide dosages (ADR-006).
5. Future Disease Prevention: Practical rotation, seed treatment, and soil health tips.`;

        const userQuery = message.trim() || 'Please examine the attached plant/crop photos, identify any issues or diseases, and advise on management.';
        const visionUserPrompt = `[Field: ${field}]\nUser question: "${userQuery}"`;

        const visionResult = await generateVision(visionSystemPrompt, visionUserPrompt, imageUrls.slice(0, 3), 1000);
        if (visionResult?.text) {
          answerText = visionResult.text.trim();
        }
      } catch (err) {
        console.warn('[FarmIQ] Multimodal vision analysis fallback to chat pipeline:', err);
      }
    }

    // 2. If no vision analysis (or text-focused chat), run the conversational pipeline
    if (!answerText) {
      let prompt = message.trim();
      if (fileNames.length > 0) {
        prompt = `[Attached Files: ${fileNames.join(', ')}] ${prompt}`;
      }
      if (docSnippets.length > 0) {
        prompt = `${docSnippets.join('\n\n')}\n\n${prompt}`;
      }
      if (field && field !== 'All fields') {
        prompt = `[Field Context: ${field}] ${prompt}`;
      }
      if (mode === 'plan') {
        prompt = `[Agricultural Planning Mode] Provide a structured agronomic plan, stage-by-stage timeline, and field management schedule for: ${prompt}`;
      }

      const result = await runChatPipeline({ message: prompt });
      answerText = normalizeAgronomyText(result.answer);

      // Append safety advisory warnings if present
      if (result.warnings && result.warnings.length > 0) {
        answerText += `\n\n⚠️ Agricultural Safety Advisory:\n` + result.warnings.map((w) => `• ${w}`).join('\n');
      }

      // Append verified citations as clickable markdown links
      if (result.sources && result.sources.length > 0) {
        answerText +=
          `\n\nVerified Sources:\n` +
          result.sources
            .map((s) =>
              s.url
                ? `• [${s.sourceLabel}](${s.url})`
                : `• ${s.sourceLabel}`
            )
            .join('\n');
      }
    } else {
      answerText = normalizeAgronomyText(answerText);
    }

    // Stream the plain text back in word chunks for fluid animation
    const encoder = new TextEncoder();
    const parts = answerText.split(/(\s+)/);

    const stream = new ReadableStream({
      async start(controller) {
        for (const part of parts) {
          controller.enqueue(encoder.encode(part));
          await new Promise((r) => setTimeout(r, 20));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (err) {
    console.error('[FarmIQ] /api/chat stream pipeline error:', err);
    return new Response('I could not reach the FarmIQ knowledge base just now. Please try again.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

