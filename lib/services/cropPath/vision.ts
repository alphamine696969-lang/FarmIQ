/**
 * FarmIQ CropPath Phase 7 — structured vision report (FIQ-094).
 * Parses the vision model's JSON output defensively. The model is untrusted:
 * enum values are whitelisted, arrays capped, and anything malformed returns
 * null so callers fall back to the honest plain-text path.
 */

import { StageMatch } from './types';

export interface VisionReport {
  stageMatch: StageMatch;
  diseaseSigns: string[];
  nutrientFlags: string[];
  severity: 'none' | 'early' | 'moderate' | 'severe';
  /** true = maturity cues visible, false = not mature, null = not assessable. */
  maturityConfirmed: boolean | null;
  notes: string;
}

const STAGE_MATCHES: StageMatch[] = ['on_schedule', 'behind_1_week', 'behind_2_plus', 'ahead', 'uncertain'];
const SEVERITIES = ['none', 'early', 'moderate', 'severe'] as const;

function cleanStringList(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map((v) => v.trim().slice(0, 200))
    .slice(0, max);
}

export function parseVisionReport(text: string): VisionReport | null {
  if (!text || typeof text !== 'string') return null;
  // Strip markdown fences if the model wrapped the JSON.
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

  const stageRaw = typeof rec.stage_match === 'string' ? rec.stage_match.toLowerCase().trim() : '';
  const stageMatch = (STAGE_MATCHES as string[]).includes(stageRaw) ? (stageRaw as StageMatch) : 'uncertain';

  const severityRaw = typeof rec.severity === 'string' ? rec.severity.toLowerCase().trim() : '';
  const severity = (SEVERITIES as readonly string[]).includes(severityRaw)
    ? (severityRaw as VisionReport['severity'])
    : 'none';

  const maturityRaw = rec.maturity_confirmed;
  const maturityConfirmed =
    maturityRaw === true ? true : maturityRaw === false ? false : null;

  const notes = typeof rec.notes === 'string' ? rec.notes.trim().slice(0, 600) : '';

  return {
    stageMatch,
    diseaseSigns: cleanStringList(rec.disease_signs, 3),
    nutrientFlags: cleanStringList(rec.nutrient_flags, 3),
    severity,
    maturityConfirmed,
    notes
  };
}

/** Heuristic health score 0–100 (Phase 7 Step 5) — explicitly a heuristic, not a model metric. */
export function computeHealthScore(
  rating: 'very_good' | 'good' | 'average' | 'worried',
  stageMatch: StageMatch | undefined,
  issues: 'none' | 'pests' | 'disease' | 'other'
): number {
  const base = rating === 'very_good' ? 90 : rating === 'good' ? 75 : rating === 'average' ? 60 : 40;
  let stageAdj = 0;
  if (stageMatch === 'on_schedule' || stageMatch === 'ahead') stageAdj = 5;
  else if (stageMatch === 'behind_1_week') stageAdj = -8;
  else if (stageMatch === 'behind_2_plus') stageAdj = -15;
  const issueAdj = issues === 'disease' ? -15 : issues === 'pests' ? -10 : issues === 'other' ? -5 : 0;
  return Math.min(100, Math.max(5, base + stageAdj + issueAdj));
}
