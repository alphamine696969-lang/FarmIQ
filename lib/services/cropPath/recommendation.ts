/**
 * FarmIQ CropPath Phase 1/2 — Crop Recommendation Engine (FIQ-090, FIQ-094).
 * Deterministic scoring over the verified crop suitability profiles, with
 * live context inputs (forecast, soil, season), official Eurostat prices when
 * available, and clearly-labeled sample financials otherwise. No prices,
 * schemes, or MSP rates are ever invented.
 */

import {
  CROP_SUITABILITY_DB,
  CropSuitabilityProfile,
  APPROVED_SOURCES
} from '../../data/mockDatabase';
import { seasonForLocation, seasonLengthDays, buildWeatherAlignment, isMonsoonLocation, ForecastDayBrief } from './context';
import {
  CropGoal,
  CropRecommendation,
  FinancialEstimate,
  LivePriceInfo,
  RecommendationRequest,
  Season,
  UnavailableFinancial
} from './types';

const GOAL_LABELS: Record<CropGoal, string> = {
  high_profit: 'high profit',
  low_cost: 'low-cost production',
  resilient: 'climate resilience',
  low_water: 'low water use',
  govt_supported: 'government support',
  short_duration: 'short duration',
  organic: 'organic-style low-input growing'
};

/** Modeled cost share of revenue by crop category (sample assumption, ADR-005). */
function costRatioForCategory(category: string): number {
  if (/pulse|legume/i.test(category)) return 0.62;
  if (/horticulture/i.test(category)) return 0.78;
  return 0.72;
}

/** Cost split within total expense (share of total expense, sums to 1). */
export const COST_SPLIT = {
  seeds: 0.15,
  fertilizers: 0.2,
  cropProtection: 0.08,
  labor: 0.16,
  irrigation: 0.06,
  machineryFuel: 0.13,
  landRent: 0.18,
  miscellaneous: 0.04
} as const;

export function isMonsoonRegion(region?: string): boolean {
  if (!region) return false;
  return /india|pakistan|bangladesh|nepal|sri lanka|south asia|bhutan/i.test(region);
}

/** Kept for backward compatibility; new code should use seasonForLocation. */
export function detectSeason(month: number, monsoonRegion: boolean, southernHemisphere = false): Season {
  const m = ((Math.round(month) % 12) + 12) % 12; // 0 = January
  if (monsoonRegion) {
    if (m >= 2 && m <= 4) return 'Zaid';
    if (m >= 5 && m <= 9) return 'Kharif';
    return 'Rabi';
  }
  const shifted = southernHemisphere ? (m + 6) % 12 : m;
  if (shifted >= 2 && shifted <= 4) return 'Spring';
  if (shifted >= 5 && shifted <= 7) return 'Summer';
  if (shifted >= 8 && shifted <= 10) return 'Autumn';
  return 'Winter';
}

interface ParsedYield {
  mid: number;
  unit: 'tonnes' | 'unknown';
}

function parsePotentialYield(label: string): ParsedYield {
  const match = label.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
  const mid = match ? (Number(match[1]) + Number(match[2])) / 2 : NaN;
  const tonnes = /metric tonne|tonne|mt/i.test(label);
  return { mid: Number.isFinite(mid) ? mid : NaN, unit: tonnes ? 'tonnes' : 'unknown' };
}

/** Converts tonnes of yield into a price unit ("100 kg", "quintal", ...). */
function convertTonnesToUnit(tonnes: number, unit: string): number | null {
  const u = unit.toLowerCase();
  if (u === 'mt' || u === 'tonne' || u === 'tonnes' || u === 'metric tonne') return tonnes;
  if (u === 'quintal' || u === 'quintals') return tonnes * 10;
  if (u === 'kg') return tonnes * 1000;
  if (u === '90kg bag') return (tonnes * 1000) / 90;
  if (u === '100 kg' || u === '100kg') return tonnes * 10;
  if (u === '1000 kg' || u === '1000kg') return tonnes;
  return null;
}

/**
 * Financial estimate — live official prices only. Without a connected official
 * price feed the result is an honest unavailable state; sample prices are
 * never used (CropPath mock-data removal).
 */
