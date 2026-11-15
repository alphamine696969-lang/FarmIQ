import { NextRequest, NextResponse } from 'next/server';
import {
  fetchWeatherKitSnapshot,
  isWeatherKitConfigured,
  formatWeatherKitCondition,
  WeatherKitSnapshot
} from '@/lib/integrations/weather/weatherKit';
import {
  fetchOpenMeteoAgroSnapshot,
  wmoConditionText,
  OpenMeteoAgroSnapshot
} from '@/lib/integrations/weather/openMeteo';
import { reverseGeocode } from '@/lib/integrations/weather/openMeteo';
import { FarmWeatherSnapshot, AgroWeatherForecastDay, AgroAlert } from '@/lib/data/weatherData';

/** Deterministic agro rules shared by both providers (ADR-020). */
function sprayingRating(precipMm: number, windKmh: number | null): AgroWeatherForecastDay['sprayingWindowRating'] {
  if (windKmh !== null && windKmh > 20 || precipMm >= 4) return 'Unfavorable';
  if ((windKmh !== null && windKmh > 14) || precipMm >= 1) return 'Moderate';
  return 'Excellent';
}

function fieldWorkability(precipMm: number): AgroWeatherForecastDay['fieldWorkability'] {
  if (precipMm >= 15) return 'Saturated Soil';
  if (precipMm >= 5) return 'Moderate';
  return 'Good';
}

function dayName(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('en-US', { weekday: 'long' });
}

function iconFor(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes('thunder') || c.includes('storm')) return 'cloud-lightning';
  if (c.includes('snow') || c.includes('sleet') || c.includes('hail') || c.includes('wintry')) return 'cloud-snow';
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return 'cloud-rain';
  if (c.includes('fog') || c.includes('haze')) return 'cloud-fog';
  if (c.includes('cloud') || c.includes('overcast')) return 'cloud';
  if (c.includes('wind')) return 'wind';
  return 'sun';
}

/**
 * Apple WeatherKit path: atmospheric current + forecast from WeatherKit;
 * soil / ET0 / solar radiation supplemented from Open-Meteo (WeatherKit does
 * not carry those datasets). Supplementary provenance is disclosed.
 */
function buildFromWeatherKit(
  wk: WeatherKitSnapshot,
  om: OpenMeteoAgroSnapshot | null,
  locationName: string,
  lat: number,
  lon: number
): FarmWeatherSnapshot {
  const sourceLabel = 'Apple WeatherKit';
  const forecast: AgroWeatherForecastDay[] = wk.days.map((day) => {
    // Match Open-Meteo ET0 by date for the supplementary dataset.
    const omDay = om?.daily.find((d) => d.date === day.date);
    const wind = day.windSpeedKmh ?? omDay?.windMaxKmh ?? null;
    const humidity = day.humidityPercent ?? omDay?.humidityPct ?? null;
    const condition = formatWeatherKitCondition(day.conditionCode);
    return {
      date: day.date,
      dayName: dayName(day.date),
      tempMaxC: Math.round(day.tempMaxC),
      tempMinC: Math.round(day.tempMinC),
      precipitationMm: Number(day.precipitationMm.toFixed(1)),
      precipitationChance: day.precipitationChancePercent,
      humidityPercent: humidity,
      windSpeedKmh: wind,
      evapotranspirationMm: omDay?.et0Mm ?? null,
      condition,
      icon: iconFor(condition),
      sprayingWindowRating: sprayingRating(day.precipitationMm, wind),
      frostRisk: day.tempMinC <= 2,
      fieldWorkability: fieldWorkability(day.precipitationMm)
    };
  });

  return {
    locationName,
    coordinates: { lat, lng: lon },
    retrievedAt: new Date().toISOString(),
    isSampleData: false,
    provider: sourceLabel,
    current: {
      tempC: Math.round(wk.current.temperatureC),
      feelsLikeC: Math.round(wk.current.feelsLikeC),
      humidityPercent: wk.current.humidityPercent,
      windSpeedKmh: Math.round(wk.current.windSpeedKmh),
      soilTempC: om ? Math.round(om.current.soilTempC ?? 0) : null,
      soilMoisturePercent: om?.current.soilMoisturePercent ?? null,
      solarRadiationWm2: om?.shortwaveWm2 ?? null,
      dewPointC: wk.current.dewPointC === null ? null : Math.round(wk.current.dewPointC),
      uvIndex: wk.current.uvIndex,
      condition: formatWeatherKitCondition(wk.current.conditionCode)
    },
    forecast,
    alerts: [],
    supplementarySource: om ? 'Open-Meteo (soil, solar & ET₀)' : undefined
  };
}

