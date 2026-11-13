/**
 * FarmIQ User State and Client Persistence Layer
 * Provides seamless multi-farm, scenario, and assistant persistence with localStorage sync.
 */

import { ProfitCalculationInput, ProfitCalculationResult } from '../calculations/profit';

export interface FarmPlot {
  id: string;
  name: string;
  areaValue: number;
  areaUnit: 'acre' | 'hectare';
  soilType: string;
  soilPh: number;
  irrigationType: 'Drip' | 'Sprinkler' | 'Rainfed' | 'Flood / Furrow';
  currentCrop?: string;
  status: 'Planted' | 'Fallow' | 'Harvesting' | 'Preparing';
}

export interface Farm {
  id: string;
  name: string;
  country: string;
  region: string;
  areaTotal: number;
  areaUnit: 'acre' | 'hectare';
  plots: FarmPlot[];
  createdAt: string;
}

export interface SavedProfitScenario {
  id: string;
  name: string;
  createdAt: string;
  input: ProfitCalculationInput;
  result: ProfitCalculationResult;
}

export interface AssistantChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  evidenceStatus?: 'supported' | 'partial' | 'insufficient';
  citations?: Array<{
    sourceId: string;
    sourceName: string;
    section: string;
    url: string;
  }>;
  warnings?: string[];
  limitations?: string;
}

export interface UserPreferences {
  measurementSystem: 'metric' | 'imperial';
  preferredCurrency: 'USD' | 'EUR' | 'INR' | 'KES' | 'BRL';
  preferredLanguage: string;
  emailAlerts: boolean;
  frostAlerts: boolean;
  marketPriceAlerts: boolean;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  country: string;
  role: 'farmer' | 'agronomist' | 'admin';
  farms: Farm[];
  activeFarmId: string;
  savedScenarios: SavedProfitScenario[];
  preferences: UserPreferences;
}

export const INITIAL_USER_PROFILE: UserProfile = {
  id: "usr-demo-01",
  displayName: "Alex Rivera",
  email: "alex.rivera@farmiq.demo",
  country: "United States",
  role: "farmer",
  preferences: {
    measurementSystem: "metric",
    preferredCurrency: "USD",
    preferredLanguage: "en",
    emailAlerts: true,
    frostAlerts: true,
    marketPriceAlerts: true
  },
  activeFarmId: "farm-01",
  farms: [
    {
      id: "farm-01",
      name: "Valley View Agricultural Estate",
      country: "United States",
      region: "Iowa / Upper Midwest",
      areaTotal: 120,
      areaUnit: "acre",
      createdAt: "2026-03-15",
      plots: [
        {
          id: "plot-101",
          name: "North Ridge (Plot A)",
          areaValue: 45,
          areaUnit: "acre",
          soilType: "Silt Loam",
          soilPh: 6.6,
          irrigationType: "Drip",
          currentCrop: "Hard Red Winter Wheat",
          status: "Planted"
        },
        {
          id: "plot-102",
          name: "East Riverfront (Plot B)",
          areaValue: 50,
          areaUnit: "acre",
          soilType: "Clay Loam",
          soilPh: 6.4,
          irrigationType: "Sprinkler",
          currentCrop: "Soybeans (Non-GMO)",
          status: "Planted"
        },
        {
          id: "plot-103",
          name: "South Terraces (Plot C)",
          areaValue: 25,
          areaUnit: "acre",
          soilType: "Sandy Loam",
          soilPh: 6.8,
          irrigationType: "Drip",
          currentCrop: "Heirloom Tomatoes",
          status: "Harvesting"
        }
      ]
    },
    {
      id: "farm-02",
      name: "Sunrise Organic Orchard & Grain",
      country: "United States",
      region: "Wisconsin",
      areaTotal: 40,
      areaUnit: "acre",
      createdAt: "2026-05-20",
      plots: [
        {
          id: "plot-201",
          name: "Hilltop Meadow",
          areaValue: 40,
          areaUnit: "acre",
          soilType: "Loam",
          soilPh: 6.5,
          irrigationType: "Rainfed",
          currentCrop: "Maize (Corn)",
          status: "Planted"
        }
      ]
    }
  ],
  savedScenarios: [
    {
      id: "scen-01",
      name: "Winter Wheat 2026 Season Plan",
      createdAt: "2026-10-08",
      input: {
        cropName: "Hard Red Winter Wheat",
        areaValue: 45,
        areaUnit: "acre",
        expectedYieldPerUnitArea: 2.4,
        yieldUnit: "tonnes",
        expectedPricePerYieldUnit: 250,
        currency: "USD",
        costs: {
          seeds: 3200,
          fertilizers: 4500,
          cropProtection: 1800,
          labor: 3500,
          irrigation: 1200,
          machineryFuel: 2900,
          landRent: 4000,
          miscellaneous: 900
        }
      },
      result: {
        totalProduction: 108,
        grossRevenue: 27000,
        totalCost: 22000,
        netProfit: 5000,
        profitPerUnitArea: 111.11,
        costPerUnitArea: 488.89,
        revenuePerUnitArea: 600,
        breakEvenYieldPerUnitArea: 1.96,
        breakEvenPricePerUnit: 203.70,
        roiPercentage: 22.7,
        marginPercentage: 18.5,
        isProfitable: true,
        costBreakdownPercentages: {
          seeds: 14.5,
          fertilizers: 20.5,
          cropProtection: 8.2,
          labor: 15.9,
          irrigation: 5.5,
          machineryFuel: 13.2,
          landRent: 18.2,
          miscellaneous: 4.1
        },
        assumptions: {
          areaValue: 45,
          areaUnit: "acre",
          currency: "USD",
          yieldUnit: "tonnes"
        }
      }
    }
  ]
};

const STORAGE_KEY = 'farmiq_user_profile_v1';

export function getStoredUserProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return INITIAL_USER_PROFILE;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_USER_PROFILE;
    return JSON.parse(raw);
  } catch {
    return INITIAL_USER_PROFILE;
  }
}

export function saveStoredUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error("Failed to persist user profile:", err);
  }
}
