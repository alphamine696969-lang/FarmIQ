import { NextRequest, NextResponse } from 'next/server';
import { geocodeLocation, fetchOpenMeteoForecast } from '@/lib/integrations/weather/openMeteo';
import { fetchSoilTexture } from '@/lib/integrations/soil/soilGrids';
import { seasonForLocation, isMonsoonLocation, ForecastDayBrief } from '@/lib/services/cropPath/context';

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; payload: unknown }>();

/**
 * POST /api/crop-path/context — Phase 1 background fetch (v2 workflow).
 * Live 14-day forecast (Open-Meteo), soil texture (SoilGrids), and the
 * international season for a place. Every piece degrades honestly: soil can be
 * null (service degraded), weather failure marks the whole context unavailable.
 * No fabricated data — providers only.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pickedLat = typeof body?.lat === 'number' && Number.isFinite(body.lat) ? body.lat : null;
    const pickedLon = typeof body?.lon === 'number' && Number.isFinite(body.lon) ? body.lon : null;
    const village = typeof body?.village === 'string' ? body.village.slice(0, 120) : '';
    const region = typeof body?.region === 'string' ? body.region.slice(0, 120) : '';
    const label = typeof body?.label === 'string' ? body.label.slice(0, 160) : '';
    const bodyCountryCode = typeof body?.countryCode === 'string' ? body.countryCode.slice(0, 2).toUpperCase() : undefined;

    let lat = pickedLat;
    let lon = pickedLon;
    let locationLabel = label;
    let country: string | undefined;
    let countryCode: string | undefined = bodyCountryCode;

    if (lat === null || lon === null) {
      const query = village || region;
      if (!query) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'A place (lat/lon or village/region) is required.' } },
          { status: 400 }
        );
      }
      const geo = await geocodeLocation(query);
      if (!geo) {
        return NextResponse.json({
          data: { available: false, reason: `Could not find a location matching "${query}". Pick a place from the suggestions.` }
        });
      }
      lat = geo.latitude;
      lon = geo.longitude;
      locationLabel = [geo.name, geo.admin1].filter(Boolean).join(', ');
      country = geo.country;
      countryCode = geo.countryCode || bodyCountryCode;
    } else {
      locationLabel = locationLabel || `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
    }

    const key = `ctx|${lat.toFixed(3)},${lon.toFixed(3)}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return NextResponse.json(hit.payload);
    }

    const [forecast, soil] = await Promise.all([
      fetchOpenMeteoForecast(lat, lon, 14).catch(() => null),
      fetchSoilTexture(lat, lon).catch(() => null)
    ]);

    if (!forecast) {
      const payload = {
        data: { available: false, reason: 'Live weather is temporarily unavailable. Recommendations continue with season and manual inputs.' }
      };
      cache.set(key, { at: Date.now(), payload });
      return NextResponse.json(payload);
    }

    const month = new Date().getMonth() + 1;
    const ctx = seasonForLocation(lat, month, isMonsoonLocation(countryCode, forecast.timezone));

    const days: ForecastDayBrief[] = forecast.daily.map((d) => ({
      date: d.date,
      tempMaxC: d.tempMaxC,
      tempMinC: d.tempMinC,
      precipitationMm: d.precipitationMm,
      precipitationChancePct: d.precipitationChancePct,
      uvIndexMax: d.uvIndexMax,
      humidityPct: d.humidityPct,
      et0Mm: d.et0Mm
    }));

    const payload = {
      data: {
        available: true,
        location: { label: locationLabel, latitude: lat, longitude: lon, country, countryCode },
        season: ctx.season,
        hemisphere: ctx.hemisphere,
        tropical: ctx.tropical,
        currentTempC: forecast.currentTempC,
        currentHumidityPct: forecast.currentHumidityPct,
        days,
        soil: soil || null,
        retrievedAt: forecast.retrievedAt
      },
      meta: {
        providers: ['Open-Meteo (14-day forecast)', soil ? 'ISRIC SoilGrids (soil)' : 'SoilGrids unavailable'],
        isLive: true
      }
    };
    cache.set(key, { at: Date.now(), payload });
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[FarmIQ] crop-path context fetch failed:', error);
    return NextResponse.json({
      data: { available: false, reason: 'Live context data is temporarily unavailable. You can still browse recommendations with manual inputs.' }
    });
  }
}