/**
 * Keyless Open-Meteo path (WeatherKit unconfigured/unreachable): full snapshot
 * from one provider, honestly labeled.
 */
function buildFromOpenMeteo(
  om: OpenMeteoAgroSnapshot,
  locationName: string,
  lat: number,
  lon: number
): FarmWeatherSnapshot {
  const condition = wmoConditionText(om.current.weatherCode);
  const forecast: AgroWeatherForecastDay[] = om.daily.map((day) => {
    const dayCondition = wmoConditionText(day.weatherCode);
    const precip = Number.isFinite(day.precipitationMm) ? day.precipitationMm : 0;
    const wind = day.windMaxKmh ?? null;
    return {
      date: day.date,
      dayName: dayName(day.date),
      tempMaxC: Math.round(day.tempMaxC),
      tempMinC: Math.round(day.tempMinC),
      precipitationMm: Number(precip.toFixed(1)),
      precipitationChance: day.precipitationChancePct ?? 0,
      humidityPercent: day.humidityPct,
      windSpeedKmh: wind,
      evapotranspirationMm: day.et0Mm,
      condition: dayCondition,
      icon: iconFor(dayCondition),
      sprayingWindowRating: sprayingRating(precip, wind),
      frostRisk: Number.isFinite(day.tempMinC) && day.tempMinC <= 2,
      fieldWorkability: fieldWorkability(precip)
    };
  });

  return {
    locationName,
    coordinates: { lat, lng: lon },
    retrievedAt: new Date().toISOString(),
    isSampleData: false,
    provider: isWeatherKitConfigured()
      ? 'Open-Meteo (Apple WeatherKit unreachable)'
      : 'Open-Meteo (Apple WeatherKit not configured)',
    current: {
      tempC: Math.round(om.current.tempC),
      feelsLikeC: Math.round(om.current.feelsLikeC),
      humidityPercent: om.current.humidityPercent,
      windSpeedKmh: Math.round(om.current.windSpeedKmh),
      soilTempC: om.current.soilTempC === null ? null : Math.round(om.current.soilTempC),
      soilMoisturePercent: om.current.soilMoisturePercent,
      solarRadiationWm2: om.shortwaveWm2,
      dewPointC: om.current.dewPointC === null ? null : Math.round(om.current.dewPointC),
      uvIndex: om.current.uvIndex,
      condition
    },
    forecast,
    alerts: []
  };
}

/** Threshold alerts derived from the real forecast (provider-neutral wording). */
function deriveAlerts(snapshot: FarmWeatherSnapshot, provider: string): AgroAlert[] {
  const alerts: AgroAlert[] = [];
  const forecast = snapshot.forecast;
  if (forecast.length === 0) return alerts;

  const minWeekTemp = Math.min(...forecast.map((f) => f.tempMinC));
  const winds = forecast.map((f) => f.windSpeedKmh).filter((w): w is number => w !== null);
  const maxWind = winds.length ? Math.max(...winds) : 0;
  const totalWeekPrecip = forecast.reduce((acc, f) => acc + f.precipitationMm, 0);

  if (minWeekTemp <= 2) {
    alerts.push({
      id: `alt-frost-${Date.now()}`,
      alertType: 'Frost Warning',
      severity: 'high',
      title: `Low Temperature Risk (${minWeekTemp}°C)`,
      description: `${provider} forecasts overnight temperatures near freezing. Risk of frost damage to vulnerable crops.`,
      agronomicAction: 'Apply row covers or run micro-sprinklers before sunrise to protect sensitive canopies.',
      issuedAt: new Date().toISOString(),
      validUntil: forecast.find((f) => f.tempMinC <= 2)?.date || new Date().toISOString(),
      sourceProvider: provider
    });
  }

  if (maxWind >= 24) {
    alerts.push({
      id: `alt-wind-${Date.now()}`,
      alertType: 'Optimal Spraying Opportunity',
      severity: 'medium',
      title: `Gusty Winds Foreseen (${maxWind} km/h)`,
      description: `Elevated wind speeds in the ${provider} forecast. Droplet drift risk for chemical or foliar sprays.`,
      agronomicAction: 'Schedule crop protection sprays early in the morning when thermal inversion and surface winds are minimal.',
      issuedAt: new Date().toISOString(),
      validUntil: forecast.find((f) => (f.windSpeedKmh ?? 0) >= 24)?.date || new Date().toISOString(),
      sourceProvider: provider
    });
  }

  if (totalWeekPrecip >= 25) {
    alerts.push({
      id: `alt-rain-${Date.now()}`,
      alertType: 'Foliar Blight Risk',
      severity: 'medium',
      title: `Sustained Moisture (${totalWeekPrecip.toFixed(1)} mm upcoming)`,
      description: `${provider} forecasts sustained rain and high canopy humidity, elevating fungal spore germination.`,
      agronomicAction: 'Inspect crop canopy for early fungal signs and ensure field drainage channels are clear.',
      issuedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 5 * 86400000).toISOString(),
      sourceProvider: provider
    });
  }

  return alerts;
}

