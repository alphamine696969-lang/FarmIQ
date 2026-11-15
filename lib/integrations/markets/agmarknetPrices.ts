/**
 * FarmIQ Indian Mandi / Agmarknet Live Price Adapter
 * Open Government Data (OGD) Platform India — data.gov.in
 * Ministry of Agriculture & Farmers Welfare — Agmarknet
 * 
 * Provides daily wholesale mandi prices across APMC markets in India.
 * Official live data — no sample or mock prices.
 */

import { MarketPriceRow } from './eurostatPrices';
import { LivePriceInfo } from '../../services/cropPath/types';

const DATA_GOV_IN_HOST = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const AGMARKNET_PORTAL_URL = 'https://agmarknet.gov.in/';
const TIMEOUT_MS = 12_000;

export interface AgmarknetRecord {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  variety?: string;
  arrival_date?: string;
  min_price?: string | number;
  max_price?: string | number;
  modal_price?: string | number;
}

export function getMandiApiKey(): string | null {
  const key = process.env.DATA_GOV_IN_API_KEY || process.env.MARKET_DATA_API_KEY || process.env.AGMARKNET_API_KEY;
  if (!key || !key.trim() || key.trim() === '""' || key.trim() === "''") {
    return null;
  }
  return key.trim();
}

/**
 * Fetch all available daily Mandi prices for India or a specific State/District
 */
export async function fetchAgmarknetPrices(state?: string, district?: string): Promise<MarketPriceRow[]> {
  const apiKey = getMandiApiKey();
  if (!apiKey) {
    return [];
  }

  let url = `${DATA_GOV_IN_HOST}?api-key=${encodeURIComponent(apiKey)}&format=json&offset=0&limit=100`;

  if (state && state.trim().length > 2) {
    url += `&filters%5Bstate%5D=${encodeURIComponent(state.trim())}`;
  }
  if (district && district.trim().length > 2) {
    url += `&filters%5Bdistrict%5D=${encodeURIComponent(district.trim())}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.warn(`[Agmarknet] API request failed with HTTP ${res.status}`);
      return [];
    }

    const json = await res.json();
    const records: AgmarknetRecord[] = Array.isArray(json?.records) ? json.records : [];
    if (records.length === 0) {
      return [];
    }

    const seenCommodities = new Map<string, MarketPriceRow>();

    for (const rec of records) {
      const commodity = (rec.commodity || '').trim();
      const modalPriceNum = typeof rec.modal_price === 'number' 
        ? rec.modal_price 
        : parseFloat(String(rec.modal_price || '0'));

      if (!commodity || !Number.isFinite(modalPriceNum) || modalPriceNum <= 0) {
        continue;
      }

      // Avoid duplicates for the same commodity within the same state/district, keep the latest or highest volume
      const key = commodity.toLowerCase();
      if (!seenCommodities.has(key)) {
        const marketLabel = [rec.market, rec.district, rec.state].filter(Boolean).join(', ');
        seenCommodities.set(key, {
          cropName: commodity,
          price: Math.round(modalPriceNum),
          unit: '₹ per quintal (100 kg)',
          currency: 'INR',
          period: rec.arrival_date ? `Mandi Arrival: ${rec.arrival_date}` : 'Daily Mandi Modal Price',
          sourceName: `Agmarknet Mandi (${marketLabel || 'Ministry of Agriculture, India'})`,
          datasetUrl: AGMARKNET_PORTAL_URL,
          retrievedAt: new Date().toISOString(),
        });
      }
    }

    return Array.from(seenCommodities.values());
  } catch (err: any) {
    console.error('[Agmarknet] Failed to fetch live mandi prices:', err?.message || err);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch live Mandi price for a single crop in India
 */
export async function fetchAgmarknetCropPrice(cropName: string, state?: string): Promise<LivePriceInfo | null> {
  const apiKey = getMandiApiKey();
  if (!apiKey) {
    return null;
  }

  const normalized = cropName.trim().toLowerCase();
  let url = `${DATA_GOV_IN_HOST}?api-key=${encodeURIComponent(apiKey)}&format=json&offset=0&limit=25`;
  url += `&filters%5Bcommodity%5D=${encodeURIComponent(cropName.trim())}`;
  if (state && state.trim().length > 2) {
    url += `&filters%5Bstate%5D=${encodeURIComponent(state.trim())}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;

    const json = await res.json();
    const records: AgmarknetRecord[] = Array.isArray(json?.records) ? json.records : [];
    if (records.length === 0) return null;

    const first = records[0];
    const modalPrice = parseFloat(String(first.modal_price || '0'));
    if (!Number.isFinite(modalPrice) || modalPrice <= 0) return null;

    const marketLabel = [first.market, first.district, first.state].filter(Boolean).join(', ');

    return {
      price: Math.round(modalPrice),
      currency: 'INR',
      unit: '₹ per quintal (100 kg)',
      period: first.arrival_date ? `Mandi Arrival: ${first.arrival_date}` : 'Daily Mandi Modal Price',
      sourceName: `Agmarknet (${marketLabel || 'Ministry of Agriculture, India'})`,
      datasetUrl: AGMARKNET_PORTAL_URL,
      retrievedAt: new Date().toISOString(),
    };
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