export function buildFinancialEstimate(
  profile: CropSuitabilityProfile,
  livePrice?: LivePriceInfo
): FinancialEstimate | UnavailableFinancial {
  if (!livePrice) {
    return {
      unavailable: true,
      reason: 'No official live price feed connected for this crop and country yet — check current local market rates before planning.'
    };
  }
  const parsed = parsePotentialYield(profile.potentialYieldPerAcre);
  if (parsed.unit !== 'tonnes' || !Number.isFinite(parsed.mid)) {
    return {
      unavailable: true,
      reason: 'No parsable yield range for this crop in the verified profile. Check local extension data before planning.'
    };
  }

  const price = livePrice.price;
  const unit = livePrice.unit;
  const currency = livePrice.currency;
  const yieldInPriceUnit = convertTonnesToUnit(parsed.mid, unit);
  if (yieldInPriceUnit === null) {
    return {
      unavailable: true,
      reason: `Price unit (${unit}) could not be matched to the yield unit.`
    };
  }

  const expectedRevenue = yieldInPriceUnit * price;
  const totalExpense = expectedRevenue * costRatioForCategory(profile.category);
  const estProfit = expectedRevenue - totalExpense;
  const sourceLabel = `Official — ${livePrice.sourceName} ${livePrice.period}`;
  const basisNote = `Official annual price: ${price} ${currency}/${unit} from ${livePrice.sourceName} (${livePrice.period}, retrieved ${livePrice.retrievedAt.slice(0, 10)}) × yield midpoint ${parsed.mid} t/acre. Costs modeled at ${Math.round(costRatioForCategory(profile.category) * 100)}% of revenue. Annual official price, not a live market quote.`;

  return {
    unavailable: false,
    currency,
    yieldAmount: Number(parsed.mid.toFixed(2)),
    yieldUnit: 'tonnes/acre',
    pricePerUnit: price,
    expectedRevenue: Math.round(expectedRevenue),
    totalExpense: Math.round(totalExpense),
    estProfit: Math.round(estProfit),
    estProfitMarginPct: Math.round((1 - costRatioForCategory(profile.category)) * 100),
    sourceLabel,
    basisNote
  };
}

function soilTextureMatches(profile: CropSuitabilityProfile, soilType?: string): boolean | null {
  if (!soilType) return null;
  const st = soilType.toLowerCase();
  return profile.suitableSoilTypes.some((s) => s.toLowerCase().includes(st) || st.includes(s.toLowerCase().split(' ').pop() || ''));
}

function scoreCrop(
  profile: CropSuitabilityProfile,
  req: RecommendationRequest,
  season: Season
): { score: number; seasonSuitable: boolean; soilMatch: boolean | null } {
  let score = 55;
  let soilMatch: boolean | null = null;

  if (typeof req.soilPh === 'number') {
    score += req.soilPh >= profile.minPh && req.soilPh <= profile.maxPh ? 10 : -25;
  }
  soilMatch = soilTextureMatches(profile, req.soilType);
  if (soilMatch !== null) score += soilMatch ? 8 : -8;
  if (typeof req.avgTempC === 'number') {
    score += req.avgTempC >= profile.minTempC && req.avgTempC <= profile.maxTempC ? 8 : -18;
  }
  if (typeof req.rainfallMm === 'number') {
    score += req.rainfallMm >= profile.minRainfallMm && req.rainfallMm <= profile.maxRainfallMm ? 6 : -10;
  }

  const seasonSuitable = profile.growthCycleDays <= seasonLengthDays(season);
  score += seasonSuitable ? 8 : -12;

  score += profile.resilienceScore * 1.5;

  switch (req.goal) {
    case 'high_profit': {
      const financial = buildFinancialEstimate(profile);
      const margin = financial.unavailable ? 20 : financial.estProfitMarginPct;
      score += (margin / 40) * 10;
      break;
    }
    case 'low_cost':
      score += ((1 - costRatioForCategory(profile.category)) / 0.4) * 8;
      score += profile.resilienceScore;
      break;
    case 'low_water':
      // Prefer crops with lower seasonal rainfall demand.
      score += ((900 - Math.min(900, profile.minRainfallMm)) / 900) * 14;
      score += profile.resilienceScore;
      break;
    case 'short_duration':
      score += ((150 - Math.min(150, profile.growthCycleDays)) / 150) * 16;
      break;
    case 'govt_supported':
      // No scheme database is connected — rank on resilience and say so honestly.
      score += profile.resilienceScore * 1.2;
      break;
    case 'organic':
    case 'resilient':
    default:
      score += profile.resilienceScore * 2.2;
      break;
  }

  return { score: Math.max(5, Math.min(98, Math.round(score))), seasonSuitable, soilMatch };
}

