/**
 * FarmIQ Eurostat live crop-price adapter (FIQ-094, v2 Phase 1/9).
 * Keyless Eurostat dissemination API — official annual crop selling prices
 * (dataset apri_ap_crpouta). Server-side only, hardcoded host. The unit is
 * parsed from Eurostat's own product label (e.g. "prices per 100 kg") — never
 * guessed. Countries outside the EU coverage return null (honest unavailable).
 */

import { LivePriceInfo } from '../../services/cropPath/types';

const EUROSTAT_HOST = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/apri_ap_crpouta';
const DATASET_URL = 'https://ec.europa.eu/eurostat/databrowser/view/apri_ap_crpouta/default/table';
const TIMEOUT_MS = 12_000;

/** Crop keyword → Eurostat CPV product code (labels verified against the live catalogue). */
const CROP_CODE_MAP: Array<{ keywords: string[]; code: string }> = [
  { keywords: ['wheat'], code: '01110000' },
  { keywords: ['maize', 'corn'], code: '01500000' },
  { keywords: ['soybean', 'soya'], code: '02130000' },
  { keywords: ['tomato'], code: '04121000' },
  { keywords: ['chickpea', 'garbanzo'], code: '02992000' },
  { keywords: ['potato'], code: '05120000' },
  { keywords: ['barley'], code: '01300000' },
  { keywords: ['rice'], code: '01600000' },
  { keywords: ['pea'], code: '02210000' },
  { keywords: ['bean'], code: '02220000' },
  { keywords: ['sunflower'], code: '02120000' },
  { keywords: ['rape'], code: '02110000' }
];

/** Display names for every crop the adapter can price (FIQ-100 markets page). */
export const EUROSTAT_MARKET_CROPS: Array<{ name: string; keyword: string }> = [
  { name: 'Wheat', keyword: 'wheat' },
  { name: 'Maize', keyword: 'maize' },
  { name: 'Soybeans', keyword: 'soybean' },
  { name: 'Tomato', keyword: 'tomato' },
  { name: 'Chickpea', keyword: 'chickpea' },
  { name: 'Potato', keyword: 'potato' },
  { name: 'Barley', keyword: 'barley' },
  { name: 'Rice', keyword: 'rice' },
  { name: 'Peas', keyword: 'pea' },
  { name: 'Common bean', keyword: 'bean' },
  { name: 'Sunflower', keyword: 'sunflower' },
  { name: 'Rapeseed', keyword: 'rape' }
];

export interface MarketPriceRow {
  cropName: string;
  price: number;
  unit: string;
  currency: string;
  period: string;
  sourceName: string;
  datasetUrl: string;
  retrievedAt: string;
}

/**
 * Official prices for every mapped crop in one country (parallel fetches).
 * Non-covered crops are silently excluded — the caller shows only real rows.
 */
export async function fetchEurostatAllPrices(countryCode: string): Promise<MarketPriceRow[]> {
  if (!isValidCountryCode(countryCode)) return [];
  const results = await Promise.all(
    EUROSTAT_MARKET_CROPS.map(async (entry) => {
      const info = await fetchEurostatCropPrice(entry.keyword, countryCode);
      if (!info) return null;
      return {
        cropName: entry.name,
        price: info.price,
        unit: info.unit,
        currency: info.currency,
        period: info.period,
        sourceName: info.sourceName,
        datasetUrl: info.datasetUrl,
        retrievedAt: info.retrievedAt
      } satisfies MarketPriceRow;
    })
  );
  return results.filter((row): row is MarketPriceRow => row !== null);
}

export function mapCropToEurostatCode(cropName: string): string | null {
  const lower = cropName.toLowerCase();
  for (const entry of CROP_CODE_MAP) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry.code;
  }
  return null;
}

export function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}

/** Parses "… - prices per 100 kg" style labels into a unit string. */
export function parseUnitFromLabel(label: string): string | null {
  const match = label.match(/prices per ([\d.]+)\s*(kg|litres?)/i);
  if (!match) return null;
  const unit = match[2].toLowerCase();
  return `${match[1]} ${unit.startsWith('litre') ? 'litres' : unit}`;
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`eurostat_error_${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Latest available official annual price for the crop in the given country.
 * Returns null when the country/product is not covered or the payload is
 * malformed — callers must show an honest "price unavailable" state.
 */
export async function fetchEurostatCropPrice(cropName: string, countryCode: string): Promise<LivePriceInfo | null> {
  const code = mapCropToEurostatCode(cropName);
  if (!code || !isValidCountryCode(countryCode)) return null;

  const params = new URLSearchParams({
    format: 'JSON',
    prod_veg: code,
    currency: 'EUR',
    geo: countryCode,
    lang: 'en'
  });

  try {
    const payload = await fetchJson(`${EUROSTAT_HOST}?${params.toString()}`);
    if (typeof payload !== 'object' || payload === null) return null;
    const rec = payload as Record<string, unknown>;
    if ('error' in rec) return null;

    const dimension = rec.dimension as Record<string, unknown> | undefined;
    if (!dimension) return null;
    const prodCat = (dimension.prod_veg as Record<string, unknown> | undefined)?.category as
      | Record<string, unknown>
      | undefined;
    const prodLabels = prodCat?.label as Record<string, string> | undefined;
    const prodLabel = prodLabels?.[code];
    if (!prodLabel) return null;
    const unit = parseUnitFromLabel(prodLabel);
    if (!unit) return null;

    const timeCat = (dimension.time as Record<string, unknown> | undefined)?.category as
      | Record<string, unknown>
      | undefined;
    const timeIndex = timeCat?.index as Record<string, number> | undefined;
    const timeLabels = timeCat?.label as Record<string, string> | undefined;
    const values = rec.value as Record<string, number> | undefined;
    if (!timeIndex || !values) return null;

    // With all other dimensions filtered to one category, JSON-stat value keys
    // are the time indices — pick the latest period with a real number.
    let best: { key: string; year: string; price: number } | null = null;
    for (const [year, idx] of Object.entries(timeIndex)) {
      const price = values[String(idx)];
      if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) continue;
      if (!best || year > best.year) best = { key: String(idx), year, price };
    }
    if (!best) return null;

    return {
      price: best.price,
      unit,
      currency: 'EUR',
      sourceName: 'Eurostat',
      period: timeLabels?.[best.key] || best.year,
      datasetUrl: DATASET_URL,
      retrievedAt: new Date().toISOString()
    };
  } catch {
    return null;
  }
}
