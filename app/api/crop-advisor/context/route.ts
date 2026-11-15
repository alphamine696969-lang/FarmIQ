import { NextRequest, NextResponse } from 'next/server';
import { searchPlaces, fetchRecentClimate, fetchOpenMeteoForecast } from '@/lib/integrations/weather/openMeteo';
import { fetchSoilTexture } from '@/lib/integrations/soil/soilGrids';

export const maxDuration = 30;
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; payload: unknown }>();

/**
 * POST /api/crop-advisor/context — live context for the Crop Advisor (FIQ-099).
 * Observed 90-day climate (temperature + rainfall) and SoilGrids soil (texture
 * + pH) for a location. Every piece degrades honestly to null with a reason —
 * the advisor then falls back to manual sliders, never to invented values.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lat = typeof body?.lat === 'number' && Number.isFinite(body.lat) ? body.lat : null;
    const lon = typeof body?.lon === 'number' && Number.isFinite(body.lon) ? body.lon : null;
    const place = typeof body?.place === 'string' ? body.place.trim().slice(0, 140) : '';
    const labelHint = typeof body?.label === 'string' ? body.label.trim().slice(0, 160) : '';

    let latitude = lat;
    let longitude = lon;
    let label = labelHint;
    let country: string | undefined;
    let countryCode: string | undefined;

    if (latitude === null || longitude === null) {
      if (place.length < 3) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Pick a location from the suggestions or allow GPS.' } },
          { status: 400 }
        );
      }
      const matches = await searchPlaces(place, 1);
      const match = matches[0];
      if (!match) {
        return NextResponse.json({
          data: {
            available: false,
            reason: `No place found for "${place}". Try a different spelling or pick from the suggestions.`
          }
        });
      }
      latitude = match.latitude;
      longitude = match.longitude;
      label = [match.name, match.admin1, match.country].filter(Boolean).join(', ');
      country = match.country;
      countryCode = match.countryCode;
    }

    if (latitude === null || longitude === null) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'A location (lat/lon or place name) is required.' } },
        { status: 400 }
      );
    }

    const key = `adv|${latitude.toFixed(3)},${longitude.toFixed(3)}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return NextResponse.json(hit.payload);
    }

    const [climate, soil, forecast] = await Promise.all([
      fetchRecentClimate(latitude, longitude).catch(() => null),
      fetchSoilTexture(latitude, longitude).catch(() => null),
      fetchOpenMeteoForecast(latitude, longitude, 7).catch(() => null)
    ]);

    const reasons: string[] = [];
    if (!climate) reasons.push('Recent observed climate unavailable — temperature and rainfall sliders stay manual.');
    if (!soil) reasons.push('SoilGrids unavailable — soil texture and pH stay manual.');
    if (!forecast && !climate && !soil) {
      return NextResponse.json({
        data: { available: false, reason: 'Live data services are temporarily unavailable. Use the manual sliders to continue.' }
      });
    }

    const payload = {
      data: {
        available: true,
        location: {
          label: label || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
          latitude,
          longitude,
          country,
          countryCode
        },
        climate: climate
          ? {
              avgTempC: climate.avgTempC,
              totalPrecipMm: climate.totalPrecipMm,
              windowDays: climate.windowDays,
              daysCounted: climate.daysCounted,
              sourceName: climate.sourceName,
              retrievedAt: climate.retrievedAt
            }
          : null,
        soil: soil
          ? {
              textureClass: soil.textureClass,
              ph: soil.ph,
              sourceName: soil.sourceName,
              retrievedAt: soil.retrievedAt
            }
          : null,
        currentTempC: forecast?.currentTempC ?? null,
        reasons,
        retrievedAt: new Date().toISOString()
      },
      meta: {
        providers: [
          climate ? 'Open-Meteo (observed 90-day)' : 'Climate unavailable',
          soil ? 'ISRIC SoilGrids (soil)' : 'SoilGrids unavailable'
        ],
        isLive: Boolean(climate || soil)
      }
    };
    cache.set(key, { at: Date.now(), payload });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[FarmIQ] crop-advisor context failed:', error);
    return NextResponse.json({
      data: { available: false, reason: 'Live location data is temporarily unavailable. Use the manual sliders to continue.' }
    });
  }
}
