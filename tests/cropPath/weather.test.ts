/**
 * FarmIQ CropPath weather mapping tests (FIQ-092).
 * Deterministic alert/watering-skip logic over synthetic Open-Meteo snapshots.
 * No network access — the adapter's payload parsing is covered separately
 * by the live smoke run; these tests lock the agronomy rules.
 */

import { buildWeatherNotes, summarizeWeatherForCrop } from '../../lib/services/cropPath/weather';
import { OpenMeteoSnapshot } from '../../lib/integrations/weather/openMeteo';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function day(date: string, opts: Partial<{ tmax: number; tmin: number; precip: number; chance: number; humidity: number; et0: number }> = {}) {
  return {
    date,
    tempMinC: opts.tmin ?? 18,
    tempMaxC: opts.tmax ?? 30,
    precipitationMm: opts.precip ?? 0,
    precipitationChancePct: opts.chance ?? 0,
    et0Mm: opts.et0 ?? 4,
    humidityPct: opts.humidity ?? 55,
    windMaxKmh: 10,
    uvIndexMax: 5,
    weatherCode: 0
  };
}

function snapshot(days: OpenMeteoSnapshot['daily']): OpenMeteoSnapshot {
  return {
    latitude: 20.0,
    longitude: 75.0,
    timezone: 'Asia/Kolkata',
    currentTempC: 26,
    currentHumidityPct: 60,
    daily: days,
    retrievedAt: '2026-11-14T00:00:00.000Z'
  };
}

function runTests(): void {
  console.log('Running CropPath Weather Mapping Tests...');

  /* ------------------------------ Rain / skip ------------------------------ */

  const rainy = summarizeWeatherForCrop(
    snapshot([day('d1', { precip: 14, chance: 85 }), day('d2'), day('d3')]),
    'Nashik', 'India', 'Wheat'
  );
  assert(rainy.available && rainy.isLive, 'summary available and marked live');
  assert(rainy.wateringSkipped, 'heavy rain → watering skipped');
  assert(rainy.notes.some((n) => n.type === 'rain' && n.severity === 'warning' && n.note.includes('Skip irrigation')), 'heavy rain note with skip guidance');
  assert(rainy.provider === 'Open-Meteo', 'provider labeled');
  assert(rainy.next3Days.length === 3, '3-day window');
  console.log('✔ Heavy rain → skip watering, labeled live');

  const lightRain = summarizeWeatherForCrop(
    snapshot([day('d1', { precip: 0.5, chance: 45 }), day('d2'), day('d3')]),
    'Nashik', 'India', 'Wheat'
  );
  assert(!lightRain.wateringSkipped, 'light rain does not force skip');
  assert(lightRain.notes.some((n) => n.type === 'rain'), 'light rain info note present');
  console.log('✔ Light rain → info note, no forced skip');

  /* --------------------------- Frost / heat / dry --------------------------- */

  const frosty = summarizeWeatherForCrop(
    snapshot([day('d1', { tmin: 1 }), day('d2'), day('d3')]),
    'Ludhiana', 'India', 'Wheat'
  );
  assert(frosty.notes.some((n) => n.type === 'frost' && n.severity === 'high'), 'frost note high severity');
  assert(frosty.notes.some((n) => n.note.includes('mulch or row covers')), 'frost protective guidance');

  const hot = summarizeWeatherForCrop(
    snapshot([day('d1', { tmax: 40 }), day('d2'), day('d3')]),
    'Nagpur', 'India', 'Maize'
  );
  assert(hot.notes.some((n) => n.type === 'heat'), 'heat stress note');

  const dry = summarizeWeatherForCrop(
    snapshot([day('d1', { et0: 5 }), day('d2', { et0: 4.5 }), day('d3', { et0: 4 })]),
    'Bikaner', 'India', 'Chickpeas'
  );
  assert(dry.notes.some((n) => n.type === 'dry_spell' && n.note.includes('ET0')), 'dry spell note references ET0');
  console.log('✔ Frost, heat stress, and dry-spell notes');

  /* ------------------------------ Blight risk ------------------------------- */

  const tomatoHumid = summarizeWeatherForCrop(
    snapshot([day('d1', { precip: 6, humidity: 88 }), day('d2', { precip: 3, humidity: 85 }), day('d3')]),
    'Pune', 'India', 'Tomatoes'
  );
  assert(tomatoHumid.notes.some((n) => n.type === 'blight_risk' && n.note.includes('blight')), 'tomato + humid wet days → blight risk note');
  assert(tomatoHumid.notes.some((n) => n.note.includes('ADR-006')), 'blight note keeps ADR-006 language');

  const wheatHumid = summarizeWeatherForCrop(
    snapshot([day('d1', { precip: 6, humidity: 88 }), day('d2'), day('d3')]),
    'Pune', 'India', 'Wheat'
  );
  assert(!wheatHumid.notes.some((n) => n.type === 'blight_risk'), 'wheat does not get tomato blight note');
  console.log('✔ Blight risk scoped to blight-prone crops with ADR-006 notice');

  /* ----------------------------- Recommendation ----------------------------- */

  const total = rainy.precipNext3DaysMm;
  assert(Math.abs(total - 14) < 0.01, 'precip next 3 days sums daily precipitation');
  assert(
    rainy.maxTempNext3DaysC !== null && rainy.minTempNext3DaysC !== null && rainy.maxTempNext3DaysC >= rainy.minTempNext3DaysC,
    'temp range consistent'
  );
  const noTemp = summarizeWeatherForCrop(snapshot([day('d1', { tmax: NaN, tmin: NaN })]), 'X', undefined, 'Wheat');
  assert(noTemp.maxTempNext3DaysC === null, 'all-NaN temps render as null, not NaN');
  console.log('✔ Summary math (precip totals, temp range, NaN-safe)');

  console.log('\nAll CropPath weather tests passed ✔');
}

try {
  runTests();
} catch (err) {
  console.error('CropPath weather test suite failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}
