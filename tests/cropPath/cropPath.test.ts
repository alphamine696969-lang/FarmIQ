/**
 * FarmIQ CropPath test suite (FIQ-090).
 * Covers season detection, recommendation scoring, financial estimates,
 * roadmap generation, weekly report analysis, receipts, and badges.
 * All runs are deterministic and offline.
 */

import { detectSeason, buildRecommendations, buildFinancialEstimate, isMonsoonRegion } from '../../lib/services/cropPath/recommendation';
import { buildRoadmap, currentWeekNumber, deriveStatus } from '../../lib/services/cropPath/roadmap';
import {
  analyzeWeeklyReport,
  applyReportToTracker,
  completeTracker,
  allWeeklyReportsSubmitted,
  computeEarnedBadges
} from '../../lib/services/cropPath/analysis';
import { CROP_SUITABILITY_DB } from '../../lib/data/mockDatabase';
import { CropPathTracker } from '../../lib/services/cropPath/types';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function runTests(): void {
  console.log('Running FarmIQ CropPath Test Suite...');

  /* --------------------------- Season detection --------------------------- */

  assertEqual(detectSeason(6, true), 'Kharif', 'monsoon June → Kharif');
  assertEqual(detectSeason(9, true), 'Kharif', 'monsoon Sept → Kharif');
  assertEqual(detectSeason(3, true), 'Zaid', 'monsoon March → Zaid');
  assertEqual(detectSeason(0, true), 'Rabi', 'monsoon Jan → Rabi');
  assertEqual(detectSeason(11, true), 'Rabi', 'monsoon Dec → Rabi');
  assertEqual(detectSeason(6, false), 'Summer', 'temperate July → Summer');
  assertEqual(detectSeason(0, false), 'Winter', 'temperate Jan → Winter');
  assertEqual(detectSeason(0, false, true), 'Summer', 'southern hemisphere Jan → Summer');
  assert(isMonsoonRegion('Punjab, India'), 'India region detected as monsoon');
  assertEqual(isMonsoonRegion('Iowa, USA'), false, 'Iowa not monsoon');
  console.log('✔ Season detection (monsoon, temperate, southern hemisphere)');

  /* ------------------------ Financial estimates --------------------------- */

  const wheatProfile = CROP_SUITABILITY_DB.find((c) => c.cropName === 'Wheat')!;
  const wheatFinancial = buildFinancialEstimate(wheatProfile);
  assert(wheatFinancial.unavailable, 'no live price → honest unavailable (mock prices removed)');
  if (wheatFinancial.unavailable) {
    assert(wheatFinancial.reason.includes('official live price feed'), 'unavailable reason names the missing feed');
  }
  console.log('✔ Financials are live-only: no official price feed → honest unavailable (no sample data)');

  /* -------------------------- Recommendation ------------------------------ */

  const resilient = buildRecommendations({ goal: 'resilient', region: 'Madhya Pradesh, India', month: 10 });
  assertEqual(resilient.length, 5, 'returns top 5 crops (full verified dataset)');
  assert(resilient[0].cropName === 'Chickpeas (Garbanzo)', `resilient goal ranks chickpeas first, got ${resilient[0].cropName}`);
  assert(resilient[0].matchScore >= resilient[2].matchScore, 'scores sorted descending');
  assert(resilient[0].season === 'Rabi', 'October India → Rabi (sowing season) attached');
  assert(resilient.some((r) => r.govtSupportNote && r.govtSupportNote.includes('Agmarknet')), 'monsoon region gets MSP verify note without invented rates');
  assert(resilient.every((r) => r.citation !== null), 'each recommendation carries a citation');

  const profitable = buildRecommendations({ goal: 'high_profit', month: 6, region: 'Iowa' });
  assert(profitable[0].financial.unavailable, 'without live prices every financial is honestly unavailable');
  console.log('✔ Recommendation scoring, goal weighting, citations, honest MSP note');

  /* ----------------------------- Roadmap ---------------------------------- */

  const wheatRoadmap = buildRoadmap(wheatProfile, 'Canal');
  const expectedWeeks = Math.max(8, Math.round(wheatProfile.growthCycleDays / 7));
  assertEqual(wheatRoadmap.totalWeeks, expectedWeeks, 'roadmap scales to crop cycle');
  assertEqual(wheatRoadmap.roadmap.length, expectedWeeks, 'every week has a card');
  assertEqual(wheatRoadmap.stages[wheatRoadmap.stages.length - 1].key, 'harvest', 'last stage is harvest');
  assertEqual(wheatRoadmap.harvestWeek, wheatRoadmap.roadmap.length, 'harvest week is final week');
  let contiguous = true;
  for (let i = 1; i < wheatRoadmap.roadmap.length; i += 1) {
    if (wheatRoadmap.roadmap[i].weekNumber !== wheatRoadmap.roadmap[i - 1].weekNumber + 1) contiguous = false;
  }
  assert(contiguous, 'weeks are contiguous');
  assert(wheatRoadmap.roadmap.every((w) => w.actions.length > 0 && w.expected.length > 0), 'weeks have actions and expectations');
  assert(
    wheatRoadmap.roadmap.some((w) => w.actions.some((a) => a.startsWith('Agronomy note:'))),
    'agronomy note injected at vegetative stage'
  );
  assert(wheatRoadmap.roadmap[0].reminders.some((r) => r.toLowerCase().includes('canal')), 'irrigation-specific reminder present');
  console.log('✔ Roadmap generation (staging, scaling, agronomy notes, reminders)');

  /* ------------------------- Week math + status --------------------------- */

  const sowingDate = '2026-11-01T00:00:00.000Z';
  const week1At = new Date('2026-11-03T00:00:00.000Z');
  assertEqual(currentWeekNumber(sowingDate, 0, 17, week1At), 1, 'sowing week is week 1');
  const week4At = new Date('2026-11-25T00:00:00.000Z');
  assertEqual(currentWeekNumber(sowingDate, 0, 17, week4At), 4, 'week 4 math');
  const delayed = currentWeekNumber(sowingDate, 14, 17, week4At);
  assertEqual(delayed, 2, 'offset +14d (delay) shifts developmental week back by 2');
  assertEqual(deriveStatus(sowingDate, 0, 17, 'active', new Date('2026-12-25T00:00:00.000Z')), 'active', 'mid-cycle stays active');
  assertEqual(deriveStatus(sowingDate, 0, 17, 'active', new Date('2027-03-05T00:00:00.000Z')), 'harvest_ready', 'past final week → harvest_ready');
  assertEqual(deriveStatus(sowingDate, 14, 17, 'active', new Date('2027-03-05T00:00:00.000Z')), 'active', 'delayed crop not yet harvest-ready');
  console.log('✔ Current-week math and harvest-ready transition');

  /* ------------------------ Weekly report analysis ------------------------ */

  const tomatoProfile = CROP_SUITABILITY_DB.find((c) => c.cropName === 'Tomatoes')!;
  const tomatoRoadmap = buildRoadmap(tomatoProfile, 'Drip');
  const baseTracker: CropPathTracker = {
    id: 'trk-test-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cropName: 'Tomatoes',
    category: tomatoProfile.category,
    variety: 'Hybrid Roma',
    fieldName: 'North Field',
    village: 'Demo Village',
    areaValue: 1,
    areaUnit: 'acre',
    irrigationType: 'Drip',
    sowingDate: '2026-11-01T00:00:00.000Z',
    stages: tomatoRoadmap.stages,
    roadmap: tomatoRoadmap.roadmap,
    harvestWeek: tomatoRoadmap.harvestWeek,
    totalWeeks: tomatoRoadmap.totalWeeks,
    weekOffsetDays: 0,
    reports: [],
    status: 'active'
  };

  const worried = analyzeWeeklyReport(baseTracker, {
    weekNumber: 3,
    rating: 'worried',
    actionsCompleted: { 'Top-dress nitrogen per your soil test schedule': 'no' },
    issues: 'pests'
  });
  assertEqual(worried.adjustmentDays, 7, 'worried rating slows schedule +7d');
  assert(worried.guidance.some((g) => g.includes('Early Blight')), 'tomato pest report pulls verified early blight guidance');
  assert(worried.guidance.some((g) => g.includes('ADR-006')), 'disease guidance carries ADR-006 notice');
  assert(!worried.guidance.some((g) => /\d+\s*(kg|ml|g|litre|liter)\b/i.test(g)), 'no dosage numbers in guidance');

  const ahead = analyzeWeeklyReport(baseTracker, { weekNumber: 3, rating: 'very_good', actionsCompleted: {}, issues: 'none' });
  assertEqual(ahead.adjustmentDays, -3, 'very_good tightens schedule -3d');

  const applied = applyReportToTracker(baseTracker, {
    id: 'rep-1',
    weekNumber: 3,
    submittedAt: new Date().toISOString(),
    rating: 'worried',
    actionsCompleted: {},
    issues: 'pests',
    analysisNote: worried.analysisNote,
    guidance: worried.guidance,
    appliedAdjustmentDays: worried.adjustmentDays
  });
  assertEqual(applied.weekOffsetDays, 7, 'offset applied after report');
  assertEqual(applied.reports.length, 1, 'report stored');
  assertEqual(applyReportToTracker(applied, { ...applied.reports[0], id: 'rep-2', rating: 'very_good', appliedAdjustmentDays: -3 }).weekOffsetDays, 4, 'offset floors at 0 via max()');
  console.log('✔ Weekly report analysis (adjustments, verified disease guidance, ADR-006)');

  /* ----------------------- Receipt, badges, marketplace ------------------- */

  const harvestActuals = {
    harvestDate: '2027-03-01T00:00:00.000Z',
    yieldAmount: 14,
    yieldUnit: 'tonnes',
    pricePerUnit: 120,
    currency: 'USD',
    costs: { seeds: 200, fertilizers: 300, cropProtection: 100, labor: 400, irrigation: 100, machineryFuel: 200, landRent: 300, miscellaneous: 100 }
  };
  const { tracker: completed, receipt } = completeTracker(baseTracker, harvestActuals, []);
  assertEqual(completed.status, 'completed', 'tracker marked completed');
  // revenue = 14 t * $120 = 1680; cost = 1700 → net -20, not profitable
  assertEqual(receipt.profit.totalProduction, 14, 'receipt production matches actuals');
  assertEqual(receipt.profit.isProfitable, false, 'loss case flagged honestly');
  assertEqual(receipt.durationDays, 120, 'duration days from sowing to harvest');
  assert(receipt.badges.some((b) => b.id === 'first_harvest'), 'first harvest badge earned');

  const profitableActuals = { ...harvestActuals, pricePerUnit: 300 };
  const { receipt: richReceipt } = completeTracker(baseTracker, profitableActuals, []);
  // revenue = 14 * 300 = 4200, cost 1700 → ROI = (4200-1700)/1700 ≈ 147%
  assert(!richReceipt.badges.some((b) => b.id === 'profit_champion'), 'ROI 147% does not award profit champion');
  const hugeActuals = { ...harvestActuals, pricePerUnit: 700 };
  const { receipt: championReceipt } = completeTracker(baseTracker, hugeActuals, []);
  assert(championReceipt.badges.some((b) => b.id === 'profit_champion'), 'ROI >200% awards profit champion');

  const reportedTracker: CropPathTracker = {
    ...baseTracker,
    weekOffsetDays: 0,
    reports: Array.from({ length: 17 }, (_, i) => ({
      id: `rep-w${i + 1}`,
      weekNumber: i + 1,
      submittedAt: new Date().toISOString(),
      rating: 'good' as const,
      actionsCompleted: {},
      issues: 'none' as const,
      analysisNote: '',
      guidance: [],
      appliedAdjustmentDays: 0
    }))
  };
  assert(allWeeklyReportsSubmitted(reportedTracker, new Date('2027-01-01T00:00:00.000Z')), 'diligent: all elapsed weeks reported');
  assert(!allWeeklyReportsSubmitted(baseTracker, new Date('2026-12-25T00:00:00.000Z')), 'missing reports flagged');

  const badges = computeEarnedBadges([completed, { ...completed, id: 'trk-2', receipt: richReceipt }]);
  assert(badges.some((b) => b.id === 'first_harvest'), 'aggregate badges include first harvest');

  console.log('✔ Receipts and badges (first harvest, profit champion, diligent farmer)');

  /* ------------------------- Input hardening ------------------------- */

  const dirtyActuals = {
    harvestDate: '2027-03-01T00:00:00.000Z',
    yieldAmount: -50,
    yieldUnit: 'tonnes',
    pricePerUnit: -100,
    currency: 'USD',
    costs: { seeds: -10, fertilizers: 0, cropProtection: 100, labor: -5, irrigation: 0, machineryFuel: 0, landRent: 0, miscellaneous: 0 }
  };
  const { receipt: dirtyReceipt } = completeTracker(baseTracker, dirtyActuals, []);
  assertEqual(dirtyReceipt.profit.totalProduction, 0, 'negative yield clamped to 0');
  assertEqual(dirtyReceipt.costs.seeds, 0, 'negative seed cost clamped to 0');
  assertEqual(dirtyReceipt.profit.totalCost, 100, 'only positive costs counted');
  assertEqual(dirtyReceipt.profit.roiPercentage, -100, 'zero revenue with cost → honest -100% ROI');

  const extremeRain = buildRecommendations({ goal: 'high_profit', month: 6, rainfallMm: 99999, avgTempC: -999 });
  assert(extremeRain.length === 5, 'clamped extreme weather inputs still return recommendations');
  const negativeRain = buildRecommendations({ goal: 'high_profit', month: 6, rainfallMm: -500, soilPh: 99 });
  assert(negativeRain.length === 5, 'negative weather inputs ignored safely');
  console.log('✔ Input hardening (negative harvest values clamped, extreme weather clamped)');

  console.log('\nAll CropPath tests passed ✔');
}

try {
  runTests();
} catch (err) {
  console.error('CropPath test suite failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}
