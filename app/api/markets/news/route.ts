import { NextRequest, NextResponse } from 'next/server';
import { searchPlaces, reverseGeocode } from '@/lib/integrations/weather/openMeteo';
import { webSearch, isWebFetchEnabled } from '@/lib/integrations/webFetch';

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; payload: unknown }>();

/**
 * POST /api/markets/news — latest agriculture/market news for a location (ADR-019).
 * Resolves the farmer's region, then runs the keyless web-research tools
 * (Bing News RSS + Wikipedia) so the UI shows current articles — not preloaded
 * or years-old material. No search-provider API keys required. Honest
 * unavailable states when disabled, unresolved, or empty — never fabricated
 * headlines.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lat = typeof body?.lat === 'number' && Number.isFinite(body.lat) ? body.lat : null;
    const lon = typeof body?.lon === 'number' && Number.isFinite(body.lon) ? body.lon : null;
    const place = typeof body?.place === 'string' ? body.place.trim().slice(0, 140) : '';
    const labelHint = typeof body?.label === 'string' ? body.label.trim().slice(0, 160) : '';

    if (!isWebFetchEnabled()) {
      return NextResponse.json({
        data: {
          available: false,
          status: 'web_research_disabled',
          location: labelHint || place || null,
          items: [],
          reason: 'Web research is disabled on this server (WEB_FETCH_DISABLED=1), so latest news cannot be fetched.'
        },
        meta: { provider: 'none', retrievedAt: new Date().toISOString() }
      });
    }

    let locationLabel = labelHint;
    if (!locationLabel && lat !== null && lon !== null) {
      const reversed = await reverseGeocode(lat, lon);
      if (reversed) {
        locationLabel = [reversed.name, reversed.admin1, reversed.country].filter(Boolean).join(', ');
      }
    }
    if (!locationLabel && place.length >= 3) {
      const matches = await searchPlaces(place, 1);
      const match = matches[0];
      if (match) {
        locationLabel = [match.name, match.admin1, match.country].filter(Boolean).join(', ');
      }
    }
    if (!locationLabel) locationLabel = place || labelHint;

    if (!locationLabel) {
      return NextResponse.json({
        data: {
          available: false,
          status: 'region_unresolved',
          location: null,
          items: [],
          reason: 'Choose your region (search or GPS) so FarmIQ can look up the latest local agriculture news.'
        },
        meta: { provider: 'web_research', retrievedAt: new Date().toISOString() }
      });
    }

    const cacheKey = `news|${locationLabel.toLowerCase()}`;
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return NextResponse.json(hit.payload);
    }

    const year = new Date().getFullYear();
    const query = `agriculture market farm crop news ${locationLabel} ${year}`;
    const outcome = await webSearch(query, { recent: true });

    const payload =
      outcome.results.length > 0
        ? {
            data: {
              available: true,
              status: 'live',
              location: locationLabel,
              items: outcome.results.map((item) => ({
                title: item.title,
                url: item.url,
                snippet: item.snippet,
                publishedAt: item.publishedAt ?? null,
                sourceDomain: item.source
              })),
              note: `Latest web research results for ${locationLabel} (Bing News RSS + Wikipedia) — fetched live, never preloaded. Open each link to verify; FarmIQ does not invent headlines or prices.`
            },
            meta: {
              provider: 'Web research (Bing News RSS + Wikipedia)',
              retrievedAt: new Date().toISOString()
            }
          }
        : {
            data: {
              available: false,
              status: 'empty',
              location: locationLabel,
              items: [],
              reason:
                outcome.reason ||
                `No recent news results found for ${locationLabel}. Try a broader region name.`
            },
            meta: { provider: 'Web research', retrievedAt: new Date().toISOString() }
          };

    cache.set(cacheKey, { at: Date.now(), payload });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[FarmIQ] markets news fetch failed:', error);
    return NextResponse.json({
      data: {
        available: false,
        status: 'unavailable',
        items: [],
        reason: 'Latest news could not be fetched right now. Try again shortly — no sample headlines are ever shown.'
      },
      meta: { provider: 'none', retrievedAt: new Date().toISOString() }
    });
  }
}
