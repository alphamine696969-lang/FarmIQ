import { NextRequest, NextResponse } from 'next/server';
import { geocodeLocation, fetchOpenMeteoForecast } from '@/lib/integrations/weather/openMeteo';
import { summarizeWeatherForCrop } from '@/lib/services/cropPath/weather';

// Small in-memory cache so tracker views don't hammer the free API.
// Bounded: failures live 60s, good results 10 min, oldest entries evicted at 50.
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_FAIL_TTL_MS = 60 * 1000;
const CACHE_MAX_ENTRIES = 50;
const cache = new Map<string, { at: number; payload: unknown }>();

function cacheSet(key: string, payload: unknown, ok: boolean): void {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), payload });
}

function cacheGet(key: string): { payload: unknown } | null {
  const hit = cache.get(key);
  if (!hit) return null;
  const ttl = (hit.payload as { data?: { available?: boolean } })?.data?.available === true
    ? CACHE_TTL_MS
    : CACHE_FAIL_TTL_MS;
  if (Date.now() - hit.at > ttl) {
    cache.delete(key);
    return null;
  }
  return { payload: hit.payload };
}

function cacheKey(village: string, region: string, crop: string): string {
  return `${village.trim().toLowerCase()}|${region.trim().toLowerCase()}|${crop.trim().toLowerCase()}`;
}

/**
 * POST /api/crop-path/weather — live forecast for a tracker's location via the
 * keyless Open-Meteo provider (allowlisted hosts only). Upstream failure or an
 * unknown place degrades to an honest unavailable response, never a 500.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const village = typeof body?.village === 'string' ? body.village.slice(0, 120) : '';
    const region = typeof body?.region === 'string' ? body.region.slice(0, 120) : '';
    const cropName = typeof body?.cropName === 'string' ? body.cropName.slice(0, 80) : '';
    const query = village || region;

    // A farmer-picked place carries its coordinates: use them directly so the
    // forecast can never land on a wrong fuzzy match.
    const pickedLat = typeof body?.lat === 'number' ? body.lat : null;
    const pickedLon = typeof body?.lon === 'number' ? body.lon : null;
    const pickedLabel = typeof body?.label === 'string' ? body.label.slice(0, 160) : '';
    const hasPicked =
      pickedLat !== null && pickedLon !== null &&
      Number.isFinite(pickedLat) && Number.isFinite(pickedLon) &&
      pickedLat >= -90 && pickedLat <= 90 && pickedLon >= -180 && pickedLon <= 180;

    if (!query && !hasPicked) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'A village, region, or picked place is required to look up weather.' } },
        { status: 400 }
      );
    }

    const key = hasPicked
      ? `@${pickedLat.toFixed(3)},${pickedLon.toFixed(3)}|${cropName}`
      : cacheKey(village, region, cropName);
    const hit = cacheGet(key);
    if (hit) {
      return NextResponse.json(hit.payload);
    }

    let label: string;
    let country: string | undefined;
    let lat: number;
    let lon: number;

    if (hasPicked) {
      lat = pickedLat!;
      lon = pickedLon!;
      label = pickedLabel || `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
    } else {
      const geo = await geocodeLocation(query);
      if (!geo) {
        const payload = {
          data: { available: false, reason: `Could not find a location matching "${query}". Pick a place from the suggestions or edit the field's village/region.` }
        };
        cacheSet(key, payload, false);
        return NextResponse.json(payload);
      }
      label = [geo.name, geo.admin1].filter(Boolean).join(', ');
      country = geo.country;
      lat = geo.latitude;
      lon = geo.longitude;
    }

    const snapshot = await fetchOpenMeteoForecast(lat, lon);
    const summary = summarizeWeatherForCrop(snapshot, label, country, cropName);
    const payload = { data: summary, meta: { provider: 'NASA POWER', isLive: true, retrievedAt: snapshot.retrievedAt } };
    cacheSet(key, payload, true);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[FarmIQ] crop-path weather lookup failed:', error);
    return NextResponse.json({
      data: { available: false, reason: 'Live weather is temporarily unavailable. The tracker keeps working without weather alerts.' }
    });
  }
}
