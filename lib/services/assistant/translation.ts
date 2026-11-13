/**
 * Translation boundary for multilingual input/output (spec sections 1 and 8).
 * Google Translate (Cloud Translation v2 REST) is the implemented provider.
 * When its key is missing the pipeline proceeds without translation and
 * discloses the limitation instead of pretending the message was understood
 * in its original language.
 */

const TRANSLATE_TIMEOUT_MS = 15_000;

export function isTranslationConfigured(): boolean {
  return Boolean(process.env.GOOGLE_TRANSLATE_API_KEY && process.env.GOOGLE_TRANSLATE_API_KEY.trim().length > 0);
}

/** Best-effort script detection mapped to a translation target language. */
export function detectTargetLanguage(text: string): string {
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa'; // Gurmukhi (Punjabi)
  if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Devanagari (Hindi)
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu
  if (/[\u0600-\u06FF]/.test(text)) return 'ar'; // Arabic
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh'; // Chinese
  if (/[\u3040-\u30FF]/.test(text)) return 'ja'; // Japanese
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko'; // Korean
  if (/[\u0400-\u04FF]/.test(text)) return 'ru'; // Cyrillic
  return 'en';
}

/**
 * Translate text with Google Translate v2 (API-key REST). Returns null when
 * unconfigured or the request fails — callers must handle null honestly.
 */
export async function translateText(text: string, targetLanguage: string): Promise<string | null> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key || !key.trim()) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key.trim())}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, target: targetLanguage, format: 'text' }),
        signal: controller.signal
      }
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      data?: { translations?: Array<{ translatedText?: unknown }> };
    };
    const translated = payload.data?.translations?.[0]?.translatedText;
    return typeof translated === 'string' && translated.length > 0 ? translated : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