/**
 * Build a FarmWeatherSnapshot for coordinates.
 * Order (ADR-020): Apple WeatherKit (primary) → Open-Meteo (keyless fallback).
 * Soil/ET0/solar always come from Open-Meteo when available (WeatherKit does
 * not publish those datasets) and are disclosed via `supplementarySource`.
 * Throws when no provider can serve the location.
 */
async function buildSnapshot(lat: number, lon: number, locationName: string): Promise<FarmWeatherSnapshot> {
  const [wk, om] = await Promise.all([
    isWeatherKitConfigured()
      ? fetchWeatherKitSnapshot(lat, lon, 7).catch(() => null)
      : Promise.resolve(null),
    fetchOpenMeteoAgroSnapshot(lat, lon, 7).catch(() => null)
  ]);

  if (!wk && !om) {
    throw new Error('No weather provider could serve this location (Apple WeatherKit and Open-Meteo both unreachable).');
  }

  let snapshot: FarmWeatherSnapshot;
  if (wk) {
    snapshot = buildFromWeatherKit(wk, om, locationName, lat, lon);
  } else {
    snapshot = buildFromOpenMeteo(om as OpenMeteoAgroSnapshot, locationName, lat, lon);
  }
  snapshot.alerts = deriveAlerts(snapshot, snapshot.provider);
  return snapshot;
}

async function resolveLocationName(lat: number, lon: number, label?: string): Promise<string> {
  if (label && label !== 'Field Location' && label !== 'Selected Field') return label;
  const resolved = await reverseGeocode(lat, lon).catch(() => null);
  return resolved?.name || `Field (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');
  const locationName = searchParams.get('label') || 'Field Location';

  if (!latStr || !lonStr) {
    return NextResponse.json({
      data: null,
      meta: {
        available: false,
        reason: 'Coordinates required. Please provide ?lat=...&lon=... or search for a region.'
      }
    });
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: { code: 'INVALID_COORDINATES', message: 'Latitude and longitude must be valid numbers.' } },
      { status: 400 }
    );
  }

  try {
    const resolvedName = await resolveLocationName(lat, lon, locationName);
    const snapshot = await buildSnapshot(lat, lon, resolvedName);

    return NextResponse.json({
      data: snapshot,
      meta: {
        provider: snapshot.provider,
        supplementarySource: snapshot.supplementarySource ?? null,
        weatherKitConfigured: isWeatherKitConfigured(),
        retrievedAt: new Date().toISOString(),
        isSampleData: false,
        classification: 'live-forecast'
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not fetch live weather.';
    return NextResponse.json(
      { error: { code: 'WEATHER_FETCH_FAILED', message } },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lat = typeof body?.lat === 'number' ? body.lat : parseFloat(body?.lat);
    const lon = typeof body?.lon === 'number' ? body.lon : parseFloat(body?.lon);
    const locationName = typeof body?.label === 'string' ? body.label : 'Selected Field';

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json(
        { error: { code: 'INVALID_COORDINATES', message: 'Valid latitude and longitude numbers are required.' } },
        { status: 400 }
      );
    }

    const snapshot = await buildSnapshot(lat, lon, locationName);

    return NextResponse.json({
      data: snapshot,
      meta: {
        provider: snapshot.provider,
        supplementarySource: snapshot.supplementarySource ?? null,
        weatherKitConfigured: isWeatherKitConfigured(),
        retrievedAt: new Date().toISOString(),
        isSampleData: false
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not fetch live weather.';
    return NextResponse.json(
      { error: { code: 'WEATHER_FETCH_FAILED', message } },
      { status: 502 }
    );
  }
}
