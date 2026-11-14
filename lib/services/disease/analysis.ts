/**
 * FarmIQ disease scanner — structured AI report parser (FIQ-098).
 * The vision model is untrusted: string caps, array caps, severity enum, and
 * source ids restricted to the approved registry (the model can never supply
 * URLs — they are mapped server-side from APPROVED_SOURCES).
 */

export interface DiseaseReport {
  plantIdentified: string;
  plantMatchConfirmed: boolean;
  plantDetails: string;
  growingConditions: string;
  diseaseName: string;
  diseaseWhy: string;
  severity: 'none' | 'early' | 'moderate' | 'severe' | 'uncertain';
  recoverySteps: string[];
  preventionSteps: string[];
  sourceIds: string[];
}

const SEVERITIES = ['none', 'early', 'moderate', 'severe', 'uncertain'] as const;

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function strList(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map((v) => v.trim().slice(0, maxLen))
    .slice(0, maxItems);
}

export function parseDiseaseReport(text: string, knownSourceIds: string[]): DiseaseReport | null {
  if (!text) return null;
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

  const plantDetails = str(rec.plant_details, 500);
  const diseaseName = str(rec.disease_name, 160);
  const growingConditions = str(rec.growing_conditions, 500);
  const diseaseWhy = str(rec.disease_why, 500);
  if (!plantDetails || !diseaseName) return null;

  const severityRaw = typeof rec.severity === 'string' ? rec.severity.toLowerCase().trim() : '';
  const severity = (SEVERITIES as readonly string[]).includes(severityRaw)
    ? (severityRaw as DiseaseReport['severity'])
    : 'uncertain';

  const known = new Set(knownSourceIds);
  const sourceIds = strList(rec.source_ids, 4, 40).filter((id) => known.has(id));

  return {
    plantIdentified: str(rec.plant_identified, 80) || 'Unknown plant',
    plantMatchConfirmed: rec.plant_match_confirmed === true,
    plantDetails,
    growingConditions,
    diseaseName,
    diseaseWhy,
    severity,
    recoverySteps: strList(rec.recovery_steps, 4, 220),
    preventionSteps: strList(rec.prevention_steps, 4, 220),
    sourceIds
  };
}
