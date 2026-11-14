import { NextRequest, NextResponse } from 'next/server';
import { fetchEurostatCropPrice } from '@/lib/integrations/markets/eurostatPrices';

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, { at: number; payload: unknown }>();

/**
 * POST /api/crop-path/prices — Phase 1/9 live commodity prices (v2 workflow).
 * Official Eurostat annual crop selling prices for the farmer's country.
 * Countries outside Eurostat coverage (and any provider failure) return an
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

    const entries = await Promise.all(
      crops.map(async (crop: string) => [crop, await fetchEurostatCropPrice(crop, countryCode)] as const)
    );
    const prices = Object.fromEntries(entries);
    const anyLive = Object.values(prices).some((p) => p !== null);

    const payload = {
      data: {
        prices,
        status: anyLive ? 'live' : 'not_covered',
        note: anyLive
          ? 'Official annual prices from Eurostat for your country (latest published period — not a live market quote).'
          : `Eurostat publishes official crop prices for EU countries only — no official live price feed is connected for ${countryCode}. Verify local rates before planning.`
      },
      meta: { provider: 'Eurostat apri_ap_crpouta', retrievedAt: new Date().toISOString() }
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
