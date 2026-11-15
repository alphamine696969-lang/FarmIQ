import { NextRequest, NextResponse } from 'next/server';
import { fetchNasaPowerSnapshot, fetchNasaPowerClimatology } from '@/lib/integrations/weather/nasaPower';
import { reverseGeocode } from '@/lib/integrations/weather/openMeteo';
import { FarmWeatherSnapshot, AgroWeatherForecastDay, AgroAlert } from '@/lib/data/weatherData';

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
    const [snapshot, climatology] = await Promise.all([
      fetchNasaPowerSnapshot(lat, lon, 7),
      fetchNasaPowerClimatology(lat, lon).catch((err) => {
        console.warn('[NASA POWER] Climatology non-critical warning:', err);
        return null;
      }),
    ]);

    const resolvedName = locationName !== 'Field Location'
      ? locationName
      : (await reverseGeocode(lat, lon).catch(() => null))?.name || `Field (${lat.toFixed(3)}, ${lon.toFixed(3)})`;

    const forecast: AgroWeatherForecastDay[] = snapshot.forecast.map((f) => ({
      date: f.date,
      dayName: f.dayName,
      tempMaxC: f.tempMaxC,
      tempMinC: f.tempMinC,
      precipitationMm: f.precipitationMm,
      precipitationChance: f.precipitationChance,
      humidityPercent: f.humidityPercent,
      windSpeedKmh: f.windSpeedKmh,
      evapotranspirationMm: f.evapotranspirationMm,
      condition: f.condition,
      icon: f.icon,
      sprayingWindowRating: f.sprayingWindowRating,
      frostRisk: f.frostRisk,
      fieldWorkability: f.fieldWorkability,
    }));

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
        description: 'NASA POWER satellite agroclimatology indicates overnight temperatures near freezing. Risk of frost damage to vulnerable crops.',
        agronomicAction: 'Apply row covers or run micro-sprinklers before sunrise to protect sensitive canopies.',
        issuedAt: new Date().toISOString(),
        validUntil: forecast.find((f) => f.tempMinC <= 2)?.date || new Date().toISOString(),
        sourceProvider: 'NASA POWER Agroclimatology Model',
      });
    }

    if (maxWind >= 24) {
      alerts.push({
        id: `alt-wind-${Date.now()}`,
        alertType: 'Optimal Spraying Opportunity',
        severity: 'medium',
        title: `Gusty Winds Foreseen (${maxWind} km/h)`,
        description: 'Elevated wind speeds detected via NASA MERRA-2 boundary layer analysis. Droplet drift risk for chemical or foliar sprays.',
        agronomicAction: 'Schedule crop protection sprays early in the morning when thermal inversion and surface winds are minimal.',
        issuedAt: new Date().toISOString(),
        validUntil: forecast.find((f) => f.windSpeedKmh >= 24)?.date || new Date().toISOString(),
        sourceProvider: 'NASA MERRA-2 Wind Analysis',
      });
    }

    if (totalWeekPrecip >= 25) {
      alerts.push({
        id: `alt-rain-${Date.now()}`,
        alertType: 'Foliar Blight Risk',
        severity: 'medium',
        title: `Sustained Moisture (${totalWeekPrecip.toFixed(1)} mm upcoming)`,
        description: 'NASA GEOS-5 precipitation modeling indicates sustained rain and high canopy humidity, elevating fungal spore germination.',
        agronomicAction: 'Inspect crop canopy for early fungal signs and ensure field drainage channels are clear.',
        issuedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 5 * 86400000).toISOString(),
        sourceProvider: 'NASA GEOS-5 Precipitation Model',
      });
    }

    const liveData: FarmWeatherSnapshot = {
      locationName: resolvedName,
      coordinates: { lat, lng: lon },
      retrievedAt: new Date().toISOString(),
      isSampleData: false,
      provider: 'NASA POWER Agroclimatology (Live)',
      current: snapshot.current,
      forecast,
      alerts,
      nasaPower: climatology || snapshot.climatology || null,
    };

    return NextResponse.json({
      data: liveData,
      meta: {
        provider: 'NASA POWER (Langley Research Center)',
        community: 'AG',
        retrievedAt: new Date().toISOString(),
        isSampleData: false,
        classification: 'live-satellite-agroclimatology',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'WEATHER_FETCH_FAILED', message: err?.message || 'Could not fetch live weather from NASA POWER.' } },
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

    const snapshot = await fetchNasaPowerSnapshot(lat, lon, 7);
    const climatology = await fetchNasaPowerClimatology(lat, lon);

    const liveData: FarmWeatherSnapshot = {
      locationName,
      coordinates: { lat, lng: lon },
      retrievedAt: new Date().toISOString(),
      isSampleData: false,
      provider: 'NASA POWER Agroclimatology (Live)',
      current: snapshot.current,
      forecast: snapshot.forecast,
      alerts: [],
      nasaPower: climatology || snapshot.climatology || null,
    };

    return NextResponse.json({
      data: liveData,
      meta: {
        provider: 'NASA POWER (Langley Research Center)',
        community: 'AG',
        retrievedAt: new Date().toISOString(),
        isSampleData: false,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'WEATHER_FETCH_FAILED', message: err?.message || 'Could not fetch live weather from NASA POWER.' } },
      { status: 502 }
    );
  }
}
