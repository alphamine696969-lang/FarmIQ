/**
 * FarmIQ CropPath weather intelligence (FIQ-092).
 * Deterministic mapping from a live forecast snapshot to crop-relevant
 * alerts, watering-skip logic, and recommendation inputs. Pure functions,
 * fully testable offline. Provider failure degrades to honest unavailable.
 */

import { OpenMeteoSnapshot } from '../../integrations/weather/openMeteo';

export type WeatherNoteType = 'rain' | 'frost' | 'heat' | 'blight_risk' | 'dry_spell';

export interface WeatherNote {
  type: WeatherNoteType;
  severity: 'info' | 'warning' | 'high';
  note: string;
}

export interface CropWeatherSummary {
  available: true;
  isLive: true;
  provider: 'NASA POWER' | 'Open-Meteo';
  locationName: string;
  country?: string;
  latitude: number;
  longitude: number;
  retrievedAt: string;
  currentTempC: number | null;
  currentHumidityPct: number | null;
  next3Days: {
    date: string;
    tempMinC: number;
    tempMaxC: number;
    precipitationMm: number;
    precipitationChancePct: number | null;
    humidityPct: number | null;
    et0Mm: number | null;
  }[];
  precipNext3DaysMm: number;
  rainExpectedNext3Days: boolean;
  maxTempNext3DaysC: number | null;
  minTempNext3DaysC: number | null;
  wateringSkipped: boolean;
  notes: WeatherNote[];
}

export interface CropWeatherUnavailable {
  available: false;
  reason: string;
}

const BLIGHT_PRONE = /tomato|potato/i;

export function buildWeatherNotes(days: CropWeatherSummary['next3Days'], cropName: string): WeatherNote[] {
  const notes: WeatherNote[] = [];
  if (days.length === 0) return notes;

  const heavyRainDay = days.find((d) => d.precipitationMm >= 10 || (d.precipitationChancePct ?? 0) >= 70);
  const wetDays = days.filter((d) => d.precipitationMm >= 1).length;
  const anyRain = days.some((d) => d.precipitationMm >= 1 || (d.precipitationChancePct ?? 0) >= 40);

  if (heavyRainDay) {
    notes.push({
      type: 'rain',
      severity: 'warning',
      note: `Heavy rain expected around ${heavyRainDay.date} (${heavyRainDay.precipitationMm.toFixed(1)} mm). Skip irrigation this week and delay top-dressing before the rain so nutrients are not washed out.`
    });
  } else if (anyRain) {
    const lightDay = days.find((d) => d.precipitationMm >= 1 || (d.precipitationChancePct ?? 0) >= 40)!;
    notes.push({
      type: 'rain',
      severity: 'info',
      note: `Some rain likely around ${lightDay.date}. You may be able to skip one watering — check soil moisture first.`
    });
  }

  const frostDay = days.find((d) => Number.isFinite(d.tempMinC) && d.tempMinC <= 2);
  if (frostDay) {
    notes.push({
      type: 'frost',
      severity: 'high',
      note: `Frost risk on ${frostDay.date} (min ${frostDay.tempMinC.toFixed(0)}°C). Protect young seedlings with mulch or row covers; delay transplanting.`
    });
  }

  const maxTemp = Math.max(...days.map((d) => d.tempMaxC));
  if (Number.isFinite(maxTemp) && maxTemp >= 38) {
    notes.push({
      type: 'heat',
      severity: 'warning',
      note: `Heat stress risk (up to ${maxTemp.toFixed(0)}°C). Irrigate early morning or evening; avoid midday work on the crop.`
    });
  }

  const humidWet = days.some((d) => (d.humidityPct ?? 0) >= 80 && d.precipitationMm >= 1);
  if (humidWet && BLIGHT_PRONE.test(cropName)) {
    notes.push({
      type: 'blight_risk',
      severity: 'warning',
      note: 'Humid, wet days raise foliar blight risk for this crop. Improve airflow, avoid overhead watering, and scout lower leaves daily. (See verified disease guidance; no dosages provided — ADR-006.)'
    });
  }

  const dryDays = days.filter((d) => d.precipitationMm < 1).length;
  const et0Sum = days.reduce((sum, d) => sum + (Number.isFinite(d.et0Mm ?? NaN) ? (d.et0Mm || 0) : 0), 0);
  if (dryDays === days.length && et0Sum >= 12) {
    notes.push({
      type: 'dry_spell',
      severity: 'info',
      note: `Dry spell with high evaporation (~${et0Sum.toFixed(1)} mm ET0 over 3 days). Follow your irrigation schedule closely.`
    });
  }

  return notes;
}

export function summarizeWeatherForCrop(
  snapshot: OpenMeteoSnapshot,
  locationLabel: string,
  country: string | undefined,
  cropName: string
): CropWeatherSummary {
  const days = snapshot.daily.slice(0, 3).map((d) => ({
    date: d.date,
    tempMinC: d.tempMinC,
    tempMaxC: d.tempMaxC,
    precipitationMm: d.precipitationMm,
    precipitationChancePct: d.precipitationChancePct,
    humidityPct: d.humidityPct,
    et0Mm: d.et0Mm
  }));

  const precipNext3DaysMm = Number(days.reduce((s, d) => s + (Number.isFinite(d.precipitationMm) ? d.precipitationMm : 0), 0).toFixed(1));
  const rainExpected = days.some((d) => (Number.isFinite(d.precipitationMm) && d.precipitationMm >= 5) || (d.precipitationChancePct ?? 0) >= 60);
  const notes = buildWeatherNotes(days, cropName);
  const finiteMax = days.filter((d) => Number.isFinite(d.tempMaxC)).map((d) => d.tempMaxC);
  const finiteMin = days.filter((d) => Number.isFinite(d.tempMinC)).map((d) => d.tempMinC);

  return {
    available: true,
    isLive: true,
    provider: 'NASA POWER',
    locationName: locationLabel,
    country,
    latitude: snapshot.latitude,
    longitude: snapshot.longitude,
    retrievedAt: snapshot.retrievedAt,
    currentTempC: snapshot.currentTempC,
    currentHumidityPct: snapshot.currentHumidityPct,
    next3Days: days,
    precipNext3DaysMm,
    rainExpectedNext3Days: rainExpected,
    maxTempNext3DaysC: finiteMax.length ? Math.max(...finiteMax) : null,
    minTempNext3DaysC: finiteMin.length ? Math.min(...finiteMin) : null,
    wateringSkipped: rainExpected,
    notes
  };
}
