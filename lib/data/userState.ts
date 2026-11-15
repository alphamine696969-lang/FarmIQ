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
  authProvider?: 'google' | 'email';
  photoUrl?: string;
  avatarUrl?: string;
  googleSub?: string;
}

export const INITIAL_USER_PROFILE: UserProfile = {
  id: "usr-local-01",
  displayName: "Farmer",
  email: "",
  country: "",
  role: "farmer",
  preferences: {
    measurementSystem: "metric",
    preferredCurrency: "USD",
    preferredLanguage: "en",
    emailAlerts: true,
    frostAlerts: true,
    marketPriceAlerts: true
  },
  activeFarmId: "",
  farms: [],
  savedScenarios: []
};

const STORAGE_KEY = 'farmiq_user_profile_v2';

export function getStoredUserProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return INITIAL_USER_PROFILE;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('farmiq_user_profile_v1');
    if (!raw) return INITIAL_USER_PROFILE;
    const parsed = JSON.parse(raw);
    // If the cached profile is the old demo profile with hardcoded mock farms, clear and start fresh
    if (parsed.id === 'usr-demo-01' || parsed.displayName === 'Alex Rivera' || (Array.isArray(parsed.farms) && parsed.farms.some((f: any) => f.id === 'farm-01'))) {
      localStorage.removeItem('farmiq_user_profile_v1');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_USER_PROFILE));
      return INITIAL_USER_PROFILE;
    }
    return parsed;
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
