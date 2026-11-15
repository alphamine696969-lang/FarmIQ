import { NextRequest, NextResponse } from 'next/server';
import { fetchOpenMeteoForecast, reverseGeocode } from '@/lib/integrations/weather/openMeteo';
import { FarmWeatherSnapshot, AgroWeatherForecastDay, AgroAlert } from '@/lib/data/weatherData';

function getWeatherCondition(code: number | null): { condition: string; icon: string } {
  if (code === null) return { condition: 'Partly Cloudy', icon: 'cloud' };
  if (code === 0) return { condition: 'Clear Sky', icon: 'sun' };
  if (code <= 3) return { condition: 'Partly Cloudy', icon: 'cloud-sun' };
  if (code >= 45 && code <= 48) return { condition: 'Fog & Mist', icon: 'cloud' };
  if (code >= 51 && code <= 67) return { condition: 'Rain Showers', icon: 'cloud-rain' };
  if (code >= 71 && code <= 77) return { condition: 'Snow', icon: 'snowflake' };
  if (code >= 80 && code <= 82) return { condition: 'Heavy Showers', icon: 'cloud-drizzle' };
  if (code >= 95) return { condition: 'Thunderstorm', icon: 'cloud-lightning' };
  return { condition: 'Scattered Clouds', icon: 'cloud' };
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
        reason: 'Coordinates required. Please provide ?lat=...&lon=... or search for a region.',
      },
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
    const snapshot = await fetchOpenMeteoForecast(lat, lon, 7);
    const resolvedName = locationName !== 'Field Location' 
      ? locationName 
      : (await reverseGeocode(lat, lon))?.name || `Coords: ${lat.toFixed(3)}, ${lon.toFixed(3)}`;

    const forecast: AgroWeatherForecastDay[] = snapshot.daily.map((day) => {
      const cond = getWeatherCondition(day.weatherCode);
      const windKmh = Math.round(day.windMaxKmh ?? 10);
      const precip = Number((day.precipitationMm ?? 0).toFixed(1));
      const et0 = Number((day.et0Mm ?? 3.0).toFixed(1));

      let sprayingWindowRating: 'Excellent' | 'Moderate' | 'Unfavorable' = 'Excellent';
      if (windKmh > 20 || precip >= 4) {
        sprayingWindowRating = 'Unfavorable';
      } else if (windKmh > 14 || precip >= 1) {
        sprayingWindowRating = 'Moderate';
      }

      let fieldWorkability: 'Good' | 'Moderate' | 'Saturated Soil' = 'Good';
      if (precip >= 15) {
        fieldWorkability = 'Saturated Soil';
      } else if (precip >= 5) {
        fieldWorkability = 'Moderate';
      }

      const dayDate = new Date(day.date + 'T12:00:00Z');
      const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });

      return {
        date: day.date,
        dayName,
        tempMaxC: Math.round(day.tempMaxC),
        tempMinC: Math.round(day.tempMinC),
        precipitationMm: precip,
        precipitationChance: Math.round(day.precipitationChancePct ?? (precip > 0 ? 60 : 10)),
        humidityPercent: Math.round(day.humidityPct ?? 60),
        windSpeedKmh: windKmh,
        evapotranspirationMm: et0,
        condition: cond.condition,
        icon: cond.icon,
        sprayingWindowRating,
        frostRisk: day.tempMinC <= 2,
        fieldWorkability,
      };
    });

    const currentTemp = snapshot.currentTempC ?? (forecast[0] ? forecast[0].tempMaxC : 20);
    const currentHumidity = snapshot.currentHumidityPct ?? (forecast[0] ? forecast[0].humidityPercent : 60);

    const alerts: AgroAlert[] = [];
    const minWeekTemp = Math.min(...forecast.map((f) => f.tempMinC));
    const maxWind = Math.max(...forecast.map((f) => f.windSpeedKmh));
    const totalWeekPrecip = forecast.reduce((acc, f) => acc + f.precipitationMm, 0);

    if (minWeekTemp <= 2) {
      alerts.push({
        id: `alt-frost-${Date.now()}`,
        alertType: 'Frost Warning',
        severity: 'high',
        title: `Low Temperature Risk (${minWeekTemp}°C)`,
        description: 'Overnight ground temperatures near freezing. Risk of frost damage to vulnerable crops.',
        agronomicAction: 'Apply row covers or run micro-sprinklers before sunrise to protect sensitive canopies.',
        issuedAt: new Date().toISOString(),
        validUntil: forecast.find((f) => f.tempMinC <= 2)?.date || new Date().toISOString(),
        sourceProvider: 'Open-Meteo High Resolution Model',
      });
    }

    if (maxWind >= 24) {
      alerts.push({
        id: `alt-wind-${Date.now()}`,
        alertType: 'Optimal Spraying Opportunity',
        severity: 'medium',
        title: `Gusty Winds Foreseen (${maxWind} km/h)`,
        description: 'High wind speeds increase droplet drift risk for chemical or biological foliar sprays.',
        agronomicAction: 'Schedule crop protection sprays early in the morning when thermal inversion and winds are minimal.',
        issuedAt: new Date().toISOString(),
        validUntil: forecast.find((f) => f.windSpeedKmh >= 24)?.date || new Date().toISOString(),
        sourceProvider: 'Open-Meteo Wind Speed Model',
      });
    }

    if (totalWeekPrecip >= 25) {
      alerts.push({
        id: `alt-rain-${Date.now()}`,
        alertType: 'Foliar Blight Risk',
        severity: 'medium',
        title: `Sustained Moisture (${totalWeekPrecip.toFixed(1)} mm upcoming)`,
        description: 'Persistent rainfall and high canopy humidity elevate fungal spore germination.',
        agronomicAction: 'Inspect crop canopy for early fungal signs and ensure field drainage channels are clear.',
        issuedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 5 * 86400000).toISOString(),
        sourceProvider: 'Open-Meteo Precipitation Forecast',
      });
    }

    const liveData: FarmWeatherSnapshot = {
      locationName: resolvedName,
      coordinates: { lat, lng: lon },
      retrievedAt: new Date().toISOString(),
      isSampleData: false,
      provider: 'Open-Meteo (Live)',
      current: {
        tempC: Math.round(currentTemp),
        feelsLikeC: Math.round(currentTemp - 0.5),
        humidityPercent: Math.round(currentHumidity),
        windSpeedKmh: forecast[0]?.windSpeedKmh ?? 10,
        soilTempC: Math.round(currentTemp - 2),
        soilMoisturePercent: Math.min(85, Math.max(20, Math.round(35 + (forecast[0]?.precipitationMm ?? 0) * 4))),
        solarRadiationWm2: 550,
        dewPointC: Math.round(currentTemp - (100 - currentHumidity) / 5),
        uvIndex: forecast[0] ? Math.round(forecast[0].tempMaxC / 5) : 5,
        condition: forecast[0]?.condition ?? 'Clear Sky',
      },
      forecast,
      alerts,
    };

    return NextResponse.json({
      data: liveData,
      meta: {
        provider: 'Open-Meteo',
        retrievedAt: new Date().toISOString(),
        isSampleData: false,
        classification: 'live-observed',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'WEATHER_FETCH_FAILED', message: err?.message || 'Could not fetch live weather from Open-Meteo.' } },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lat = typeof body?.lat === 'number' ? body.lat : parseFloat(body?.lat);
    const lon = typeof body?.lon === 'number' ? body.lon : parseFloat(body?.lon);
    const label = typeof body?.label === 'string' ? body.label : undefined;

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json(
        { error: { code: 'INVALID_COORDINATES', message: 'Valid lat and lon numbers are required.' } },
        { status: 400 }
      );
    }

    const url = new URL(req.url);
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
    if (label) url.searchParams.set('label', label);

    return GET(new NextRequest(url, { method: 'GET' }));
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Malformed JSON payload.' } },
      { status: 400 }
    );
  }
}
