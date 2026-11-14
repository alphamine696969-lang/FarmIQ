import { NextRequest, NextResponse } from 'next/server';
import { searchPlaces, reverseGeocode } from '@/lib/integrations/weather/openMeteo';
import { fetchEurostatAllPrices, MarketPriceRow } from '@/lib/integrations/markets/eurostatPrices';

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, { at: number; payload: unknown }>();

/**
 * POST /api/markets/prices — region-based official crop prices (FIQ-100).
 * Resolves the farmer's region (picked place, typed place, or GPS coordinates)
 * to a country, then returns official Eurostat producer prices for every crop
 * the source covers. Countries outside the source's coverage return an honest
 * unavailable payload — this route never serves sample or invented prices.
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

    if (!countryCode) {
      if (lat !== null && lon !== null) {
        const reversed = await reverseGeocode(lat, lon);
        if (reversed?.countryCode) {
          countryCode = reversed.countryCode;
          country = reversed.country;
          locationLabel = locationLabel || [reversed.name, reversed.admin1, reversed.country].filter(Boolean).join(', ');
        }
      } else if (place.length >= 3) {
        const matches = await searchPlaces(place, 1);
        const match = matches[0];
        if (match?.countryCode) {
          countryCode = match.countryCode;
          country = match.country;
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

    const key = `mkt|${countryCode}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return NextResponse.json(hit.payload);
    }

    const rows: MarketPriceRow[] = await fetchEurostatAllPrices(countryCode).catch(() => []);
    const payload =
      rows.length > 0
        ? {
            data: {
              available: true,
              status: 'live',
              location: { label: locationLabel || countryCode, countryCode, country },
              prices: rows,
              note: `Official producer prices for ${country} from Eurostat — latest published period, refreshed live from the source. These are official annual statistics, not a daily market quote.`
            },
            meta: { provider: 'Eurostat apri_ap_crpouta', retrievedAt: new Date().toISOString() }
          }
        : {
            data: {
              available: false,
              status: 'not_covered',
              location: { label: locationLabel || countryCode, countryCode, country },
              prices: [],
              reason: `No live official price feed is connected for ${country} yet. Official prices currently cover the EU (Eurostat). No sample prices are ever shown — verify local rates with your local market or extension service.`
            },
            meta: { provider: 'Eurostat apri_ap_crpouta', retrievedAt: new Date().toISOString() }
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
