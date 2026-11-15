import { NextRequest, NextResponse } from 'next/server';
import { fetchEurostatCropPrice } from '@/lib/integrations/markets/eurostatPrices';
import { fetchAgmarknetCropPrice, getMandiApiKey } from '@/lib/integrations/markets/agmarknetPrices';

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, { at: number; payload: unknown }>();

/**
 * POST /api/crop-path/prices — Phase 1/9 live commodity prices (v2 workflow).
 * Official Agmarknet (India) or Eurostat (EU) crop selling prices.
 * Countries outside coverage (and any provider failure) return an
 * honest per-crop null with a status note — never a fabricated number.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const crops: string[] = Array.isArray(body?.crops)
      ? (body.crops as unknown[]).filter((c): c is string => typeof c === 'string').slice(0, 6)
      : [];
    const countryCode = typeof body?.countryCode === 'string' ? body.countryCode.slice(0, 2).toUpperCase() : '';

    if (!crops.length) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'At least one crop is required.' } },
        { status: 400 }
      );
    }

    const key = `${countryCode}|${crops.join(',')}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return NextResponse.json(hit.payload);
    }

    if (!/^[A-Z]{2}$/.test(countryCode)) {
      const payload = {
        data: {
          prices: Object.fromEntries(crops.map((c: string) => [c, null])),
          status: 'country_unavailable',
          note: 'Pick a place so we know your country — official prices are only shown with a verified country and source.'
        }
      };
      cache.set(key, { at: Date.now(), payload });
      return NextResponse.json(payload);
    }

    let entries: Array<readonly [string, any]> = [];
    let providerName = 'Eurostat apri_ap_crpouta';
    let sourceNote = '';

    if (countryCode === 'IN') {
      const apiKey = getMandiApiKey();
      providerName = 'Agmarknet (data.gov.in)';
      if (!apiKey) {
        const payload = {
          data: {
            prices: Object.fromEntries(crops.map((c: string) => [c, null])),
            status: 'key_required',
            note: 'Agmarknet daily mandi prices available for India — set DATA_GOV_IN_API_KEY in .env.local to activate live APMC rates.'
          },
          meta: { provider: providerName, retrievedAt: new Date().toISOString() }
        };
        cache.set(key, { at: Date.now(), payload });
        return NextResponse.json(payload);
      }

      entries = await Promise.all(
        crops.map(async (crop: string) => [crop, await fetchAgmarknetCropPrice(crop)] as const)
      );
      sourceNote = 'Official daily Mandi modal prices from Agmarknet via data.gov.in.';
    } else {
      entries = await Promise.all(
        crops.map(async (crop: string) => [crop, await fetchEurostatCropPrice(crop, countryCode)] as const)
      );
      sourceNote = 'Official annual prices from Eurostat for your country (latest published period — not a live market quote).';
    }

    const prices = Object.fromEntries(entries);
    const anyLive = Object.values(prices).some((p) => p !== null);

    const payload = {
      data: {
        prices,
        status: anyLive ? 'live' : 'not_covered',
        note: anyLive
          ? sourceNote
          : `No official live price feed found for ${countryCode}. Verify local rates before planning.`
      },
      meta: { provider: providerName, retrievedAt: new Date().toISOString() }
    };
    cache.set(key, { at: Date.now(), payload });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[FarmIQ] crop-path prices fetch failed:', error);
    return NextResponse.json({
      data: {
        prices: {},
        status: 'unavailable',
        note: 'Official price feed is temporarily unavailable. No sample prices are ever shown — verify local rates before planning.'
      }
    });
  }
}
