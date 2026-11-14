/**
 * FarmIQ CropPath Phase 1 context (FIQ-094, v2 workflow).
 * Assembles live background data: 14-day forecast, soil texture, season.
 * Season logic is international: monsoon regions keep Kharif/Rabi/Zaid,
 * tropical latitudes get Wet/Dry, temperate zones invert by hemisphere.
 */

import { CropSuitabilityProfile } from '../../data/mockDatabase';
import { Season } from './types';

export interface ForecastDayBrief {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  precipitationChancePct: number | null;
  uvIndexMax: number | null;
  humidityPct: number | null;
  et0Mm: number | null;
}

export interface CropContext {
  season: Season;
  hemisphere: 'northern' | 'southern';
  tropical: boolean;
}

const MONSOON_COUNTRY_CODES = new Set(['IN', 'PK', 'BD', 'NP', 'LK', 'BT']);
const MONSOON_TIMEZONES = new Set([
  'Asia/Kolkata',
  'Asia/Colombo',
  'Asia/Dhaka',
  'Asia/Kathmandu',
  'Asia/Thimphu',
  'Asia/Karachi'
]);

/** Monsoon-region detection: explicit country code, else forecast timezone. */
export function isMonsoonLocation(countryCode?: string, timezone?: string): boolean {
  if (countryCode && MONSOON_COUNTRY_CODES.has(countryCode.toUpperCase())) return true;
  if (timezone && MONSOON_TIMEZONES.has(timezone)) return true;
  return false;
}

/** International season detection (v2 Phase 1). */
export function seasonForLocation(latitude: number | null, month: number, monsoonRegion: boolean): CropContext {
  const m = ((Math.round(month) % 12) + 12) % 12; // 0 = January
  const southern = latitude !== null && latitude < 0;
  const tropical = latitude !== null && Math.abs(latitude) <= 15;

  if (monsoonRegion) {
    // South Asian monsoon calendar (Kharif/Rabi/Zaid) — matches agronomy.
    let season: Season;
    if (m >= 2 && m <= 4) season = 'Zaid';
    else if (m >= 5 && m <= 9) season = 'Kharif';
    else season = 'Rabi';
    return { season, hemisphere: southern ? 'southern' : 'northern', tropical: false };
  }

  if (tropical) {
    // Tropical wet/dry: NH wet ≈ May–Oct, SH wet ≈ Nov–Apr (inverted).
    const wetMonths = southern ? [10, 11, 0, 1, 2, 3] : [4, 5, 6, 7, 8, 9];
    return {
      season: wetMonths.includes(m) ? 'Wet' : 'Dry',
      hemisphere: southern ? 'southern' : 'northern',
      tropical: true
    };
  }

  const shifted = southern ? (m + 6) % 12 : m;
  let season: Season;
  if (shifted >= 2 && shifted <= 4) season = 'Spring';
  else if (shifted >= 5 && shifted <= 7) season = 'Summer';
  else if (shifted >= 8 && shifted <= 10) season = 'Autumn';
  else season = 'Winter';
  return { season, hemisphere: southern ? 'southern' : 'northern', tropical: false };
}

const SEASON_LENGTH_DAYS: Record<Season, number> = {
  Kharif: 120,
  Rabi: 110,
  Zaid: 70,
  Spring: 90,
  Summer: 110,
  Autumn: 90,
  Winter: 110,
  Wet: 150,
  Dry: 120
};

export function seasonLengthDays(season: Season): number {
  return SEASON_LENGTH_DAYS[season] ?? 110;
}

/** Plain-language weather alignment of a crop against the live forecast. */
export function buildWeatherAlignment(profile: CropSuitabilityProfile, days: ForecastDayBrief[]): string {
  const valid = days.filter((d) => Number.isFinite(d.tempMaxC) && Number.isFinite(d.tempMinC));
  if (!valid.length || days.length === 0) {
    return 'Live forecast unavailable — alignment based on your region\u2019s typical season only.';
  }
  const maxHigh = Math.max(...valid.map((d) => d.tempMaxC));
  const minLow = Math.min(...valid.map((d) => d.tempMinC));
  const precipTotal = Number(
    days.reduce((s, d) => s + (Number.isFinite(d.precipitationMm) ? d.precipitationMm : 0), 0).toFixed(1)
  );

  const parts: string[] = [];
  if (maxHigh > profile.maxTempC) {
    parts.push(`forecast highs up to ${maxHigh.toFixed(0)}°C exceed this crop\u2019s ${profile.maxTempC}°C max — heat stress risk`);
  } else if (minLow < profile.minTempC) {
    parts.push(`forecast lows to ${minLow.toFixed(0)}°C fall below this crop\u2019s ${profile.minTempC}°C minimum — chill/frost risk`);
  } else {
    parts.push(`forecast ${minLow.toFixed(0)}–${maxHigh.toFixed(0)}°C sits inside the crop\u2019s ${profile.minTempC}–${profile.maxTempC}°C range`);
  }

  if (precipTotal >= profile.minRainfallMm / 3) {
    parts.push(`${precipTotal} mm rain expected — moisture demand likely met`);
  } else if (precipTotal < 1) {
    parts.push('little rain expected — plan irrigation');
  } else {
    parts.push(`${precipTotal} mm rain expected — supplement with irrigation if dry spells continue`);
  }

  return `${parts.join('; ')}.`;
}
