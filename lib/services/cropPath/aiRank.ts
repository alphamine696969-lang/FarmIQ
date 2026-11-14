/**
 * FarmIQ CropPath AI recommendation ranking (FIQ-097, ADR-014).
 * Parses and validates the model's ranking JSON: crop names must be a subset
 * of the known candidates (the model can never invent crops), reasons are
 * capped, and anything malformed returns null so callers keep the
 * deterministic rule ordering.
 */

export interface AiRankingResult {
  ranking: string[];
  reasons: Record<string, string>;
}

export function parseAiRanking(text: string, candidates: string[]): AiRankingResult | null {
  if (!text || !candidates.length) return null;
  const unfenced = text.replace(/```(?:json)?/gi, '').trim();
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  if (start < 0 || end <= start) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(unfenced.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const rec = parsed as Record<string, unknown>;

  const known = new Map(candidates.map((c) => [c.toLowerCase(), c]));
  const canonicalize = (raw: string): string | null => {
    const item = raw.trim().toLowerCase();
    const exact = known.get(item);
    if (exact) return exact;
    // Models sometimes echo "Wheat (Cereal / Grain)" — accept a known crop
    // name appearing at the start or as a whole phrase of the echoed label.
    for (const [key, value] of known) {
      if (item.startsWith(`${key} `) || item.startsWith(`${key}(`) || item.startsWith(`${key} -`) || item.startsWith(`${key} —`)) {
        return value;
      }
    }
    return null;
  };

  let ranking: string[] = [];
  if (Array.isArray(rec.ranking)) {
    for (const item of rec.ranking) {
      if (typeof item !== 'string') continue;
      const canonical = canonicalize(item);
      if (canonical && !ranking.includes(canonical)) ranking.push(canonical);
    }
  }
  if (ranking.length < 2) return null; // need a real ordering choice

  const reasons: Record<string, string> = {};
  const recReasons = rec.reasons;
  if (typeof recReasons === 'object' && recReasons !== null) {
    for (const [key, value] of Object.entries(recReasons as Record<string, unknown>)) {
      const canonical = canonicalize(key);
      if (!canonical || typeof value !== 'string') continue;
      const cleaned = value.trim().slice(0, 400);
      if (cleaned) reasons[canonical] = cleaned;
    }
  }

  return { ranking, reasons };
}