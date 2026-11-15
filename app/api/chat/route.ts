import { NextRequest } from 'next/server';
import { runChatPipeline } from '@/lib/services/assistant/pipeline';

export const maxDuration = 180;

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

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      message = String(form.get('message') ?? '');
      mode = (form.get('mode') as 'ask' | 'plan') || 'ask';
      field = String(form.get('field') ?? 'All fields');
      const files = form.getAll('files');
      for (const file of files) {
        if (typeof file === 'object' && file && 'name' in file) {
          fileNames.push((file as File).name);
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

    // Build context-augmented agronomy prompt
    let prompt = message.trim();
    if (fileNames.length > 0) {
      prompt = `[Attached Crop Photos: ${fileNames.join(', ')}] ${prompt}`;
    }
    if (field && field !== 'All fields') {
      prompt = `[Field Context: ${field}] ${prompt}`;
    }
    if (mode === 'plan') {
      prompt = `[Agricultural Planning Mode] Provide a structured agronomic plan, stage-by-stage timeline, and field management schedule for: ${prompt}`;
    }

    const result = await runChatPipeline({ message: prompt });
    let answerText = result.answer;

    // Append safety advisory warnings if present
    if (result.warnings && result.warnings.length > 0) {
      answerText += `\n\n⚠️ Agricultural Safety Advisory:\n` + result.warnings.map((w) => `• ${w}`).join('\n');
    }

    // Append verified citations if present
    if (result.sources && result.sources.length > 0) {
      answerText += `\n\nVerified Sources:\n` + result.sources.map((s) => `• ${s.sourceLabel}${s.url ? ` (${s.url})` : ''}`).join('\n');
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

