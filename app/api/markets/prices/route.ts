import { NextRequest, NextResponse } from 'next/server';
import { searchPlaces, reverseGeocode } from '@/lib/integrations/weather/openMeteo';
import { fetchEurostatAllPrices, MarketPriceRow } from '@/lib/integrations/markets/eurostatPrices';
import { fetchAgmarknetPrices, getMandiApiKey } from '@/lib/integrations/markets/agmarknetPrices';

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, { at: number; payload: unknown }>();

/**
 * POST /api/markets/prices — region-based official crop prices (FIQ-100).
 * Resolves the farmer's region (picked place, typed place, or GPS coordinates)
 * to a country, then returns official Agmarknet (India) or Eurostat (EU) prices.
 * Countries outside the source's coverage return an honest unavailable payload.
 * No sample or mock prices are ever served.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lat = typeof body?.lat === 'number' && Number.isFinite(body.lat) ? body.lat : null;
    const lon = typeof body?.lon === 'number' && Number.isFinite(body.lon) ? body.lon : null;
    const place = typeof body?.place === 'string' ? body.place.trim().slice(0, 140) : '';
    const directCountry = typeof body?.countryCode === 'string' ? body.countryCode.trim().toUpperCase() : '';
    const labelHint = typeof body?.label === 'string' ? body.label.trim().slice(0, 160) : '';

    let countryCode = /^[A-Z]{2}$/.test(directCountry) ? directCountry : '';
    let locationLabel = labelHint;
    let country: string | undefined;
    let state: string | undefined;

    if (!countryCode) {
      if (lat !== null && lon !== null) {
        const reversed = await reverseGeocode(lat, lon);
        if (reversed?.countryCode) {
          countryCode = reversed.countryCode;
          country = reversed.country;
          state = reversed.admin1;
          locationLabel = locationLabel || [reversed.name, reversed.admin1, reversed.country].filter(Boolean).join(', ');
        }
      } else if (place.length >= 3) {
        const matches = await searchPlaces(place, 1);
        const match = matches[0];
        if (match?.countryCode) {
          countryCode = match.countryCode;
          country = match.country;
          state = match.admin1;
          locationLabel = [match.name, match.admin1, match.country].filter(Boolean).join(', ');
        }
      }
    }

    if (!countryCode) {
      return NextResponse.json({
        data: {
          available: false,
          status: 'region_unresolved',
          location: locationLabel || null,
          prices: [],
          reason: place || lat !== null
            ? 'Could not determine the country for that location — pick a place from the suggestions so we can match an official price source.'
            : 'Choose your region (search or GPS) to load official prices for your country.'
        }
      });
    }

    const key = `mkt|${countryCode}|${state || ''}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return NextResponse.json(hit.payload);
    }

    let rows: MarketPriceRow[] = [];
    let providerName = 'Official Price Feed';
    let noteText = '';

    // Route based on region: India (Agmarknet) or EU (Eurostat)
    if (countryCode === 'IN') {
      const apiKey = getMandiApiKey();
      if (!apiKey) {
        const payload = {
          data: {
            available: false,
            status: 'key_required',
            location: { label: locationLabel || 'India', countryCode: 'IN', country: 'India' },
            prices: [],
            reason: 'Official Indian Mandi price feed (Agmarknet via data.gov.in) is ready. To display live APMC wholesale prices, add your data.gov.in API key in .env.local as MARKET_DATA_API_KEY or DATA_GOV_IN_API_KEY.'
          },
          meta: { provider: 'Agmarknet (data.gov.in)', retrievedAt: new Date().toISOString() }
        };
        return NextResponse.json(payload);
      }

      rows = await fetchAgmarknetPrices(state).catch(() => []);
      providerName = 'Agmarknet (Ministry of Agriculture / data.gov.in)';
      noteText = `Official daily Mandi wholesale prices for ${state || 'India'} from Agmarknet via data.gov.in — latest APMC modal rates per quintal.`;
    } else {
      rows = await fetchEurostatAllPrices(countryCode).catch(() => []);
      providerName = 'Eurostat apri_ap_crpouta';
      noteText = `Official producer prices for ${country || countryCode} from Eurostat — latest published period, refreshed live from the source. These are official annual statistics, not a daily market quote.`;
    }

    const payload =
      rows.length > 0
        ? {
            data: {
              available: true,
              status: 'live',
              location: { label: locationLabel || countryCode, countryCode, country },
              prices: rows,
              note: noteText,
            },
            meta: { provider: providerName, retrievedAt: new Date().toISOString() }
          }
        : {
            data: {
              available: false,
              status: 'not_covered',
              location: { label: locationLabel || countryCode, countryCode, country },
              prices: [],
              reason: `No live official price records found for ${locationLabel || country || countryCode}. No sample or mock prices are ever shown.`
            },
            meta: { provider: providerName, retrievedAt: new Date().toISOString() }
          };

    cache.set(key, { at: Date.now(), payload });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[FarmIQ] markets prices fetch failed:', error);
    return NextResponse.json({
      data: {
        available: false,
        status: 'unavailable',
        prices: [],
        reason: 'The official price feed is temporarily unavailable. No sample prices are ever shown — try again shortly.'
      }
    });
  }
}