function deterministicWhy(
  profile: CropSuitabilityProfile,
  req: RecommendationRequest,
  season: Season,
  soilMatch: boolean | null
): string {
  const soilClause = soilMatch === true ? ' It matches your soil texture.' : soilMatch === false ? ' Your soil texture differs from its ideal profile, so amend or verify before sowing.' : '';
  let goalClause = '';
  if (req.goal === 'govt_supported') {
    goalClause = ' Government-scheme eligibility cannot be verified in-app — check official portals for current programs before relying on them.';
  } else if (req.goal === 'organic') {
    goalClause = ' Organic suitability and certification must be verified locally; this ranks low-input resilience, not certified organic status.';
  }
  return `${profile.cropName} suits your ${GOAL_LABELS[req.goal]} goal for the ${season} season: a ${profile.growthCycleDays}-day ${profile.category.toLowerCase()} cycle with resilience ${profile.resilienceScore}/10.${soilClause}${goalClause} ${profile.keyAgronomicAdvice}`;
}

function splitBenefits(profile: CropSuitabilityProfile): string[] {
  const sentences = profile.keyAgronomicAdvice.split(/(?<=\.)\s+/).filter(Boolean);
  return [...sentences.slice(0, 2), `Stress resilience score ${profile.resilienceScore}/10.`];
}

function govtSupportNote(profile: CropSuitabilityProfile, monsoon: boolean): string | null {
  if (monsoon) {
    return 'Some crops in India are covered by government MSP and subsidy programs. FarmIQ does not invent rates — verify current MSP and eligibility on official Agmarknet / PIB portals.';
  }
  return null;
}

function forecastFromRequest(req: RecommendationRequest): ForecastDayBrief[] {
  const max = req.forecastTempMaxC?.length ?? 0;
  if (!max) return [];
  const min = req.forecastTempMinC ?? [];
  const precip = req.forecastPrecipMm ?? [];
  return Array.from({ length: max }, (_, i) => ({
    date: '',
    tempMaxC: req.forecastTempMaxC![i],
    tempMinC: min[i] ?? NaN,
    precipitationMm: precip[i] ?? NaN,
    precipitationChancePct: null,
    uvIndexMax: null,
    humidityPct: null,
    et0Mm: null
  }));
}

export interface RecommendationOptions {
  /** Live official prices keyed by crop name (from /api/crop-path/prices). */
  livePrices?: Record<string, LivePriceInfo | null>;
}

export function buildRecommendations(req: RecommendationRequest, options: RecommendationOptions = {}): CropRecommendation[] {
  const month = typeof req.month === 'number' ? req.month : new Date().getMonth() + 1;
  const monsoon = isMonsoonRegion(req.region) || isMonsoonLocation(req.countryCode);
  const season = req.latitude != null
    ? seasonForLocation(req.latitude, month, monsoon).season
    : detectSeason(month, monsoon);
  // Weather-derived inputs are untrusted numbers; clamp to sane agronomic ranges.
  const soilPh = typeof req.soilPh === 'number' && req.soilPh >= 3.5 && req.soilPh <= 10 ? req.soilPh : undefined;
  const avgTempC = typeof req.avgTempC === 'number' && req.avgTempC >= -20 && req.avgTempC <= 55 ? req.avgTempC : undefined;
  const rainfallMm = typeof req.rainfallMm === 'number' ? Math.min(1500, Math.max(0, req.rainfallMm)) : undefined;
  const forecast = forecastFromRequest(req);
  const livePrices = options.livePrices ?? {};

  return CROP_SUITABILITY_DB.map((profile) => {
    const { score, seasonSuitable, soilMatch } = scoreCrop(
      profile,
      { ...req, soilPh, avgTempC, rainfallMm },
      season
    );
    const livePrice = livePrices[profile.cropName] ?? undefined;
    const financial = buildFinancialEstimate(profile, livePrice);
    const citation = APPROVED_SOURCES.find((s) => s.id === profile.scientificReferenceId);

    return {
      cropName: profile.cropName,
      category: profile.category,
      matchScore: score,
      season,
      seasonSuitable,
      growthPeriodDays: profile.growthCycleDays,
      growthPeriodLabel: `${profile.growthCycleDays} days (${Math.round(profile.growthCycleDays / 7)} weeks)`,
      whyThisCrop: deterministicWhy(profile, req, season, soilMatch),
      whySource: 'rule' as const,
      financial,
      livePrice: livePrice ?? undefined,
      weatherAlignment: buildWeatherAlignment(profile, forecast),
      keyBenefits: splitBenefits(profile),
      govtSupportNote: govtSupportNote(profile, monsoon),
      citation: citation ? { sourceName: citation.sourceName, url: citation.canonicalUrl } : null
    };
  }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
}
