/**
 * FarmIQ SoilGrids live soil-texture adapter (FIQ-094, v2 Phase 1).
 * Keyless ISRIC/FAO SoilGrids v2 REST — server-side only, hardcoded host.
 * The service is occasionally unreachable/degraded; callers must degrade to
 * the manual soil-type selector rather than guessing texture.
 */

const SOILGRIDS_HOST = 'https://rest.isric.org/soilgrids/v2.0/properties/query';
const TIMEOUT_MS = 8_000;

export interface SoilTexture {
  sandPct: number;
  clayPct: number;
  siltPct: number;
  /** Simplified USDA-style class derived from the three fractions. */
  textureClass: string;
  sourceName: string;
  retrievedAt: string;
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`soilgrids_error_${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function readLayerMean(payload: unknown, property: string): number | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const layers = (payload as Record<string, unknown>).properties;
  if (typeof layers !== 'object' || layers === null) return null;
  const layerList = (layers as Record<string, unknown>).layers;
  if (!Array.isArray(layerList)) return null;
  const layer = layerList.find(
    (l) => typeof l === 'object' && l !== null && (l as Record<string, unknown>).name === property
  );
  if (!layer) return null;
  const rec = layer as Record<string, unknown>;
  const depths = rec.depths;
  if (!Array.isArray(depths) || depths.length === 0) return null;
  const first = depths[0] as Record<string, unknown>;
  const values = first.values as Record<string, unknown> | undefined;
  const mean = values?.mean;
  if (typeof mean !== 'number' || !Number.isFinite(mean)) return null;
  const factor = (rec.unit_measure as Record<string, unknown> | undefined)?.d_factor;
  const d = typeof factor === 'number' && factor > 0 ? factor : 10;
  // Values arrive in mapped units (g/kg); d_factor converts to target (%).
  const pct = mean / d;
  return pct >= 0 && pct <= 100 ? Number(pct.toFixed(1)) : null;
}

/** Simplified texture class — documented as approximate, not a lab analysis. */
export function classifyTexture(sandPct: number, clayPct: number, siltPct: number): string {
  if (clayPct >= 40 && siltPct < 40 && sandPct < 45) return 'Clay';
  if (clayPct >= 35 && sandPct >= 20 && sandPct <= 45) return 'Silty clay';
  if (clayPct >= 27 && clayPct < 40 && siltPct < 28) return 'Clay loam';
  if (clayPct >= 27 && clayPct < 40 && siltPct >= 28) return 'Silty clay loam';
  if (clayPct >= 20 && clayPct < 35 && siltPct < 28 && sandPct >= 45) return 'Sandy clay loam';
  if (clayPct >= 7 && clayPct < 27 && siltPct >= 28 && siltPct < 50 && sandPct <= 52) return 'Loam';
  if (siltPct >= 50 && clayPct >= 12 && clayPct < 27) return 'Silt loam';
  if (siltPct >= 50 && clayPct < 12) return 'Silt';
  if (sandPct >= 70 && clayPct < 15) return 'Sand';
  if (sandPct >= 52 && sandPct < 70 && clayPct < 20 && siltPct < 50) return 'Sandy loam';
  if (clayPct >= 20 && clayPct < 35 && siltPct >= 28 && sandPct <= 45) return 'Sandy clay loam';
  return 'Loam (approx.)';
}

export async function fetchSoilTexture(lat: number, lon: number): Promise<SoilTexture | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const params = new URLSearchParams({
    lon: String(lon),
    lat: String(lat),
    property: 'clay',
    depth: '0-5cm',
    value: 'mean'
  });
  try {
    const clayPayload = await fetchJson(`${SOILGRIDS_HOST}?${params.toString()}`);
    const clayPct = readLayerMean(clayPayload, 'clay');
    if (clayPct === null) return null;

    const sandParams = new URLSearchParams({ lon: String(lon), lat: String(lat), property: 'sand', depth: '0-5cm', value: 'mean' });
    const siltParams = new URLSearchParams({ lon: String(lon), lat: String(lat), property: 'silt', depth: '0-5cm', value: 'mean' });
    const [sandPct, siltPct] = await Promise.all([
      fetchJson(`${SOILGRIDS_HOST}?${sandParams.toString()}`).then((p) => readLayerMean(p, 'sand')).catch(() => null),
      fetchJson(`${SOILGRIDS_HOST}?${siltParams.toString()}`).then((p) => readLayerMean(p, 'silt')).catch(() => null)
    ]);
    if (sandPct === null || siltPct === null) return null;

    return {
      sandPct,
      clayPct,
      siltPct,
      textureClass: classifyTexture(sandPct, clayPct, siltPct),
      sourceName: 'ISRIC SoilGrids v2 (FAO/ISRIC)',
      retrievedAt: new Date().toISOString()
    };
  } catch {
    return null;
  }
}
