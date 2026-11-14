/**
 * FarmIQ CropPath Phases 4–7 — weekly feedback analysis, receipt, badges (FIQ-090).
 * Deterministic and offline. Disease guidance comes only from the verified
 * knowledge base and always carries the ADR-006 no-dosage notice.
 */

import { calculateFarmProfit, ProfitCalculationInput, ProfitCalculationResult } from '../../calculations/profit';
import { DISEASE_KNOWLEDGE_BASE } from '../../data/mockDatabase';
import { currentWeekNumber } from './roadmap';
import { computeHealthScore } from './vision';
import {
  CropPathTracker,
  EarnedBadge,
  TrackerReceipt,
  WeeklyReport
} from './types';

export interface ReportAnalysis {
  adjustmentDays: number;
  guidance: string[];
  analysisNote: string;
  healthScore: number;
}

const RATING_ADJUSTMENT: Record<WeeklyReport['rating'], number> = {
  very_good: -3,
  good: 0,
  average: 4,
  worried: 7
};

/** Phase 8 decision table: vision stage evidence takes precedence over rating. */
export function stageAdjustmentDays(stageMatch: WeeklyReport['stageMatch']): number | null {
  switch (stageMatch) {
    case 'behind_1_week': return 7;
    case 'behind_2_plus': return 14;
    case 'ahead': return -3;
    case 'on_schedule': return null; // rating decides
    default: return null;
  }
}

