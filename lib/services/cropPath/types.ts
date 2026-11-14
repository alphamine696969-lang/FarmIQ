/**
 * FarmIQ CropPath shared types (FIQ-090).
 * Crop lifecycle tracker: recommendation, roadmap, weekly feedback,
 * live price references at harvest, and completion receipts.
 */

export type CropGoal =
  | 'high_profit'
  | 'low_cost'
  | 'resilient'
  | 'low_water'
  | 'govt_supported'
  | 'short_duration'
  | 'organic';

/** A place picked by the farmer from type-ahead suggestions (exact coords). */
export interface PlaceSuggestion {
  name: string;
  admin1?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
}

export type Season = 'Kharif' | 'Rabi' | 'Zaid' | 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Wet' | 'Dry';

export type IrrigationType = 'Rainfed' | 'Canal' | 'Drip' | 'Borewell' | 'Sprinkler';

/** Live official price fetched at runtime (never invented; provider-stamped). */
export interface LivePriceInfo {
  price: number;
  unit: string;
  currency: string;
  sourceName: string;
  period: string;
  datasetUrl: string;
  retrievedAt: string;
}

export interface FinancialEstimate {
  unavailable: false;
  currency: string;
  yieldAmount: number;
  yieldUnit: string;
  pricePerUnit: number;
  expectedRevenue: number;
  totalExpense: number;
  estProfit: number;
  estProfitMarginPct: number;
  sourceLabel: string;
  basisNote: string;
}

export interface UnavailableFinancial {
  unavailable: true;
  reason: string;
}

export interface CropRecommendation {
  cropName: string;
  category: string;
  matchScore: number;
  season: Season;
  seasonSuitable: boolean;
  growthPeriodDays: number;
  growthPeriodLabel: string;
  whyThisCrop: string;
  whySource: 'rule' | 'ai';
  financial: FinancialEstimate | UnavailableFinancial;
  livePrice?: LivePriceInfo;
  weatherAlignment: string;
  keyBenefits: string[];
  govtSupportNote: string | null;
  citation: { sourceName: string; url: string } | null;
}

export interface RecommendationRequest {
  goal: CropGoal;
  region?: string;
  soilType?: string;
  soilPh?: number;
  avgTempC?: number;
  rainfallMm?: number;
  month?: number;
  today?: string;
  latitude?: number;
  longitude?: number;
  countryCode?: string;
  /** 14-day forecast highs/lows for weather alignment text (from context fetch). */
  forecastTempMaxC?: number[];
  forecastTempMinC?: number[];
  forecastPrecipMm?: number[];
}

export interface RoadmapStage {
  key: string;
  label: string;
  startWeek: number;
  endWeek: number;
}

export interface RoadmapWeek {
  weekNumber: number;
  stageKey: string;
  stageLabel: string;
  expected: string;
  actions: string[];
  reminders: string[];
  /** Stage-based nutrient task — rates always defer to soil test (no invented amounts). */
  fertilizerTask: string;
  irrigationTask: string;
  scoutingTask: string;
}

export type ReportRating = 'very_good' | 'good' | 'average' | 'worried';

export type ReportIssue = 'none' | 'pests' | 'disease' | 'other';

/** Vision model's stage comparison vs the roadmap expectation. */
export type StageMatch = 'on_schedule' | 'behind_1_week' | 'behind_2_plus' | 'ahead' | 'uncertain';

export interface WeeklyReport {
  id: string;
  weekNumber: number;
  submittedAt: string;
  rating: ReportRating;
  actionsCompleted: Record<string, 'yes' | 'no' | 'partial'>;
  issues: ReportIssue;
  notes?: string;
  photos?: string[];
  analysisNote: string;
  guidance: string[];
  appliedAdjustmentDays: number;
  aiSummary?: string;
  aiProvider?: string | null;
  photoAnalysis?: string;
  photoAnalysisProvider?: string | null;
  /** Structured vision report (Phase 7). */
  stageMatch?: StageMatch;
  healthScore?: number;
  visionDiseaseSigns?: string[];
  visionNutrientFlags?: string[];
}

export type TrackerStatus = 'active' | 'harvest_ready' | 'completed';

export interface EarnedBadge {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

export interface TrackerReceipt {
  completedAt: string;
  harvestDate: string;
  durationDays: number;
  badges: EarnedBadge[];
  stats: {
    weeksRun: number;
    reportsSubmitted: number;
    reportsMissed: number;
    avgHealthScore: number | null;
    issuesDetected: number;
  };
  profit: {
    totalProduction: number;
    grossRevenue: number;
    totalCost: number;
    netProfit: number;
    roiPercentage: number;
    marginPercentage: number;
    isProfitable: boolean;
    currency: string;
    yieldUnit: string;
    areaUnit: string;
    areaValue: number;
    pricePerUnit: number;
  };
  costs: {
    seeds: number;
    fertilizers: number;
    cropProtection: number;
    labor: number;
    irrigation: number;
    machineryFuel: number;
    landRent: number;
    miscellaneous: number;
  };
}

export interface CropPathTracker {
  id: string;
  createdAt: string;
  updatedAt: string;
  cropName: string;
  category: string;
  variety: string;
  fieldName: string;
  village: string;
  region?: string;
  areaValue: number;
  areaUnit: 'acre' | 'hectare' | 'bigha';
  irrigationType: IrrigationType;
  soilType?: string;
  /** Farmer-selected place (type-ahead picker) — exact weather location. */
  locationLabel?: string;
  latitude?: number;
  longitude?: number;
  sowingDate: string;
  stages: RoadmapStage[];
  roadmap: RoadmapWeek[];
  harvestWeek: number;
  totalWeeks: number;
  weekOffsetDays: number;
  reports: WeeklyReport[];
  status: TrackerStatus;
  receipt?: TrackerReceipt;
  /** ISO2 country for official price lookups (set from the picked place). */
  countryCode?: string;
}
