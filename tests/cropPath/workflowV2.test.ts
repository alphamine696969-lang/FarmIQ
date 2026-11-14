/**
 * FarmIQ CropPath v2 workflow tests (FIQ-094).
 * International season logic, soil texture classification, structured vision
 * parsing, health score, stage-driven schedule shifts, receipt stats,
 * Eurostat price mapping/units, weather alignment, and 7-goal scoring.
 * All offline and deterministic.
 */

import { seasonForLocation, seasonLengthDays, buildWeatherAlignment, isMonsoonLocation } from '../../lib/services/cropPath/context';
import { classifyTexture } from '../../lib/integrations/soil/soilGrids';
import { parseVisionReport, computeHealthScore } from '../../lib/services/cropPath/vision';
import { parseAiRanking } from '../../lib/services/cropPath/aiRank';
import {
  analyzeWeeklyReport,
  stageAdjustmentDays,
  buildReceiptStats
} from '../../lib/services/cropPath/analysis';
import {
  mapCropToEurostatCode,
  parseUnitFromLabel,
  isValidCountryCode
} from '../../lib/integrations/markets/eurostatPrices';
import { buildRecommendations, buildFinancialEstimate } from '../../lib/services/cropPath/recommendation';
import { buildRoadmap } from '../../lib/services/cropPath/roadmap';
import { CROP_SUITABILITY_DB } from '../../lib/data/mockDatabase';
import { CropPathTracker, CropGoal } from '../../lib/services/cropPath/types';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function runTests(): void {
  console.log('Running CropPath v2 Workflow Test Suite...');

  /* --------------------------- International season --------------------------- */

  assertEqual(seasonForLocation(20.0, 7, true).season, 'Kharif', 'monsoon July → Kharif');
  assertEqual(seasonForLocation(20.0, 0, true).season, 'Rabi', 'monsoon Jan → Rabi');
  assertEqual(seasonForLocation(5.0, 7, false).season, 'Wet', 'NH tropical July → Wet');
  assertEqual(seasonForLocation(5.0, 1, false).season, 'Dry', 'NH tropical Jan → Dry');
  assertEqual(seasonForLocation(-25.0, 0, false).season, 'Summer', 'SH temperate Jan → Summer');
  assertEqual(seasonForLocation(-5.0, 1, false).season, 'Wet', 'SH tropical Jan → Wet');
  assertEqual(seasonForLocation(45.0, 7, false).season, 'Summer', 'NH temperate July → Summer');
  assertEqual(seasonForLocation(20.0, 7, true).hemisphere, 'northern', 'hemisphere label');
  assertEqual(seasonForLocation(-10.0, 7, false).hemisphere, 'southern', 'southern hemisphere label');
  assert(seasonLengthDays('Wet') > seasonLengthDays('Zaid'), 'Wet season longer than Zaid');
  const indiaRecs = buildRecommendations({ goal: 'resilient', region: 'Rajpura, Punjab', countryCode: 'IN', month: 11 });
  assertEqual(indiaRecs[0].season, 'Rabi', 'IN country code in November → Rabi (not temperate Winter)');
  assert(indiaRecs.length === 5, 'Rajpura returns all 5 candidate crops');
  assert(indiaRecs.every((r) => r.season === 'Rabi'), 'every card carries the corrected season');
  console.log('✔ International season (monsoon, tropical Wet/Dry, hemisphere inversion)');

  assert(isMonsoonLocation('IN', undefined), 'IN country code → monsoon');
  assert(isMonsoonLocation(undefined, 'Asia/Kolkata'), 'Asia/Kolkata timezone → monsoon');
  assert(!isMonsoonLocation('US', 'America/Chicago'), 'US → not monsoon');
  console.log('✔ Monsoon detection (country code + timezone)');

  /* ------------------------------ Soil texture ------------------------------ */

  assertEqual(classifyTexture(75, 10, 15), 'Sand', 'sandy texture');
  assertEqual(classifyTexture(20, 45, 35), 'Clay', 'clay texture');
  assert(classifyTexture(40, 20, 40).includes('Loam') || classifyTexture(40, 20, 40) === 'Loam', 'loamy texture');
  console.log('✔ Soil texture classification from SoilGrids fractions');

  /* ---------------------------- Structured vision ---------------------------- */

  const fenced = parseVisionReport('```json\n{"stage_match":"behind_1_week","disease_signs":["leaf spots"],"nutrient_flags":[],"severity":"early","maturity_confirmed":false,"notes":"Looks a bit behind."}\n```');
  assert(fenced !== null, 'fenced JSON parses');
  assertEqual(fenced!.stageMatch, 'behind_1_week', 'stage match parsed');
  assertEqual(fenced!.diseaseSigns.length, 1, 'disease signs parsed');
  assertEqual(fenced!.maturityConfirmed, false, 'maturity false parsed');

  const messy = parseVisionReport('{"stage_match":"SOMETHING_ELSE","severity":"weird","maturity_confirmed":"yes","notes":123,"disease_signs":["ok", 5, ""]}');
  assert(messy !== null, 'messy JSON still returns a report');
  assertEqual(messy!.stageMatch, 'uncertain', 'unknown stage → uncertain');
  assertEqual(messy!.severity, 'none', 'unknown severity → none');
  assertEqual(messy!.maturityConfirmed, null, 'non-boolean maturity → null');
  assertEqual(messy!.diseaseSigns.length, 1, 'non-strings and empty strings dropped');

  assertEqual(parseVisionReport('not json at all'), null, 'garbage → null');
  assertEqual(parseVisionReport(''), null, 'empty → null');
  console.log('✔ Vision JSON parsing (fenced, messy enums, garbage)');

  /* ------------------------ AI recommendation ranking ------------------------ */

  const candidateNames = ['Wheat', 'Maize (Corn)', 'Tomatoes'];
  const aiRank = parseAiRanking(
    '```json\n{"ranking":["Tomatoes","Wheat","Maize (Corn)"],"reasons":{"Tomatoes":"fits the warm forecast and goal","Wheat":"cool-season fit but rain is low","Maize (Corn)":"heavy water needs this week"}}\n```',
    candidateNames
  );
  assert(aiRank !== null, 'fenced ranking parses');
  assertEqual(aiRank!.ranking[0], 'Tomatoes', 'AI order preserved');
  assertEqual(aiRank!.ranking.length, 3, 'all candidates kept');
  assert(aiRank!.reasons['Tomatoes'].includes('warm forecast'), 'reasons merged');

  const withInvented = parseAiRanking(
    '{"ranking":["Dragonfruit","Wheat","Maize (Corn)"],"reasons":{"Dragonfruit":"invented crop","Wheat":"ok"}}',
    candidateNames
  );
  assert(withInvented !== null, 'ranking with invented crop still parses');
  assert(!withInvented!.ranking.includes('Dragonfruit'), 'invented crop dropped by validator');
  assertEqual(withInvented!.ranking.length, 2, 'only known candidates remain');

  assertEqual(parseAiRanking('{"ranking":["Wheat"],"reasons":{}}', candidateNames), null, 'single-entry ranking rejected');
  assertEqual(parseAiRanking('{"nope":true}', candidateNames), null, 'missing ranking rejected');
  assertEqual(parseAiRanking('totally not json', candidateNames), null, 'garbage → null');

  const echoedLabels = parseAiRanking(
    '{"ranking":["Chickpeas (Garbanzo)","Wheat (Cereal / Grain)","Maize (Corn) (Cereal / Grain)"],"reasons":{"Wheat (Cereal / Grain)":"echoed label reason"}}',
    candidateNames
  );
  assert(echoedLabels !== null, 'model echoing category labels still validates');
  assertEqual(echoedLabels!.ranking[0], 'Wheat', 'echoed "Wheat (Cereal / Grain)" canonicalizes to Wheat');
  assert(!echoedLabels!.ranking.includes('Chickpeas (Garbanzo)' as never), 'non-candidate dropped');
  assertEqual(echoedLabels!.ranking.length, 2, 'only known candidates remain (Wheat, Maize)');
  assert(echoedLabels!.reasons['Wheat'] === 'echoed label reason', 'echoed reason key canonicalized');

  const longReason = parseAiRanking(
    JSON.stringify({ ranking: ['Wheat', 'Maize (Corn)'], reasons: { Wheat: 'x'.repeat(900) } }),
    candidateNames
  );
  assert(longReason!.reasons['Wheat'].length <= 400, 'reasons capped at 400 chars');
  console.log('✔ AI ranking validation (invented crops dropped, caps, fallback shapes)');

  /* ------------------------------ Health score ------------------------------ */

  assertEqual(computeHealthScore('very_good', 'on_schedule', 'none'), 95, 'best case score');
  assertEqual(computeHealthScore('worried', 'behind_2_plus', 'disease'), 10, 'worst case clamped ≥5');
  assert(computeHealthScore('good', undefined, 'pests') < computeHealthScore('good', 'on_schedule', 'none'), 'issues lower the score');
  assert(computeHealthScore('good', undefined, 'none') >= 70 && computeHealthScore('good', undefined, 'none') <= 80, 'good/neutral lands in 70s');
  console.log('✔ Heuristic health score (0–100, clamped)');

  /* ------------------------- Stage-driven rework (Phase 8) ------------------- */

  assertEqual(stageAdjustmentDays('behind_1_week'), 7, '1 week behind → +7d');
  assertEqual(stageAdjustmentDays('behind_2_plus'), 14, '2+ weeks behind → +14d');
  assertEqual(stageAdjustmentDays('ahead'), -3, 'ahead → −3d');
  assertEqual(stageAdjustmentDays('on_schedule'), null, 'on schedule → rating decides');
  assertEqual(stageAdjustmentDays(undefined), null, 'no vision → rating decides');

  const wheat = CROP_SUITABILITY_DB.find((c) => c.cropName === 'Wheat')!;
  const roadmap = buildRoadmap(wheat, 'Sprinkler');
  const tracker: CropPathTracker = {
    id: 'trk-v2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cropName: 'Wheat',
    category: wheat.category,
    variety: 'HD-2967',
    fieldName: 'North Field',
    village: 'Rampur',
    areaValue: 2,
    areaUnit: 'acre',
    irrigationType: 'Sprinkler',
    sowingDate: '2026-11-01T00:00:00.000Z',
    stages: roadmap.stages,
    roadmap: roadmap.roadmap,
    harvestWeek: roadmap.harvestWeek,
    totalWeeks: roadmap.totalWeeks,
    weekOffsetDays: 0,
    reports: [],
    status: 'active'
  };

  const behind = analyzeWeeklyReport(tracker, {
    weekNumber: 4,
    rating: 'very_good',
    actionsCompleted: {},
    issues: 'none',
    stageMatch: 'behind_1_week',
    visionDiseaseSigns: ['small lesions on lower leaves']
  });
  assertEqual(behind.adjustmentDays, 7, 'vision behind beats very_good rating');
  assert(behind.analysisNote.includes('week behind'), 'note explains the shift');
  assert(behind.guidance.some((g) => g.includes('Photo analysis flagged')), 'vision disease signs surfaced');
  assert(typeof behind.healthScore === 'number', 'health score returned');
  console.log('✔ Stage-match takes precedence over rating; vision guidance attached');

  /* ------------------------------ Roadmap tasks ------------------------------ */

  assert(roadmap.roadmap.every((w) => w.fertilizerTask.length > 0 && w.irrigationTask.length > 0 && w.scoutingTask.length > 0), 'every week has the three tasks');
  assert(roadmap.roadmap.some((w) => w.irrigationTask.includes('sprinkler')), 'sprinkler-aware irrigation task');
  assert(roadmap.roadmap.every((w) => !/\d+\s*(kg|g|ml|litre)\b/i.test(w.fertilizerTask)), 'no invented fertilizer amounts');
  console.log('✔ Roadmap week tasks (fertilizer/irrigation/scouting, no amounts)');

  /* ----------------------------- Receipt stats ------------------------------ */

  const completedReports = Array.from({ length: 5 }, (_, i) => ({
    id: `r${i}`,
    weekNumber: i + 1,
    submittedAt: new Date().toISOString(),
    rating: 'good' as const,
    actionsCompleted: {},
    issues: i === 2 ? ('pests' as const) : ('none' as const),
    analysisNote: '',
    guidance: [],
    appliedAdjustmentDays: 0,
    healthScore: 70 + i
  }));
  const withReports: CropPathTracker = { ...tracker, reports: completedReports };
  const stats = buildReceiptStats(withReports, '2026-11-29T00:00:00.000Z'); // exactly 4 weeks after Nov 1 → week 5
  assertEqual(stats.weeksRun, 5, 'weeks run from sowing to harvest');
  assertEqual(stats.reportsSubmitted, 5, '5 unique reported weeks');
  assertEqual(stats.reportsMissed, 0, 'no missed weeks');
  assertEqual(stats.avgHealthScore, 72, 'average health score');
  assertEqual(stats.issuesDetected, 1, 'one issue logged');
  console.log('✔ Receipt stats (weeks, reports vs missed, health trend, issues)');

  /* ------------------------------ Eurostat prices ---------------------------- */

  assertEqual(mapCropToEurostatCode('Wheat'), '01110000', 'wheat maps to soft wheat');
  assertEqual(mapCropToEurostatCode('Maize (Corn)'), '01500000', 'maize maps');
  assertEqual(mapCropToEurostatCode('Chickpeas (Garbanzo)'), '02992000', 'chickpeas map');
  assertEqual(mapCropToEurostatCode('Tomatoes'), '04121000', 'tomatoes map');
  assertEqual(mapCropToEurostatCode('Dragonfruit Exotic'), null, 'unmapped crop → null');
  assertEqual(parseUnitFromLabel('Soft wheat - prices per 100 kg'), '100 kg', 'unit parsed from label');
  assertEqual(parseUnitFromLabel('Sugar beet: unit value - prices per 1000 kg'), '1000 kg', '1000 kg unit');
  assertEqual(parseUnitFromLabel('no unit here'), null, 'missing unit → null');
  assert(isValidCountryCode('DE'), 'valid country code');
  assert(!isValidCountryCode('Germany'), 'long code rejected');
  assert(!isValidCountryCode('d'), 'lowercase single letter rejected');
  console.log('✔ Eurostat crop mapping, unit parsing, country validation');

  /* --------------------- Live price financial integration -------------------- */

  const wheatLive = buildFinancialEstimate(wheat, {
    price: 21.5,
    unit: '100 kg',
    currency: 'EUR',
    sourceName: 'Eurostat',
    period: '2024',
    datasetUrl: 'https://ec.europa.eu/eurostat/databrowser/view/apri_ap_crpouta/default/table',
    retrievedAt: '2026-11-14T00:00:00.000Z'
  });
  assert(!wheatLive.unavailable, 'live price financial available');
  if (!wheatLive.unavailable) {
    assert(wheatLive.sourceLabel.includes('Eurostat'), 'source label names Eurostat');
    assert(wheatLive.basisNote.includes('2024'), 'basis note includes period');
    // wheat yield mid = (1.8+2.5)/2 = 2.15 t → 21.5 × 100kg units × 21.5 EUR = 462.25
    assert(Math.abs(wheatLive.expectedRevenue - 462) <= 2, 'revenue = yield × official price');
  }
  console.log('✔ Live official price flows into financials (labeled non-sample)');

  /* --------------------------- 7-goal scoring ------------------------------- */

  const goals: CropGoal[] = ['high_profit', 'low_cost', 'resilient', 'low_water', 'govt_supported', 'short_duration', 'organic'];
  for (const g of goals) {
    const recs = buildRecommendations({ goal: g, month: 6, region: 'Iowa' });
    assertEqual(recs.length, 5, `${g} returns 5 crops`);
    assert(recs[0].matchScore >= recs[2].matchScore, `${g} sorted`);
    assert(typeof recs[0].weatherAlignment === 'string' && recs[0].weatherAlignment.length > 0, `${g} has weather alignment text`);
    if (g === 'short_duration') {
      assert(recs[0].growthPeriodDays <= 110, 'short-duration favors quicker cycles');
    }
    if (g === 'govt_supported') {
      assert(recs[0].whyThisCrop.includes('cannot be verified'), 'govt-supported goal stays honest');
    }
    if (g === 'organic') {
      assert(recs[0].whyThisCrop.includes('verified locally'), 'organic goal stays honest');
    }
  }
  const aligned = buildWeatherAlignment(wheat, [
    { date: 'd1', tempMaxC: 35, tempMinC: 20, precipitationMm: 0, precipitationChancePct: 0, uvIndexMax: 8, humidityPct: 40, et0Mm: 5 },
    { date: 'd2', tempMaxC: 36, tempMinC: 21, precipitationMm: 0, precipitationChancePct: 0, uvIndexMax: 9, humidityPct: 38, et0Mm: 5 }
  ]);
  assert(aligned.includes('exceed') || aligned.includes('heat'), 'hot forecast flagged against crop max');
  const noForecast = buildWeatherAlignment(wheat, []);
  assert(noForecast.includes('unavailable'), 'empty forecast → honest unavailable text');
  console.log('✔ 7-goal scoring + weather alignment (hot flag, honest fallback)');

  console.log('\nAll CropPath v2 workflow tests passed ✔');
}

try {
  runTests();
} catch (err) {
  console.error('CropPath v2 workflow test suite failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}