function diseaseGuidanceFor(cropName: string, issues: WeeklyReport['issues']): string[] {
  if (issues !== 'pests' && issues !== 'disease') return [];
  const token = cropName.split(/[( /]/)[0].toLowerCase();
  const match = DISEASE_KNOWLEDGE_BASE.find((d) => {
    const cropLower = d.crop.toLowerCase();
    if (token.startsWith('tomato') || token.startsWith('potato')) return /tomato|potato/.test(cropLower);
    if (token.startsWith('wheat') || token.startsWith('barley')) return /wheat|barley/.test(cropLower);
    if (token.startsWith('maize') || token.startsWith('corn')) return /corn|maize/.test(cropLower);
    return cropLower.includes(token);
  });

  if (match) {
    return [
      `${match.conditionName} is a documented risk for ${match.crop}. Verified cultural practices:`,
      ...match.preventativeCulturalPractices.map((p) => `• ${p}`),
      match.officialRegulationNotice
    ];
  }

  return [
    'No verified condition entry matches this crop yet. Photograph symptoms, isolate affected patches, and consult your local agricultural extension officer before any treatment.',
    'SAFETY COMPLIANCE (ADR-006): FarmIQ does not provide pesticide dosages. Follow an authorized local label or certified officer guidance.'
  ];
}

export function analyzeWeeklyReport(
  tracker: CropPathTracker,
  report: Omit<WeeklyReport, 'id' | 'submittedAt' | 'analysisNote' | 'guidance' | 'appliedAdjustmentDays'>
): ReportAnalysis {
  const stageAdj = stageAdjustmentDays(report.stageMatch);
  const adjustmentDays = stageAdj !== null ? stageAdj : RATING_ADJUSTMENT[report.rating];
  const guidance = diseaseGuidanceFor(tracker.cropName, report.issues);

  // Phase 7 findings are observational — surfaced with the ADR-006 boundary.
  if (report.visionDiseaseSigns?.length) {
    guidance.unshift(
      `Photo analysis flagged: ${report.visionDiseaseSigns.join('; ')}. Re-photograph next week and consult your local extension officer before any treatment (ADR-006: no dosages provided).`
    );
  }
  if (report.visionNutrientFlags?.length) {
    guidance.push(
      `Leaf signs suggest possible nutrient stress (${report.visionNutrientFlags.join('; ')}). Confirm with a soil test before adjusting any fertilizer plan.`
    );
  }

  const missedActions = Object.entries(report.actionsCompleted)
    .filter(([, v]) => v !== 'yes')
    .map(([k]) => k);

  const notes: string[] = [];
  if (report.stageMatch === 'behind_1_week') {
    notes.push('Photo analysis shows the crop about a week behind — future stage dates shifted +7 days.');
  } else if (report.stageMatch === 'behind_2_plus') {
    notes.push('Photo analysis shows the crop 2+ weeks behind — future stage dates shifted +14 days.');
  } else if (report.stageMatch === 'ahead') {
    notes.push('Photo analysis shows the crop ahead of plan — schedule tightened by 3 days.');
  } else if (report.stageMatch === 'on_schedule') {
    notes.push(
      report.rating === 'worried'
        ? 'Photos show the crop on schedule despite your concern — schedule unchanged; keep scouting.'
        : 'Photo analysis: crop is on schedule.'
    );
  } else {
    notes.push(
      report.rating === 'worried'
        ? 'You flagged concern — the plan slows down (schedule shifted +7 days) and next weeks get extra scouting focus.'
        : report.rating === 'average'
          ? 'Crop is tracking slightly behind (schedule shifted +4 days); keep the coming actions on time.'
          : report.rating === 'very_good'
            ? 'Crop is ahead of plan (schedule tightened by 3 days).'
            : 'Crop is on plan; keep the weekly rhythm.'
    );
  }
  if (missedActions.length) {
    notes.push(`Pending from last week: ${missedActions.join(', ')} — carry these into this week's list.`);
  }
  if (report.issues !== 'none') {
    notes.push('Issue reported — verified guidance is attached below. No treatment dosages are provided (ADR-006).');
  }

  const healthScore = computeHealthScore(report.rating, report.stageMatch, report.issues);
  notes.push(`Estimated health score: ${healthScore}/100 (heuristic — farmer rating + photo stage + reported issues).`);

  return { adjustmentDays, guidance, analysisNote: notes.join(' '), healthScore };
}

export function applyReportToTracker(tracker: CropPathTracker, report: WeeklyReport): CropPathTracker {
  const offset = Math.max(0, tracker.weekOffsetDays + report.appliedAdjustmentDays);
  return {
    ...tracker,
    weekOffsetDays: offset,
    reports: [...tracker.reports, report],
    updatedAt: new Date().toISOString()
  };
}

export interface HarvestActuals {
  harvestDate: string;
  yieldAmount: number;
  yieldUnit: string;
  pricePerUnit: number;
  currency: string;
  costs: ProfitCalculationInput['costs'];
}

/** Receipt quality stats (v2 Phase 10): weeks run, reports, health trend. */
export function buildReceiptStats(tracker: CropPathTracker, harvestDate: string): TrackerReceipt['stats'] {
  const harvest = new Date(harvestDate);
  const sowing = new Date(tracker.sowingDate);
  const weeksRun = Number.isNaN(harvest.getTime()) || Number.isNaN(sowing.getTime())
    ? tracker.reports.length
    : currentWeekNumber(tracker.sowingDate, tracker.weekOffsetDays, tracker.totalWeeks, harvest);
  const reportedWeeks = new Set(tracker.reports.map((r) => r.weekNumber));
  const reportsSubmitted = reportedWeeks.size;
  const reportsMissed = Math.max(0, weeksRun - reportsSubmitted);
  const healthScores = tracker.reports
    .map((r) => r.healthScore)
    .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  const avgHealthScore = healthScores.length
    ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
    : null;
  const issuesDetected = tracker.reports.filter((r) => r.issues !== 'none').length;
  return { weeksRun, reportsSubmitted, reportsMissed, avgHealthScore, issuesDetected };
}

export function completeTracker(
  tracker: CropPathTracker,
  actuals: HarvestActuals,
  allTrackers: CropPathTracker[]
): { tracker: CropPathTracker; receipt: TrackerReceipt } {
  // Farmer-entered numbers are untrusted; clamp to non-negative sane values.
  const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  const cleanCosts = {
    seeds: pos(actuals.costs.seeds),
    fertilizers: pos(actuals.costs.fertilizers),
    cropProtection: pos(actuals.costs.cropProtection),
    labor: pos(actuals.costs.labor),
    irrigation: pos(actuals.costs.irrigation),
    machineryFuel: pos(actuals.costs.machineryFuel),
    landRent: pos(actuals.costs.landRent),
    miscellaneous: pos(actuals.costs.miscellaneous)
  };
  const input: ProfitCalculationInput = {
    cropName: tracker.cropName,
    areaValue: Math.max(0.001, tracker.areaValue),
    areaUnit: tracker.areaUnit,
    expectedYieldPerUnitArea: pos(actuals.yieldAmount),
    yieldUnit: actuals.yieldUnit.slice(0, 24),
    expectedPricePerYieldUnit: pos(actuals.pricePerUnit),
    currency: actuals.currency,
    costs: cleanCosts
  };
  const profit: ProfitCalculationResult = calculateFarmProfit(input);

  const harvestDate = new Date(actuals.harvestDate);
  const sowingDate = new Date(tracker.sowingDate);
  const durationDays = Math.max(
    0,
    Math.round((harvestDate.getTime() - sowingDate.getTime()) / 86400000)
  );

  const completedBefore = allTrackers.filter((t) => t.status === 'completed' && t.id !== tracker.id);
  const sameCropCompleted = completedBefore.filter(
    (t) => t.cropName === tracker.cropName
  ).length;

  const badges: EarnedBadge[] = [];
  if (completedBefore.length === 0) {
    badges.push({ id: 'first_harvest', label: 'First Harvest', emoji: '🌾', description: 'Completed your first CropPath tracker.' });
  }
  if (profit.roiPercentage > 200) {
    badges.push({ id: 'profit_champion', label: 'Profit Champion', emoji: '💰', description: 'Achieved over 200% ROI on a crop cycle.' });
  }
  if (sameCropCompleted + 1 >= 3) {
    badges.push({ id: 'crop_master', label: `${tracker.cropName} Master`, emoji: '🥇', description: `Completed 3 cycles of ${tracker.cropName}.` });
  }
  if (allWeeklyReportsSubmitted(tracker)) {
    badges.push({ id: 'diligent_farmer', label: 'Diligent Farmer', emoji: '📸', description: 'Submitted a report for every elapsed week.' });
  }

  const receipt: TrackerReceipt = {
    completedAt: new Date().toISOString(),
    harvestDate: actuals.harvestDate,
    durationDays,
    badges,
    costs: cleanCosts,
    stats: buildReceiptStats(tracker, actuals.harvestDate),
    profit: {
      totalProduction: profit.totalProduction,
      grossRevenue: profit.grossRevenue,
      totalCost: profit.totalCost,
      netProfit: profit.netProfit,
      roiPercentage: profit.roiPercentage,
      marginPercentage: profit.marginPercentage,
      isProfitable: profit.isProfitable,
      currency: actuals.currency,
      yieldUnit: actuals.yieldUnit,
      areaUnit: tracker.areaUnit,
      areaValue: tracker.areaValue,
      pricePerUnit: actuals.pricePerUnit
    }
  };

  const completed: CropPathTracker = {
    ...tracker,
    status: 'completed',
    receipt,
    updatedAt: new Date().toISOString()
  };
  return { tracker: completed, receipt };
}

/** All elapsed weeks (up to the harvest point) have at least one report. */
export function allWeeklyReportsSubmitted(tracker: CropPathTracker, now: Date = new Date()): boolean {
  const currentWeek = currentWeekNumber(tracker.sowingDate, tracker.weekOffsetDays, tracker.totalWeeks, now);
  const reportedWeeks = new Set(tracker.reports.map((r) => r.weekNumber));
  for (let w = 1; w <= currentWeek; w += 1) {
    if (!reportedWeeks.has(w)) return false;
  }
  return currentWeek > 0;
}

/** Aggregate badges across all completed trackers for the profile strip. */
export function computeEarnedBadges(trackers: CropPathTracker[]): EarnedBadge[] {
  const earned: EarnedBadge[] = [];
  const seen = new Set<string>();
  trackers
    .filter((t) => t.status === 'completed' && t.receipt)
    .forEach((t) => {
      t.receipt!.badges.forEach((b) => {
        if (!seen.has(b.id)) {
          seen.add(b.id);
          earned.push(b);
        }
      });
    });
  return earned;
}
