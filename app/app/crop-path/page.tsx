'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FreshnessBadge } from '@/components/ui/Badge';
import { CROP_SUITABILITY_DB, CropSuitabilityProfile } from '@/lib/data/mockDatabase';
import { buildRecommendations, detectSeason, isMonsoonRegion } from '@/lib/services/cropPath/recommendation';
import { buildRoadmap, currentWeekNumber, deriveStatus } from '@/lib/services/cropPath/roadmap';
import {
  analyzeWeeklyReport,
  applyReportToTracker,
  completeTracker,
  computeEarnedBadges,
  HarvestActuals
} from '@/lib/services/cropPath/analysis';
import {
  addOrUpdateTracker,
  getCropPathState,
  removeTracker,
  saveCropPathState
} from '@/lib/data/cropPathState';
import {
  CropGoal,
  CropPathTracker,
  CropRecommendation,
  IrrigationType,
  PlaceSuggestion,
  ReportIssue,
  ReportRating,
  WeeklyReport
} from '@/lib/services/cropPath/types';
import { CropWeatherSummary } from '@/lib/services/cropPath/weather';
import { VisionReport } from '@/lib/services/cropPath/vision';
import { LivePriceInfo } from '@/lib/services/cropPath/types';
import {
  Sprout,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Receipt,
  CalendarDays,
  Droplets,
  Bug,
  Wallet,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CloudRain,
  CloudSun,
  RefreshCw,
  Sun,
  Snowflake,
  ThermometerSun
} from 'lucide-react';

interface WeatherLookup {
  state: 'idle' | 'loading' | 'ready' | 'unavailable';
  summary?: CropWeatherSummary;
  reason?: string;
}

const WEATHER_NOTE_ICONS: Record<string, React.ReactNode> = {
  rain: <CloudRain className="w-3.5 h-3.5" />,
  frost: <Snowflake className="w-3.5 h-3.5" />,
  heat: <ThermometerSun className="w-3.5 h-3.5" />,
  blight_risk: <AlertTriangle className="w-3.5 h-3.5" />,
  dry_spell: <Sun className="w-3.5 h-3.5" />
};

type View = 'home' | 'recommend' | 'setup' | 'tracker';

const GOALS: Array<{ value: CropGoal; label: string }> = [
  { value: 'high_profit', label: 'High profit' },
  { value: 'low_cost', label: 'Low cost' },
  { value: 'low_water', label: 'Low water' },
  { value: 'short_duration', label: 'Short duration' },
  { value: 'govt_supported', label: 'Govt-supported' },
  { value: 'resilient', label: 'Resilient' },
  { value: 'organic', label: 'Organic-style' }
];

const RATINGS: Array<{ value: ReportRating; label: string }> = [
  { value: 'very_good', label: 'Very good' },
  { value: 'good', label: 'Good' },
  { value: 'average', label: 'Average' },
  { value: 'worried', label: 'Worried' }
];

const ISSUES: Array<{ value: ReportIssue; label: string }> = [
  { value: 'none', label: 'No issues' },
  { value: 'pests', label: 'Some pests' },
  { value: 'disease', label: 'Disease signs' },
  { value: 'other', label: 'Other' }
];

const SOIL_OPTIONS = ['Loam', 'Clay Loam', 'Sandy Loam', 'Silt Loam', 'Black Soil', 'Red Soil'];
const IRRIGATION_OPTIONS: IrrigationType[] = ['Rainfed', 'Canal', 'Drip', 'Sprinkler', 'Borewell'];

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function Segmented<T extends string>({ options, value, onChange }: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 p-1 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-smooth ${
            value === o.value ? 'bg-white text-[#153D2B] shadow-sm border border-[#DCE5DC]' : 'text-[#3D4A3B] hover:text-[#153D2B]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function placeLabel(p: PlaceSuggestion): string {
  return [p.name, p.admin1].filter(Boolean).join(', ');
}

function PlaceSearchInput({ value, onChange, onSelect, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (p: PlaceSuggestion) => void;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/crop-path/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q })
        });
        const json = await res.json();
        if (!cancelled) {
          const s: PlaceSuggestion[] = Array.isArray(json?.data?.suggestions) ? json.data.suggestions : [];
          setSuggestions(s);
          setOpen(s.length > 0);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); }}
        onFocus={() => { if (suggestions.length) setOpen(true); }}
        onBlur={() => { setTimeout(() => setOpen(false), 150); }}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-sm text-[#1C2922] bg-[#F3FCF3]/60 focus:ring-2 focus:ring-[#1BC447] outline-none"
        autoComplete="off"
      />
      {loading && (
        <span className="absolute right-3 top-2.5 text-[10px] text-[#3D4A3B] font-bold">Searching…</span>
      )}
      {open && suggestions.length > 0 && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-[#DCE5DC] rounded-2xl shadow-floating overflow-hidden">
          {suggestions.map((p) => (
            <button
              key={`${p.latitude},${p.longitude},${p.name}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(p);
                onChange(placeLabel(p));
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#1C2922] hover:bg-[#EDF6ED] border-b border-[#DCE5DC] last:border-b-0"
            >
              {placeLabel(p)}
              {p.country && <span className="text-[#3D4A3B] font-medium"> — {p.country}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

async function compressImage(file: File): Promise<string | null> {
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const img = document.createElement('img');
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = dataUrl; });
    const scale = Math.min(1, 320 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch {
    return null;
  }
}

export default function CropPathPage() {
  const [view, setView] = useState<View>('home');
  const [trackers, setTrackers] = useState<CropPathTracker[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Recommendation state
  const [goal, setGoal] = useState<CropGoal>('high_profit');
  const [region, setRegion] = useState('');
  const [soilType, setSoilType] = useState('');
  const [recs, setRecs] = useState<CropRecommendation[]>([]);
  const [aiReasons, setAiReasons] = useState<Record<string, string>>({});
  const [aiRanked, setAiRanked] = useState(false);
  const [aiEnhanceState, setAiEnhanceState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [selectedRec, setSelectedRec] = useState<CropRecommendation | null>(null);

  // Field setup state
  const [fieldName, setFieldName] = useState('');
  const [village, setVillage] = useState('');
  const [areaValue, setAreaValue] = useState('1');
  const [areaUnit, setAreaUnit] = useState<'acre' | 'hectare' | 'bigha'>('acre');
  const [variety, setVariety] = useState('');
  const [sowingDate, setSowingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [irrigationType, setIrrigationType] = useState<IrrigationType>('Rainfed');

  // Tracker detail state
  const [activeTrackerId, setActiveTrackerId] = useState<string | null>(null);
  const [showAllWeeks, setShowAllWeeks] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showHarvestForm, setShowHarvestForm] = useState(false);
  const [showWeekDetail, setShowWeekDetail] = useState<number | null>(null);

  // Report form state
  const [rating, setRating] = useState<ReportRating>('good');
  const [issues, setIssues] = useState<ReportIssue>('none');
  const [actionValues, setActionValues] = useState<Record<string, 'yes' | 'no' | 'partial'>>({});
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [reportBusy, setReportBusy] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState<{ text: string; provider: string | null } | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  // Weather state
  const [recWeather, setRecWeather] = useState<WeatherLookup>({ state: 'idle' });
  const [trackerWeather, setTrackerWeather] = useState<WeatherLookup>({ state: 'idle' });
  const [regionPlace, setRegionPlace] = useState<PlaceSuggestion | null>(null);
  const [villagePlace, setVillagePlace] = useState<PlaceSuggestion | null>(null);

  // Phase 1 live context + prices
  interface ContextData {
    available: boolean;
    reason?: string;
    location?: { label: string; latitude: number; longitude: number; country?: string; countryCode?: string };
    season?: string;
    hemisphere?: string;
    tropical?: boolean;
    currentTempC?: number | null;
    days?: Array<{ date: string; tempMaxC: number; tempMinC: number; precipitationMm: number; uvIndexMax: number | null }>;
    soil?: { sandPct: number; clayPct: number; siltPct: number; textureClass: string; sourceName: string } | null;
    retrievedAt?: string;
  }
  const [cropContext, setCropContext] = useState<ContextData | null>(null);
  const [contextState, setContextState] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');
  const [priceStatus, setPriceStatus] = useState<{ status: string; note: string } | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, LivePriceInfo>>({});
  const [geoBusy, setGeoBusy] = useState(false);

  // Phase 7 vision + harvest maturity
  const [visionReport, setVisionReport] = useState<VisionReport | null>(null);
  const [maturityCheck, setMaturityCheck] = useState<{ state: 'idle' | 'checking'; confirmed: boolean | null }>({ state: 'idle', confirmed: null });

  // Harvest form state
  const [harvestDate, setHarvestDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [yieldAmount, setYieldAmount] = useState('');
  const [yieldUnit, setYieldUnit] = useState('quintals');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [costs, setCosts] = useState({ seeds: '', fertilizers: '', cropProtection: '', labor: '', irrigation: '', machineryFuel: '', landRent: '', miscellaneous: '' });

  useEffect(() => {
    setTrackers(getCropPathState().trackers);
    setLoaded(true);
  }, []);

  const refreshTrackers = useCallback((next: CropPathTracker[]) => {
    setTrackers(next);
    saveCropPathState({ trackers: next });
  }, []);

  const activeTracker = useMemo(
    () => trackers.find((t) => t.id === activeTrackerId) || null,
    [trackers, activeTrackerId]
  );

  const earnedBadges = useMemo(() => computeEarnedBadges(trackers), [trackers]);

  /* ------------------------------ Recommendation ------------------------------ */

  const lookupWeather = useCallback(async (
    village: string,
    region: string,
    cropName: string,
    place?: { latitude: number; longitude: number; label: string } | null
  ): Promise<WeatherLookup> => {
    try {
      const res = await fetch('/api/crop-path/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(place
          ? { lat: place.latitude, lon: place.longitude, label: place.label, cropName }
          : { village, region, cropName })
      });
      const json = await res.json();
      if (json?.data?.available) return { state: 'ready', summary: json.data as CropWeatherSummary };
      return { state: 'unavailable', reason: json?.data?.reason || 'Live weather unavailable.' };
    } catch {
      return { state: 'unavailable', reason: 'Live weather unavailable right now.' };
    }
  }, []);

  // Reset per-tracker form state when switching trackers.
  useEffect(() => {
    setPhotoAnalysis(null);
    setPhotos([]);
    setVisionReport(null);
    setMaturityCheck({ state: 'idle', confirmed: null });
    setMaturityPhoto(null);
    setShowReportForm(false);
    setShowHarvestForm(false);
    setShowAllWeeks(false);
    setShowWeekDetail(null);
  }, [activeTrackerId]);

  const loadTrackerWeather = useCallback((t: CropPathTracker) => {
    setTrackerWeather({ state: 'loading' });
    const place = t.latitude != null && t.longitude != null
      ? { latitude: t.latitude, longitude: t.longitude, label: t.locationLabel || 'field location' }
      : null;
    lookupWeather(t.village || '', t.region || '', t.cropName, place).then(setTrackerWeather);
  }, [lookupWeather]);

  // Live weather for the open tracker (cached 10 min server-side).
  useEffect(() => {
    if (view !== 'tracker' || !activeTracker) return;
    let cancelled = false;
    setTrackerWeather({ state: 'loading' });
    const t = activeTracker;
    const place = t.latitude != null && t.longitude != null
      ? { latitude: t.latitude, longitude: t.longitude, label: t.locationLabel || 'field location' }
      : null;
    lookupWeather(t.village || '', t.region || '', t.cropName, place)
      .then((w) => { if (!cancelled) setTrackerWeather(w); });
    return () => { cancelled = true; };
  }, [view, activeTrackerId, lookupWeather]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRegionPlace({
          name: 'Current location',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setRegion(`Current location (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`);
        setGeoBusy(false);
      },
      () => setGeoBusy(false),
      { timeout: 10_000 }
    );
  };

  const runRecommendation = async () => {
    setAiEnhanceState('loading');
    setPriceStatus(null);
    setRecWeather(region || regionPlace ? { state: 'loading' } : { state: 'idle' });
    setContextState(region || regionPlace ? 'loading' : 'idle');

    // Phase 1: live background fetch (forecast + soil + season) for a picked
    // place or a typed region — season uses the country code so Indian regions
    // get Kharif/Rabi/Zaid instead of temperate labels.
    let context: ContextData | null = null;
    const contextPayload = regionPlace
      ? {
          lat: regionPlace.latitude,
          lon: regionPlace.longitude,
          label: placeLabel(regionPlace),
          countryCode: regionPlace.countryCode
        }
      : region.trim()
        ? { region: region.trim() }
        : null;

    if (contextPayload) {
      try {
        const res = await fetch('/api/crop-path/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contextPayload)
        });
        const json = await res.json();
        context = json?.data?.available ? json.data : null;
        setContextState(context ? 'ready' : 'unavailable');
      } catch {
        setContextState('unavailable');
      }
    } else {
      setContextState('idle');
    }

    if (context) {
      setRecWeather({
        state: 'ready',
        summary: {
          available: true,
          isLive: true,
          provider: 'Open-Meteo',
          locationName: context.location?.label || placeLabel(regionPlace || { name: region, latitude: 0, longitude: 0 }),
          country: context.location?.country,
          latitude: context.location?.latitude ?? regionPlace?.latitude ?? 0,
          longitude: context.location?.longitude ?? regionPlace?.longitude ?? 0,
          retrievedAt: context.retrievedAt || new Date().toISOString(),
          currentTempC: context.currentTempC ?? null,
          currentHumidityPct: null,
          next3Days: (context.days || []).slice(0, 3).map((d) => ({
            date: d.date,
            tempMinC: d.tempMinC,
            tempMaxC: d.tempMaxC,
            precipitationMm: d.precipitationMm,
            precipitationChancePct: null,
            humidityPct: null,
            et0Mm: null
          })),
          precipNext3DaysMm: Number((context.days || []).slice(0, 3).reduce((s, d) => s + (Number.isFinite(d.precipitationMm) ? d.precipitationMm : 0), 0).toFixed(1)),
          rainExpectedNext3Days: (context.days || []).slice(0, 3).some((d) => d.precipitationMm >= 5),
          maxTempNext3DaysC: (context.days || []).length ? Math.max(...context.days!.slice(0, 3).map((d) => d.tempMaxC)) : null,
          minTempNext3DaysC: (context.days || []).length ? Math.min(...context.days!.slice(0, 3).map((d) => d.tempMinC)) : null,
          wateringSkipped: (context.days || []).slice(0, 3).some((d) => d.precipitationMm >= 5),
          notes: []
        }
      });
    } else if (region.trim()) {
      const w = await lookupWeather('', region, '');
      setRecWeather(w);
    } else {
      setRecWeather({ state: 'idle' });
    }

    const rainfall30d = context?.days
      ? Math.round((context.days.reduce((s, d) => s + (Number.isFinite(d.precipitationMm) ? d.precipitationMm : 0), 0) / Math.max(1, context.days.length)) * 30)
      : undefined;

    const baseRecs = buildRecommendations({
      goal,
      region: region || undefined,
      soilType: soilType || undefined,
      avgTempC: context?.currentTempC ?? undefined,
      rainfallMm: rainfall30d,
      month: new Date().getMonth() + 1,
      latitude: context?.location?.latitude ?? regionPlace?.latitude,
      countryCode: regionPlace?.countryCode || context?.location?.countryCode || undefined,
      forecastTempMaxC: context?.days?.map((d) => d.tempMaxC),
      forecastTempMinC: context?.days?.map((d) => d.tempMinC),
      forecastPrecipMm: context?.days?.map((d) => d.precipitationMm)
    });

    // Phase 1: official live prices for the farmer's country (honest fallback).
    const countryCode = regionPlace?.countryCode || context?.location?.countryCode || '';
    let prices: Record<string, LivePriceInfo> = {};
    if (countryCode) {
      try {
        const res = await fetch('/api/crop-path/prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crops: baseRecs.map((r) => r.cropName), countryCode })
        });
        const json = await res.json();
        if (json?.data) {
          setPriceStatus({ status: json.data.status, note: json.data.note });
          prices = Object.fromEntries(
            Object.entries(json.data.prices || {}).filter(([, v]) => v !== null) as Array<[string, LivePriceInfo]>
          );
        }
      } catch {
        setPriceStatus({ status: 'unavailable', note: 'Official price feed is temporarily unavailable.' });
      }
    } else {
      setPriceStatus({
        status: 'country_unavailable',
        note: 'Pick a place so we know your country — official prices are only shown with a verified country and source.'
      });
    }

    const results = buildRecommendations(
      {
        goal,
        region: region || undefined,
        soilType: soilType || undefined,
        avgTempC: context?.currentTempC ?? undefined,
        rainfallMm: rainfall30d,
        month: new Date().getMonth() + 1,
        latitude: context?.location?.latitude ?? regionPlace?.latitude,
        countryCode: regionPlace?.countryCode || context?.location?.countryCode || undefined,
        forecastTempMaxC: context?.days?.map((d) => d.tempMaxC),
        forecastTempMinC: context?.days?.map((d) => d.tempMinC),
        forecastPrecipMm: context?.days?.map((d) => d.precipitationMm)
      },
      { livePrices: prices }
    );
    setRecs(results);
    setAiReasons({});
    setAiRanked(false);
    setAiEnhanceState('loading');

    // AI recommendation: the model reorders and explains the verified
    // candidates using the live context; agronomic facts are supplied by us.
    const candidates = results.map((r) => {
      const profile = CROP_SUITABILITY_DB.find((c) => c.cropName === r.cropName);
      return {
        name: r.cropName,
        category: r.category,
        cycleDays: r.growthPeriodDays,
        resilience: profile?.resilienceScore ?? 5,
        tempMinC: profile?.minTempC ?? 0,
        tempMaxC: profile?.maxTempC ?? 0,
        phMin: profile?.minPh ?? 0,
        phMax: profile?.maxPh ?? 0,
        rainMinMm: profile?.minRainfallMm ?? 0,
        rainMaxMm: profile?.maxRainfallMm ?? 0,
        ruleScore: r.matchScore,
        seasonSuitable: r.seasonSuitable
      };
    });
    const precip14dMm = context?.days
      ? Number(context.days.reduce((sum, d) => sum + (Number.isFinite(d.precipitationMm) ? d.precipitationMm : 0), 0).toFixed(1))
      : undefined;
    fetch('/api/crop-path/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal,
        season: results[0]?.season,
        region: region || undefined,
        context: {
          currentTempC: context?.currentTempC,
          precip14dMm,
          tempMax14C: context?.days?.length ? Math.max(...context.days.map((d) => d.tempMaxC)) : undefined,
          tempMin14C: context?.days?.length ? Math.min(...context.days.map((d) => d.tempMinC)) : undefined,
          soilTexture: context?.soil?.textureClass
        },
        candidates
      })
    })
      .then((res) => res.json())
      .then((json) => {
        const data = json?.data;
        if (data?.reasons && typeof data.reasons === 'object') setAiReasons(data.reasons);
        if (Array.isArray(data?.ranking) && data.ranking.length >= 2) {
          const byName = new Map(results.map((r) => [r.cropName, r]));
          const ordered: typeof results = [];
          data.ranking.forEach((n: string) => {
            const hit = byName.get(n);
            if (hit) {
              ordered.push(hit);
              byName.delete(n);
            }
          });
          byName.forEach((r) => ordered.push(r));
          setRecs(ordered);
          setAiRanked(!data.fallback);
        }
        setAiEnhanceState('done');
      })
      .catch(() => setAiEnhanceState('done'));
  };

  /* -------------------------------- Field setup ------------------------------- */

  const createTracker = () => {
    if (!selectedRec || !fieldName.trim() || !areaValue || !sowingDate) return;
    const profile = CROP_SUITABILITY_DB.find((c) => c.cropName === selectedRec.cropName);
    if (!profile) return;
    const roadmap = buildRoadmap(profile, irrigationType);
    const now = new Date().toISOString();
    const tracker: CropPathTracker = {
      id: `trk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now,
      cropName: profile.cropName,
      category: profile.category,
      variety: variety.trim(),
      fieldName: fieldName.trim(),
      village: village.trim(),
      region: region.trim() || undefined,
      areaValue: Math.max(0.01, Number(areaValue) || 0.01),
      areaUnit,
      irrigationType,
      soilType: soilType || undefined,
      locationLabel: villagePlace ? placeLabel(villagePlace) : village.trim() || region.trim() || undefined,
      latitude: villagePlace?.latitude ?? regionPlace?.latitude,
      longitude: villagePlace?.longitude ?? regionPlace?.longitude,
      sowingDate: new Date(`${sowingDate}T00:00:00.000Z`).toISOString(),
      stages: roadmap.stages,
      roadmap: roadmap.roadmap,
      harvestWeek: roadmap.harvestWeek,
      totalWeeks: roadmap.totalWeeks,
      weekOffsetDays: 0,
      reports: [],
      status: 'active',
      countryCode: villagePlace?.countryCode || regionPlace?.countryCode || cropContext?.location?.countryCode
    };
    refreshTrackers(addOrUpdateTracker(tracker));
    setActiveTrackerId(tracker.id);
    setView('tracker');
    resetFlow();
  };

  const resetFlow = () => {
    setSelectedRec(null);
    setRecs([]);
    setAiReasons({});
    setAiRanked(false);
    setAiEnhanceState('idle');
    setRecWeather({ state: 'idle' });
    setRegionPlace(null);
    setVillagePlace(null);
    setFieldName('');
    setVillage('');
    setVariety('');
    setAreaValue('1');
    setIrrigationType('Rainfed');
  };

  /* ------------------------------ Weekly report ------------------------------- */

  const analyzePhotos = async () => {
    if (!activeTracker || !photos.length || photoBusy) return;
    const now = new Date();
    const weekNumber = currentWeekNumber(activeTracker.sowingDate, activeTracker.weekOffsetDays, activeTracker.totalWeeks, now);
    const week = activeTracker.roadmap.find((w) => w.weekNumber === weekNumber);
    setPhotoBusy(true);
    try {
      const res = await fetch('/api/crop-path/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropName: activeTracker.cropName,
          weekNumber,
          stageLabel: week?.stageLabel || '',
          images: photos.slice(0, 3)
        })
      });
      const json = await res.json();
      if (json?.data?.analysis) {
        setPhotoAnalysis({ text: json.data.analysis, provider: json.data.providerUsed ?? null });
        if (json.data.report) setVisionReport(json.data.report as VisionReport);
        else setVisionReport(null);
      } else {
        setPhotoAnalysis({ text: json?.data?.reason || 'Photo analysis is unavailable right now (vision model unreachable). Your photos are still saved with the report.', provider: null });
        setVisionReport(null);
      }
    } catch {
      setPhotoAnalysis({ text: 'Photo analysis is unavailable right now. Your photos are still saved with the report.', provider: null });
      setVisionReport(null);
    } finally {
      setPhotoBusy(false);
    }
  };

  const submitReport = async () => {
    if (!activeTracker) return;
    if (!photos.length) return; // Phase 5: photos are required for the weekly report
    const now = new Date();
    const weekNumber = currentWeekNumber(activeTracker.sowingDate, activeTracker.weekOffsetDays, activeTracker.totalWeeks, now);
    const week = activeTracker.roadmap.find((w) => w.weekNumber === weekNumber) || activeTracker.roadmap[activeTracker.roadmap.length - 1];
    const draft = {
      weekNumber,
      rating,
      actionsCompleted: actionValues,
      issues,
      notes: notes.trim() || undefined,
      photos: photos.length ? photos : undefined,
      photoAnalysis: photoAnalysis?.text || undefined,
      photoAnalysisProvider: photoAnalysis?.provider || null,
      stageMatch: visionReport?.stageMatch,
      visionDiseaseSigns: visionReport?.diseaseSigns?.length ? visionReport.diseaseSigns : undefined,
      visionNutrientFlags: visionReport?.nutrientFlags?.length ? visionReport.nutrientFlags : undefined
    };
    const analysis = analyzeWeeklyReport(activeTracker, draft);
    const report: WeeklyReport = {
      id: `rep-${Date.now()}`,
      submittedAt: now.toISOString(),
      analysisNote: analysis.analysisNote,
      guidance: analysis.guidance,
      appliedAdjustmentDays: analysis.adjustmentDays,
      healthScore: analysis.healthScore,
      ...draft
    };

    let updated = applyReportToTracker(activeTracker, report);
    updated = { ...updated, status: deriveStatus(updated.sowingDate, updated.weekOffsetDays, updated.totalWeeks, updated.status) };
    refreshTrackers(addOrUpdateTracker(updated));

    // Optional AI assessment; degrades silently when the provider is unavailable.
    try {
      const res = await fetch('/api/crop-path/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropName: updated.cropName,
          weekNumber,
          stageLabel: week.stageLabel,
          rating,
          issues,
          actionsCompleted: actionValues,
          notes
        })
      });
      const json = await res.json();
      if (json?.data?.summary) {
        const reports = updated.reports.map((r) =>
          r.id === report.id ? { ...r, aiSummary: json.data.summary, aiProvider: json.data.providerUsed ?? null } : r
        );
        const withAi = { ...updated, reports };
        refreshTrackers(addOrUpdateTracker(withAi));
      }
    } catch {
      // Deterministic analysis is already stored; AI is an optional layer.
    }

    setShowReportForm(false);
    setShowWeekDetail(weekNumber);
    setRating('good');
    setIssues('none');
    setActionValues({});
    setNotes('');
    setPhotos([]);
    setPhotoAnalysis(null);
    setVisionReport(null);
  };

  /* --------------------------------- Harvest ---------------------------------- */

  // Phase 9: harvest maturity confirmation via photo
  const [maturityPhoto, setMaturityPhoto] = useState<string | null>(null);
  const [maturityBusy, setMaturityBusy] = useState(false);

  // Phase 9: live official price at harvest (no sample data — unavailable when not covered).
  const [harvestPrice, setHarvestPrice] = useState<{ loading: boolean; info: LivePriceInfo | null; note: string | null }>({ loading: false, info: null, note: null });

  useEffect(() => {
    if (view !== 'tracker' || !activeTracker || activeTracker.status !== 'harvest_ready') {
      setHarvestPrice({ loading: false, info: null, note: null });
      return;
    }
    if (!activeTracker.countryCode) {
      setHarvestPrice({ loading: false, info: null, note: 'This tracker has no country on file — pick a place when creating it to get official prices.' });
      return;
    }
    let cancelled = false;
    setHarvestPrice({ loading: true, info: null, note: null });
    fetch('/api/crop-path/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crops: [activeTracker.cropName], countryCode: activeTracker.countryCode })
    })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const info: LivePriceInfo | null = j?.data?.prices?.[activeTracker.cropName] ?? null;
        setHarvestPrice({ loading: false, info, note: j?.data?.note ?? null });
      })
      .catch(() => {
        if (!cancelled) setHarvestPrice({ loading: false, info: null, note: 'Official price feed is temporarily unavailable — verify local rates before selling.' });
      });
    return () => { cancelled = true; };
  }, [view, activeTrackerId, activeTracker?.status]);

  const checkMaturity = async () => {
    if (!activeTracker || !maturityPhoto || maturityBusy) return;
    setMaturityBusy(true);
    setMaturityCheck({ state: 'checking', confirmed: null });
    try {
      const res = await fetch('/api/crop-path/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropName: activeTracker.cropName,
          weekNumber: activeTracker.totalWeeks,
          stageLabel: 'Maturity / Harvest',
          images: [maturityPhoto]
        })
      });
      const json = await res.json();
      setMaturityCheck({ state: 'idle', confirmed: json?.data?.report?.maturityConfirmed ?? null });
    } catch {
      setMaturityCheck({ state: 'idle', confirmed: null });
    } finally {
      setMaturityBusy(false);
    }
  };

  const extendOneWeek = () => {
    if (!activeTracker) return;
    const updated: CropPathTracker = {
      ...activeTracker,
      weekOffsetDays: activeTracker.weekOffsetDays + 7,
      updatedAt: new Date().toISOString()
    };
    updated.status = deriveStatus(updated.sowingDate, updated.weekOffsetDays, updated.totalWeeks, updated.status);
    refreshTrackers(addOrUpdateTracker(updated));
    setMaturityCheck({ state: 'idle', confirmed: null });
    setMaturityPhoto(null);
  };

  const confirmHarvest = () => {
    if (!activeTracker) return;
    const actuals: HarvestActuals = {
      harvestDate: new Date(`${harvestDate}T00:00:00.000Z`).toISOString(),
      yieldAmount: Number(yieldAmount) || 0,
      yieldUnit: yieldUnit.trim() || 'quintals',
      pricePerUnit: Number(pricePerUnit) || 0,
      currency: currency,
      costs: {
        seeds: Number(costs.seeds) || 0,
        fertilizers: Number(costs.fertilizers) || 0,
        cropProtection: Number(costs.cropProtection) || 0,
        labor: Number(costs.labor) || 0,
        irrigation: Number(costs.irrigation) || 0,
        machineryFuel: Number(costs.machineryFuel) || 0,
        landRent: Number(costs.landRent) || 0,
        miscellaneous: Number(costs.miscellaneous) || 0
      }
    };
    const { tracker: completed } = completeTracker(activeTracker, actuals, trackers);
    refreshTrackers(addOrUpdateTracker(completed));
    setShowHarvestForm(false);
  };

  const deleteTracker = (id: string) => {
    refreshTrackers(removeTracker(id));
    if (activeTrackerId === id) {
      setActiveTrackerId(null);
      setView('home');
    }
  };

  /* --------------------------------- Render ----------------------------------- */

  const trackerProgress = (t: CropPathTracker, now: Date) => {
    const week = currentWeekNumber(t.sowingDate, t.weekOffsetDays, t.totalWeeks, now);
    const status = deriveStatus(t.sowingDate, t.weekOffsetDays, t.totalWeeks, t.status, now);
    return { week, status };
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#153D2B] text-[#1BC447] flex items-center justify-center">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-extrabold tracking-tight text-[#1C2922]">CropPath Tracker</h2>
                <FreshnessBadge status="live" label="Live weather + official prices" />
              </div>
              <p className="text-xs text-[#3D4A3B] mt-0.5 font-medium">
                One crop. One field. A week-by-week plan from sowing to sale.
              </p>
            </div>
          </div>
          {view === 'home' && (
            <button
              onClick={() => { resetFlow(); setView('recommend'); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1BC447] text-[#153D2B] text-sm font-extrabold hover:brightness-105 transition-smooth"
            >
              <Plus className="w-4 h-4" /> Start a new tracker
            </button>
          )}
          {view !== 'home' && (
            <button
              onClick={() => setView(view === 'tracker' ? 'home' : activeTrackerId ? 'tracker' : 'home')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-[#DCE5DC] text-sm font-bold text-[#3D4A3B] hover:text-[#153D2B] transition-smooth"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
        </div>

        {/* Live-data notice */}
        <div className="flex items-start gap-2.5 bg-white/70 border border-[#DCE5DC] rounded-2xl px-4 py-3 text-[11px] text-[#3D4A3B] font-medium">
          <AlertTriangle className="w-4 h-4 text-[#FD9D1A] shrink-0 mt-0.5" />
          <span>
            Weather, soil, and prices are fetched live (Open-Meteo, SoilGrids, Eurostat official annual prices) — where a source is not connected or not covering your country, it is shown as <strong>unavailable</strong> rather than filled with sample data. Trackers are stored only in this browser (account sync pending). AI outputs are advisory and never dosages.
          </span>
        </div>

        {/* ------------------------------- HOME ------------------------------- */}
        {view === 'home' && (
          <div className="space-y-6">
            {(() => {
              const now = new Date();
              const items: Array<{ trackerId: string; text: string; kind: 'due' | 'harvest' | 'shift' }> = [];
              trackers.forEach((t) => {
                if (t.status === 'completed') return;
                const week = currentWeekNumber(t.sowingDate, t.weekOffsetDays, t.totalWeeks, now);
                const reported = new Set(t.reports.map((r) => r.weekNumber));
                const status = deriveStatus(t.sowingDate, t.weekOffsetDays, t.totalWeeks, t.status, now);
                if (status === 'harvest_ready') {
                  items.push({ trackerId: t.id, kind: 'harvest', text: `${t.cropName} (${t.fieldName}): harvest window is open — confirm maturity and record the harvest.` });
                } else if (!reported.has(week)) {
                  items.push({ trackerId: t.id, kind: 'due', text: `${t.cropName} (${t.fieldName}): Week ${week} report is due.` });
                }
                if (t.weekOffsetDays > 0) {
                  items.push({ trackerId: t.id, kind: 'shift', text: `${t.cropName}: schedule shifted +${t.weekOffsetDays}d from earlier reports — future dates adjusted.` });
                }
              });
              if (!items.length) return null;
              return (
                <div className="bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento space-y-3">
                  <h3 className="text-sm font-extrabold text-[#1C2922]">Reminders</h3>
                  {items.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => { setActiveTrackerId(item.trackerId); setView('tracker'); }}
                      className={`w-full text-left flex items-start gap-2.5 rounded-2xl px-4 py-3 text-[11px] font-semibold border ${
                        item.kind === 'harvest' ? 'bg-[#FFF6EB] border-[#FFE0B2] text-[#895100]'
                        : item.kind === 'due' ? 'bg-[#EDF6ED] border-[#DCE5DC] text-[#153D2B]'
                        : 'bg-[#EDF7FF] border-[#BEE3F8] text-[#004263]'
                      }`}>
                        <span className="shrink-0 mt-0.5">{item.kind === 'harvest' ? '🏁' : item.kind === 'due' ? '📸' : '⏱'}</span>
                        <span>{item.text}</span>
                      </button>
                    ))}
                </div>
              );
            })()}
            {earnedBadges.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento">
                <h3 className="text-sm font-extrabold text-[#1C2922] mb-3">Badges earned</h3>
                <div className="flex flex-wrap gap-3">
                  {earnedBadges.map((b) => (
                    <div key={b.id} className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#EDF6ED] border border-[#DCE5DC]">
                      <span className="text-lg">{b.emoji}</span>
                      <div>
                        <p className="text-xs font-extrabold text-[#153D2B]">{b.label}</p>
                        <p className="text-[10px] text-[#3D4A3B] font-medium">{b.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loaded && trackers.length === 0 && (
              <div className="bg-white p-10 rounded-3xl border border-[#DCE5DC] shadow-bento text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-[#EDF6ED] flex items-center justify-center">
                  <Sprout className="w-7 h-7 text-[#1BC447]" />
                </div>
                <h3 className="text-lg font-extrabold text-[#1C2922]">No trackers yet</h3>
                <p className="text-xs text-[#3D4A3B] font-medium max-w-sm mx-auto">
                  Pick a crop, set up your field, and get a week-by-week roadmap that adapts to your weekly reports.
                </p>
                <button
                  onClick={() => { resetFlow(); setView('recommend'); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1BC447] text-[#153D2B] text-sm font-extrabold"
                >
                  <Plus className="w-4 h-4" /> Start a new tracker
                </button>
              </div>
            )}

            <div className="space-y-4">
              {trackers.map((t) => {
                const now = new Date();
                const { week, status } = trackerProgress(t, now);
                const currentWeekCard = t.roadmap.find((w) => w.weekNumber === week);
                const pct = Math.min(100, Math.round((week / t.totalWeeks) * 100));
                return (
                  <div key={t.id} className="bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-extrabold text-[#1C2922]">{t.cropName}</h3>
                          {t.variety && <span className="text-[11px] text-[#3D4A3B] font-semibold">{t.variety}</span>}
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold ${
                            status === 'completed' ? 'bg-slate-100 text-slate-700 border border-slate-300'
                            : status === 'harvest_ready' ? 'bg-[#FFF6EB] text-[#895100] border border-[#FFE0B2]'
                            : 'bg-[#EDF6ED] text-[#153D2B] border border-[#DCE5DC]'
                          }`}>
                            {status === 'completed' ? 'Completed' : status === 'harvest_ready' ? 'Ready to harvest' : `Week ${week} of ${t.totalWeeks}`}
                          </span>
                          {t.weekOffsetDays > 0 && (
                            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-[#FFF6EB] text-[#895100] border border-[#FFE0B2]">
                              Schedule +{t.weekOffsetDays}d
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#3D4A3B] font-medium mt-1">
                          {t.fieldName}{t.village ? ` • ${t.village}` : ''} • {t.areaValue} {t.areaUnit}{t.areaUnit === 'acre' ? 's' : 's'} • Sown {new Date(t.sowingDate).toLocaleDateString()}
                        </p>
                      </div>
                      <button onClick={() => deleteTracker(t.id)} className="p-2 rounded-xl text-[#3D4A3B] hover:text-red-600 hover:bg-red-50" aria-label="Delete tracker">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="h-1.5 rounded-full bg-[#F3FCF3] overflow-hidden">
                      <div className="h-full rounded-full bg-[#1BC447] transition-all" style={{ width: `${pct}%` }} />
                    </div>

                    {status === 'completed' && t.receipt ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F3FCF3] rounded-2xl p-4 border border-[#DCE5DC]">
                        <div className="text-xs text-[#3D4A3B] font-medium space-y-0.5">
                          <p className="font-extrabold text-[#153D2B]">Net {money(t.receipt.profit.netProfit, t.receipt.profit.currency)} • ROI {t.receipt.profit.roiPercentage}%</p>
                          <p>{t.receipt.profit.totalProduction} {t.receipt.profit.yieldUnit} sold at {money(t.receipt.profit.pricePerUnit, t.receipt.profit.currency)} • {t.receipt.durationDays} days</p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          {t.receipt.badges.map((b) => (
                            <span key={b.id} className="px-2.5 py-1 rounded-full bg-white border border-[#DCE5DC] font-bold text-[#153D2B]">{b.emoji} {b.label}</span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-[#3D4A3B] font-medium">
                          <span className="font-extrabold text-[#153D2B]">Week {week} — {currentWeekCard?.stageLabel}</span>
                          <p className="mt-0.5 line-clamp-2">{currentWeekCard?.actions[0]}</p>
                        </div>
                        <button
                          onClick={() => { setActiveTrackerId(t.id); setShowReportForm(false); setShowHarvestForm(false); setShowAllWeeks(false); setView('tracker'); }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#153D2B] text-white text-xs font-extrabold hover:brightness-110 shrink-0"
                        >
                          Open tracker <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------------------- RECOMMEND ---------------------------- */}
        {view === 'recommend' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento space-y-5">
              <h3 className="text-sm font-extrabold text-[#1C2922]">What are you farming for?</h3>
              <Segmented options={GOALS} value={goal} onChange={setGoal} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3D4A3B] mb-1.5">Your region / village (optional)</label>
                  <PlaceSearchInput
                    value={region}
                    onChange={(v) => { setRegion(v); setRegionPlace(null); }}
                    onSelect={setRegionPlace}
                    placeholder="Start typing — pick your place from the list"
                  />
                  {regionPlace && (
                    <p className="text-[10px] text-[#153D2B] font-bold mt-1 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#1BC447]" /> Exact place selected: {placeLabel(regionPlace)}{regionPlace.country ? `, ${regionPlace.country}` : ''}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3D4A3B] mb-1.5">Soil type (optional)</label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-sm text-[#1C2922] bg-[#F3FCF3]/60 focus:ring-2 focus:ring-[#1BC447] outline-none"
                  >
                    <option value="">Not sure</option>
                    {SOIL_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={runRecommendation}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1BC447] text-[#153D2B] text-sm font-extrabold hover:brightness-105"
                >
                  Find my crops <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={useMyLocation}
                  disabled={geoBusy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-sm font-bold text-[#3D4A3B] hover:text-[#153D2B] disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${geoBusy ? 'animate-spin' : ''}`} /> Use my location
                </button>
                <span className="text-[11px] text-[#3D4A3B] font-medium">
                  Season auto-detected: {recs[0] ? recs[0].season : detectSeason(new Date().getMonth() + 1, isMonsoonRegion(region))}
                </span>
              </div>

              {contextState === 'loading' && (
                <p className="text-[11px] text-[#3D4A3B] font-medium inline-flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading live context (weather, soil, season)…</p>
              )}
              {contextState === 'ready' && cropContext && (
                <div className="text-[11px] bg-[#EDF6ED] border border-[#DCE5DC] rounded-2xl px-4 py-3 text-[#153D2B] font-medium space-y-1">
                  <p className="font-extrabold">Live context loaded — {cropContext.location?.label}</p>
                  <p>
                    Season: <strong>{cropContext.season}</strong> ({cropContext.hemisphere} hemisphere{cropContext.tropical ? ', tropical' : ''}) •
                    {cropContext.currentTempC != null ? ` Now ${cropContext.currentTempC.toFixed(0)}°C •` : ''}
                    {cropContext.days?.length ? ` 14-day rain total ${cropContext.days.reduce((s, d) => s + (Number.isFinite(d.precipitationMm) ? d.precipitationMm : 0), 0).toFixed(0)} mm •` : ''}
                    Soil: {cropContext.soil ? <strong>{cropContext.soil.textureClass}</strong> : 'unavailable — select manually'}
                  </p>
                  <p className="text-[10px] opacity-80">Sources: Open-Meteo forecast{cropContext.soil ? ` + ${cropContext.soil.sourceName}` : ''} • retrieved {cropContext.retrievedAt?.slice(0, 16).replace('T', ' ')} UTC</p>
                </div>
              )}
              {contextState === 'unavailable' && (
                <p className="text-[11px] text-[#895100] bg-[#FFF6EB] border border-[#FFE0B2] rounded-2xl px-4 py-3 font-medium">Live context unavailable right now — scoring continues with season and your manual inputs.</p>
              )}
              {priceStatus && (
                <p className={`text-[11px] rounded-2xl px-4 py-3 font-medium border ${priceStatus.status === 'live' ? 'bg-[#EDF7FF] border-[#BEE3F8] text-[#004263]' : 'bg-[#FFF6EB] border-[#FFE0B2] text-[#895100]'}`}>
                  {priceStatus.note}
                </p>
              )}

              {recWeather.state === 'loading' && (
                <p className="text-[11px] text-[#3D4A3B] font-medium inline-flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking live weather…</p>
              )}
              {recWeather.state === 'ready' && recWeather.summary && (
                <div className="flex flex-wrap items-center gap-2 text-[11px] bg-[#EDF7FF] border border-[#BEE3F8] rounded-2xl px-4 py-3 text-[#004263] font-medium">
                  <CloudSun className="w-4 h-4 shrink-0" />
                  <span className="font-extrabold">Weather-informed (live, Open-Meteo):</span>
                  <span>
                    {recWeather.summary.currentTempC !== null ? `${recWeather.summary.currentTempC.toFixed(0)}°C now` : 'live forecast'} in {recWeather.summary.locationName}
                    {recWeather.summary.precipNext3DaysMm > 0 ? ` • ${recWeather.summary.precipNext3DaysMm} mm rain next 3 days` : ' • dry next 3 days'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#BEE3F8] font-bold">live</span>
                </div>
              )}
              {recWeather.state === 'unavailable' && (
                <p className="text-[11px] text-[#895100] bg-[#FFF6EB] border border-[#FFE0B2] rounded-2xl px-4 py-3 font-medium">{recWeather.reason} Scoring continues on your manual inputs.</p>
              )}
            </div>

            {recs.map((rec) => (
              <div key={rec.cropName} className="bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-extrabold text-[#1C2922]">{rec.cropName}</h3>
                      <span className="text-[11px] text-[#3D4A3B] font-semibold">{rec.category}</span>
                      {!rec.seasonSuitable && (
                        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-[#FFF6EB] text-[#895100] border border-[#FFE0B2]">
                          Long for {rec.season} season
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#3D4A3B] font-medium mt-1">
                      {rec.growthPeriodLabel} • Current season: {rec.season}
                    </p>
                    <p className="text-[11px] text-[#004263] font-medium mt-1 bg-[#EDF7FF] border border-[#BEE3F8] rounded-xl px-3 py-1.5 inline-block">
                      Weather alignment: {rec.weatherAlignment}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {aiRanked && (
                      <span className="text-[10px] font-extrabold text-[#153D2B] bg-white px-2.5 py-1 rounded-full border border-[#DCE5DC] inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#1BC447]" /> AI-ranked live
                      </span>
                    )}
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold font-mono tabular-nums bg-[#EDF6ED] text-[#153D2B] border border-[#DCE5DC]">
                      {rec.matchScore}% match
                    </span>
                  </div>
                </div>

                <div className="bg-[#F3FCF3] rounded-2xl p-4 border border-[#DCE5DC] space-y-2">
                  <p className="text-xs text-[#1C2922] font-semibold leading-relaxed">
                    {aiReasons[rec.cropName] || rec.whyThisCrop}
                  </p>
                  <div className="flex items-center gap-2">
                    {aiReasons[rec.cropName] ? (
                      <span className="text-[10px] font-bold text-[#153D2B] bg-white px-2.5 py-1 rounded-full border border-[#DCE5DC] inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#1BC447]" /> AI-enhanced reason
                      </span>
                    ) : aiEnhanceState === 'loading' ? (
                      <span className="text-[10px] font-bold text-[#3D4A3B] px-2.5 py-1 rounded-full border border-[#DCE5DC] bg-white">Enhancing…</span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#3D4A3B] px-2.5 py-1 rounded-full border border-[#DCE5DC] bg-white">Rule-based reason</span>
                    )}
                  </div>
                </div>

                {rec.financial.unavailable ? (
                  <div className="text-[11px] text-[#895100] bg-[#FFF6EB] border border-[#FFE0B2] rounded-2xl px-4 py-3 font-medium">
                    Financial overview unavailable — {rec.financial.reason}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] bg-white border border-[#DCE5DC] rounded-2xl p-4">
                      <div><p className="text-[#3D4A3B] font-medium">Yield est.</p><p className="font-extrabold text-[#1C2922] tabular-nums">{rec.financial.yieldAmount} {rec.financial.yieldUnit}</p></div>
                      <div>
                        <p className="text-[#3D4A3B] font-medium">Price (official)</p>
                        <p className="font-extrabold text-[#1C2922] tabular-nums">{money(rec.financial.pricePerUnit, rec.financial.currency)}/{rec.financial.yieldUnit.split('/')[0]}</p>
                      </div>
                      <div><p className="text-[#3D4A3B] font-medium">Est. revenue</p><p className="font-extrabold text-[#1C2922] tabular-nums">{money(rec.financial.expectedRevenue, rec.financial.currency)}</p></div>
                      <div><p className="text-[#3D4A3B] font-medium">Est. expense</p><p className="font-extrabold text-[#1C2922] tabular-nums">{money(rec.financial.totalExpense, rec.financial.currency)}</p></div>
                      <div><p className="text-[#3D4A3B] font-medium">Est. profit</p><p className="font-extrabold text-[#153D2B] tabular-nums">{money(rec.financial.estProfit, rec.financial.currency)} ({rec.financial.estProfitMarginPct}%)</p></div>
                    </div>
                    <p className="text-[10px] text-[#3D4A3B] font-medium">
                      {rec.financial.sourceLabel}
                      {rec.livePrice && (
                        <> • <a href={rec.livePrice.datasetUrl} target="_blank" rel="noopener noreferrer" className="text-[#153D2B] font-bold underline">Eurostat source</a></>
                      )}
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  {rec.keyBenefits.map((b, i) => (
                    <p key={i} className="text-[11px] text-[#3D4A3B] font-medium flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#1BC447] shrink-0 mt-0.5" />{b}</p>
                  ))}
                </div>

                {rec.govtSupportNote && (
                  <div className="text-[11px] text-[#004263] bg-[#EDF7FF] border border-[#BEE3F8] rounded-2xl px-4 py-3 font-medium">
                    {rec.govtSupportNote}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-[#DCE5DC]">
                  <span className="text-[10px] text-[#3D4A3B] truncate max-w-[60%] font-medium">Ref: {rec.citation?.sourceName}</span>
                  <button
                    onClick={() => { setSelectedRec(rec); setView('setup'); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#153D2B] text-white text-sm font-extrabold hover:brightness-110 shrink-0"
                  >
                    Grow this crop <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ------------------------------- SETUP ------------------------------ */}
        {view === 'setup' && selectedRec && (
          <div className="bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento space-y-5 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('recommend')} className="p-2 rounded-xl border border-[#DCE5DC] text-[#3D4A3B] hover:text-[#153D2B]">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-base font-extrabold text-[#1C2922]">Field setup — {selectedRec.cropName}</h3>
                <p className="text-[11px] text-[#3D4A3B] font-medium">Only field name, area, and sowing date are required.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#3D4A3B] mb-1.5">Field name *</label>
                <input value={fieldName} onChange={(e) => setFieldName(e.target.value)} placeholder="e.g. North Field" className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-sm bg-[#F3FCF3]/60 focus:ring-2 focus:ring-[#1BC447] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3D4A3B] mb-1.5">Area *</label>
                <div className="flex gap-2">
                  <input type="number" min="0.01" step="0.1" value={areaValue} onChange={(e) => setAreaValue(e.target.value)} className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-sm bg-[#F3FCF3]/60 focus:ring-2 focus:ring-[#1BC447] outline-none" />
                  <Segmented options={[{ value: 'acre', label: 'Acres' }, { value: 'hectare', label: 'Hectares' }, { value: 'bigha', label: 'Bigha' }]} value={areaUnit} onChange={setAreaUnit} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3D4A3B] mb-1.5">Sowing date *</label>
                <input type="date" value={sowingDate} onChange={(e) => setSowingDate(e.target.value)} className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-sm bg-[#F3FCF3]/60 focus:ring-2 focus:ring-[#1BC447] outline-none" />
              </div>
              {sowingDate && selectedRec && (() => {
                const plannedSeason = detectSeason(new Date(`${sowingDate}T00:00:00`).getMonth() + 1, isMonsoonRegion(region));
                const mismatch = plannedSeason !== selectedRec.season;
                return mismatch || !selectedRec.seasonSuitable ? (
                  <p className="sm:col-span-2 text-[11px] text-[#895100] bg-[#FFF6EB] border border-[#FFE0B2] rounded-2xl px-4 py-3 font-medium">
                    Heads-up: sowing on this date lands in the <strong>{plannedSeason}</strong> season, but {selectedRec.cropName} is recommended for <strong>{selectedRec.season}</strong>
                    {!selectedRec.seasonSuitable ? ` and its ${selectedRec.growthPeriodDays}-day cycle is long for that season` : ''}.
                    Consider adjusting the date, or continue if your local conditions differ.
                  </p>
                ) : null;
              })()}
              <div>
                <label className="block text-xs font-bold text-[#3D4A3B] mb-1.5">Variety / seed code</label>
                <input value={variety} onChange={(e) => setVariety(e.target.value)} placeholder="e.g. HD-2967" className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-sm bg-[#F3FCF3]/60 focus:ring-2 focus:ring-[#1BC447] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3D4A3B] mb-1.5">Irrigation type</label>
                <select value={irrigationType} onChange={(e) => setIrrigationType(e.target.value as IrrigationType)} className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-sm bg-[#F3FCF3]/60 focus:ring-2 focus:ring-[#1BC447] outline-none">
                  {IRRIGATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#3D4A3B] mb-1.5">Sector / village</label>
                <PlaceSearchInput
                  value={village}
                  onChange={(v) => { setVillage(v); setVillagePlace(null); }}
                  onSelect={setVillagePlace}
                  placeholder="Start typing — pick your place from the list"
                />
                {villagePlace && (
                  <p className="text-[10px] text-[#153D2B] font-bold mt-1 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#1BC447]" /> Weather will use: {placeLabel(villagePlace)}{villagePlace.country ? `, ${villagePlace.country}` : ''}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={createTracker}
              disabled={!fieldName.trim() || !areaValue || !sowingDate}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#1BC447] text-[#153D2B] text-sm font-extrabold disabled:opacity-40"
            >
              <Sprout className="w-4 h-4" /> Generate my growth roadmap
            </button>
          </div>
        )}

        {/* ------------------------------ TRACKER ----------------------------- */}
        {view === 'tracker' && activeTracker && (() => {
          const t = activeTracker;
          const now = new Date();
          const { week, status } = trackerProgress(t, now);
          const weekCard = t.roadmap.find((w) => w.weekNumber === week) || t.roadmap[t.roadmap.length - 1];
          const pct = Math.min(100, Math.round((week / t.totalWeeks) * 100));
          return (
            <div className="space-y-6">
              {/* Tracker header */}
              <div className="bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-extrabold text-[#1C2922]">{t.cropName}{t.variety ? ` — ${t.variety}` : ''}</h3>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold ${
                        status === 'harvest_ready' ? 'bg-[#FFF6EB] text-[#895100] border border-[#FFE0B2]' : 'bg-[#EDF6ED] text-[#153D2B] border border-[#DCE5DC]'
                      }`}>
                        {status === 'harvest_ready' ? 'Ready to harvest' : `Week ${week} of ${t.totalWeeks}`}
                      </span>
                      {t.weekOffsetDays > 0 && (
                        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-[#FFF6EB] text-[#895100] border border-[#FFE0B2]">Schedule +{t.weekOffsetDays}d</span>
                      )}
                    </div>
                    <p className="text-xs text-[#3D4A3B] font-medium mt-1">
                      {t.fieldName}{t.village ? ` • ${t.village}` : ''} • {t.areaValue} {t.areaUnit}{t.areaUnit === 'acre' ? 's' : 's'} • {t.irrigationType} • Sown {new Date(t.sowingDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => setView('home')} className="text-xs font-bold text-[#3D4A3B] hover:text-[#153D2B] shrink-0">All trackers</button>
                </div>
                <div className="h-1.5 rounded-full bg-[#F3FCF3] overflow-hidden">
                  <div className="h-full rounded-full bg-[#1BC447] transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-[#3D4A3B] font-medium">Stage: {weekCard.stageLabel}</p>
              </div>

              {/* Live weather card */}
              <div className="bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CloudSun className="w-4 h-4 text-[#1BC447]" />
                    <h3 className="text-sm font-extrabold text-[#1C2922]">Live weather — {t.locationLabel || t.village || t.region || 'field location'}</h3>
                    {trackerWeather.state === 'ready' && (
                      <FreshnessBadge status="live" label="Open-Meteo live" />
                    )}
                  </div>
                  <button
                    onClick={() => loadTrackerWeather(t)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#3D4A3B] hover:text-[#153D2B] px-3 py-1.5 rounded-full border border-[#DCE5DC]"
                  >
                    <RefreshCw className={`w-3 h-3 ${trackerWeather.state === 'loading' ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>

                {trackerWeather.state === 'loading' && (
                  <p className="text-[11px] text-[#3D4A3B] font-medium">Checking live forecast…</p>
                )}
                {trackerWeather.state === 'unavailable' && (
                  <p className="text-[11px] text-[#895100] bg-[#FFF6EB] border border-[#FFE0B2] rounded-2xl px-4 py-3 font-medium">{trackerWeather.reason}</p>
                )}
                {trackerWeather.state === 'ready' && trackerWeather.summary && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3 text-[11px]">
                      <div className="bg-[#F3FCF3] border border-[#DCE5DC] rounded-2xl p-3">
                        <p className="text-[#3D4A3B] font-medium">Now</p>
                        <p className="font-extrabold text-[#1C2922] tabular-nums">{trackerWeather.summary.currentTempC !== null ? `${trackerWeather.summary.currentTempC.toFixed(0)}°C` : '—'}</p>
                      </div>
                      <div className="bg-[#F3FCF3] border border-[#DCE5DC] rounded-2xl p-3">
                        <p className="text-[#3D4A3B] font-medium">Rain next 3d</p>
                        <p className="font-extrabold text-[#1C2922] tabular-nums">{trackerWeather.summary.precipNext3DaysMm} mm</p>
                      </div>
                      <div className="bg-[#F3FCF3] border border-[#DCE5DC] rounded-2xl p-3">
                        <p className="text-[#3D4A3B] font-medium">Temp range</p>
                        <p className="font-extrabold text-[#1C2922] tabular-nums">
                          {trackerWeather.summary.minTempNext3DaysC !== null && trackerWeather.summary.maxTempNext3DaysC !== null
                            ? `${trackerWeather.summary.minTempNext3DaysC.toFixed(0)}–${trackerWeather.summary.maxTempNext3DaysC.toFixed(0)}°C`
                            : '—'}
                        </p>
                      </div>
                    </div>
                    {trackerWeather.summary.notes.length > 0 && (
                      <div className="space-y-1.5">
                        {trackerWeather.summary.notes.map((n, i) => (
                          <div key={i} className={`flex items-start gap-2 rounded-2xl px-4 py-2.5 text-[11px] font-medium border ${
                            n.severity === 'high' ? 'bg-red-50 border-red-200 text-red-800'
                            : n.severity === 'warning' ? 'bg-[#FFF6EB] border-[#FFE0B2] text-[#895100]'
                            : 'bg-[#EDF6ED] border-[#DCE5DC] text-[#153D2B]'
                          }`}>
                            <span className="shrink-0 mt-0.5">{WEATHER_NOTE_ICONS[n.type]}</span>
                            <span>{n.note}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Harvest flow */}
              {status === 'harvest_ready' && !t.receipt && (
                <div className="bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#1C2922]">🎉 Your crop is ready to harvest</h3>
                  </div>

                  {/* Phase 9: maturity confirmation photo */}
                  <div className="border border-[#DCE5DC] rounded-2xl p-4 space-y-2 bg-[#F3FCF3]/60">
                    <p className="text-xs font-extrabold text-[#1C2922]">Confirm maturity with a photo</p>
                    <p className="text-[11px] text-[#3D4A3B] font-medium">
                      The roadmap has reached harvest week. A photo check can confirm maturity cues (filled grain/fruit color, dry foliage) before you record the harvest — if it says not mature yet, extend one week and re-check.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const compressed = await compressImage(file);
                          setMaturityPhoto(compressed);
                          setMaturityCheck({ state: 'idle', confirmed: null });
                        }}
                        className="text-[11px] text-[#3D4A3B] font-medium"
                      />
                      {maturityPhoto && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={maturityPhoto} alt="Maturity check" className="w-14 h-14 rounded-xl object-cover border border-[#DCE5DC]" />
                      )}
                      {maturityPhoto && (
                        <button
                          type="button"
                          onClick={checkMaturity}
                          disabled={maturityCheck.state === 'checking'}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#153D2B] text-white text-xs font-extrabold disabled:opacity-50"
                        >
                          <Sparkles className={`w-3.5 h-3.5 text-[#1BC447] ${maturityCheck.state === 'checking' ? 'animate-pulse' : ''}`} />
                          {maturityCheck.state === 'checking' ? 'Checking…' : 'Check maturity'}
                        </button>
                      )}
                      {maturityCheck.confirmed === true && (
                        <span className="text-[11px] font-extrabold text-[#153D2B] bg-[#EDF6ED] border border-[#DCE5DC] px-3 py-1.5 rounded-full">✓ Maturity cues visible — go ahead</span>
                      )}
                      {maturityCheck.confirmed === false && (
                        <button type="button" onClick={extendOneWeek} className="text-[11px] font-extrabold text-[#895100] bg-[#FFF6EB] border border-[#FFE0B2] px-3 py-1.5 rounded-full">
                          Not mature yet — extend 1 week and re-check
                        </button>
                      )}
                      {maturityCheck.state === 'idle' && maturityCheck.confirmed === null && maturityPhoto && (
                        <span className="text-[10px] text-[#3D4A3B] font-medium">Could not confirm from the photo — proceed with your own judgment.</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-[#153D2B]">Official price reference (live)</h4>
                    {harvestPrice.loading && (
                      <p className="text-[11px] text-[#3D4A3B] font-medium inline-flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Fetching official price…</p>
                    )}
                    {!harvestPrice.loading && harvestPrice.info && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] bg-[#EDF6ED] border border-[#DCE5DC] rounded-2xl px-4 py-3">
                        <div>
                          <p className="font-extrabold text-[#153D2B]">{t.cropName} — {harvestPrice.info.price} {harvestPrice.info.currency}/{harvestPrice.info.unit}</p>
                          <p className="text-[#3D4A3B] font-medium">
                            {harvestPrice.info.sourceName} official annual price ({harvestPrice.info.period}) — not a live market quote •{' '}
                            <a href={harvestPrice.info.datasetUrl} target="_blank" rel="noopener noreferrer" className="text-[#153D2B] font-bold underline">source</a>
                          </p>
                        </div>
                        <FreshnessBadge status="live" label="Official" />
                      </div>
                    )}
                    {!harvestPrice.loading && !harvestPrice.info && (
                      <p className="text-[11px] text-[#895100] bg-[#FFF6EB] border border-[#FFE0B2] rounded-2xl px-4 py-3 font-medium">
                        {harvestPrice.note || 'No official live price feed connected for this crop and country. Check current local market rates before selling — FarmIQ will not guess a price.'}
                      </p>
                    )}
                    <p className="text-[10px] text-[#3D4A3B] font-medium">
                      Nearest physical markets and online platforms are not connected yet (FIQ-093) — always compare your local mandi/agent rates before selling.
                    </p>
                  </div>

                  {!showHarvestForm ? (
                    <button onClick={() => setShowHarvestForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1BC447] text-[#153D2B] text-sm font-extrabold">
                      <Receipt className="w-4 h-4" /> Record harvest & generate receipt
                    </button>
                  ) : (
                    <div className="space-y-4 border border-[#DCE5DC] rounded-2xl p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#3D4A3B] mb-1.5">Harvest date</label>
                          <input type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-sm bg-[#F3FCF3]/60 outline-none focus:ring-2 focus:ring-[#1BC447]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#3D4A3B] mb-1.5">Total yield</label>
                          <div className="flex gap-2">
                            <input type="number" min="0" step="0.1" value={yieldAmount} onChange={(e) => setYieldAmount(e.target.value)} placeholder="e.g. 24" className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-sm bg-[#F3FCF3]/60 outline-none focus:ring-2 focus:ring-[#1BC447]" />
                            <input value={yieldUnit} onChange={(e) => setYieldUnit(e.target.value)} placeholder="quintals" className="w-28 px-3 py-2.5 rounded-2xl border border-[#DCE5DC] text-xs bg-[#F3FCF3]/60 outline-none focus:ring-2 focus:ring-[#1BC447]" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#3D4A3B] mb-1.5">Sold price per {yieldUnit || 'unit'}</label>
                          <div className="flex gap-2">
                            <input type="number" min="0" step="0.5" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-sm bg-[#F3FCF3]/60 outline-none focus:ring-2 focus:ring-[#1BC447]" />
                            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-28 px-3 py-2.5 rounded-2xl border border-[#DCE5DC] text-xs bg-[#F3FCF3]/60 outline-none">
                              {['USD', 'EUR', 'INR', 'KES', 'BRL'].map((c) => <option key={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#3D4A3B] mb-2">Actual expenses ({currency})</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {([['seeds', 'Seed'], ['fertilizers', 'Fertilizer'], ['cropProtection', 'Crop protection'], ['labor', 'Labor'], ['irrigation', 'Irrigation'], ['machineryFuel', 'Machinery/fuel'], ['landRent', 'Land rent'], ['miscellaneous', 'Other']] as Array<[keyof typeof costs, string]>).map(([key, label]) => (
                            <div key={key}>
                              <label className="block text-[10px] font-bold text-[#3D4A3B] mb-1">{label}</label>
                              <input type="number" min="0" value={costs[key]} onChange={(e) => setCosts({ ...costs, [key]: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-[#DCE5DC] text-xs tabular-nums bg-[#F3FCF3]/60 outline-none focus:ring-2 focus:ring-[#1BC447]" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={confirmHarvest} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#153D2B] text-white text-sm font-extrabold">
                          <Receipt className="w-4 h-4" /> Complete tracker & save receipt
                        </button>
                        <button onClick={() => setShowHarvestForm(false)} className="px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-xs font-bold text-[#3D4A3B]">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Receipt */}
              {t.receipt && (
                <div className="bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento space-y-4">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-[#1BC447]" />
                    <h3 className="text-base font-extrabold text-[#1C2922]">CropPath receipt — completed</h3>
                    <FreshnessBadge status="supported" label="Your records" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                    <div><p className="text-[#3D4A3B] font-medium">Total revenue</p><p className="font-extrabold text-[#1C2922] tabular-nums">{money(t.receipt.profit.grossRevenue, t.receipt.profit.currency)}</p></div>
                    <div><p className="text-[#3D4A3B] font-medium">Total cost</p><p className="font-extrabold text-[#1C2922] tabular-nums">{money(t.receipt.profit.totalCost, t.receipt.profit.currency)}</p></div>
                    <div><p className="text-[#3D4A3B] font-medium">Net {t.receipt.profit.isProfitable ? 'profit' : 'loss'}</p><p className={`font-extrabold tabular-nums ${t.receipt.profit.isProfitable ? 'text-[#153D2B]' : 'text-red-700'}`}>{money(t.receipt.profit.netProfit, t.receipt.profit.currency)}</p></div>
                    <div><p className="text-[#3D4A3B] font-medium">ROI</p><p className="font-extrabold text-[#1C2922] tabular-nums">{t.receipt.profit.roiPercentage}%</p></div>
                  </div>
                  <p className="text-[11px] text-[#3D4A3B] font-medium">
                    {t.receipt.profit.totalProduction} {t.receipt.profit.yieldUnit} sold at {money(t.receipt.profit.pricePerUnit, t.receipt.profit.currency)} • {t.receipt.durationDays} days from sowing to harvest • {t.areaValue} {t.receipt.profit.areaUnit}{t.receipt.profit.areaUnit === 'acre' ? 's' : 's'}
                  </p>
                  {t.receipt.stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-[11px] bg-[#F3FCF3] border border-[#DCE5DC] rounded-2xl p-4">
                      <div><p className="text-[#3D4A3B] font-medium">Weeks run</p><p className="font-extrabold text-[#1C2922] tabular-nums">{t.receipt.stats.weeksRun}</p></div>
                      <div><p className="text-[#3D4A3B] font-medium">Reports</p><p className="font-extrabold text-[#1C2922] tabular-nums">{t.receipt.stats.reportsSubmitted}/{t.receipt.stats.weeksRun}</p></div>
                      <div><p className="text-[#3D4A3B] font-medium">Missed weeks</p><p className="font-extrabold text-[#1C2922] tabular-nums">{t.receipt.stats.reportsMissed}</p></div>
                      <div><p className="text-[#3D4A3B] font-medium">Avg health</p><p className="font-extrabold text-[#1C2922] tabular-nums">{t.receipt.stats.avgHealthScore !== null ? `${t.receipt.stats.avgHealthScore}/100` : '—'}</p></div>
                      <div><p className="text-[#3D4A3B] font-medium">Issues logged</p><p className="font-extrabold text-[#1C2922] tabular-nums">{t.receipt.stats.issuesDetected}</p></div>
                    </div>
                  )}
                  {t.receipt.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {t.receipt.badges.map((b) => (
                        <span key={b.id} className="px-3 py-1.5 rounded-full bg-[#EDF6ED] border border-[#DCE5DC] text-[11px] font-extrabold text-[#153D2B]">{b.emoji} {b.label}</span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#DCE5DC] text-xs font-extrabold text-[#3D4A3B] hover:text-[#153D2B]"
                  >
                    <Receipt className="w-3.5 h-3.5" /> Print / Save as PDF
                  </button>
                </div>
              )}

              {/* Current week card */}
              {status !== 'completed' && (
                <div className="bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-[#1BC447]" />
                      <h3 className="text-sm font-extrabold text-[#1C2922]">Week {week} — {weekCard.stageLabel}</h3>
                    </div>
                    <button onClick={() => setShowReportForm(!showReportForm)} className="text-xs font-extrabold text-[#153D2B] bg-[#EDF6ED] px-3.5 py-1.5 rounded-full border border-[#DCE5DC]">
                      {showReportForm ? 'Close report' : 'Submit weekly report'}
                    </button>
                  </div>
                  <div className="bg-[#F3FCF3] rounded-2xl p-4 border border-[#DCE5DC] space-y-3 text-xs">
                    <p className="text-[#1C2922] font-semibold"><span className="font-extrabold">Expect:</span> {weekCard.expected}</p>
                    <div>
                      <p className="font-extrabold text-[#153D2B] mb-1">Action items</p>
                      {weekCard.actions.map((a, i) => <p key={i} className="text-[#3D4A3B] font-medium">• {a}</p>)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="bg-white rounded-xl border border-[#DCE5DC] p-3">
                        <p className="font-extrabold text-[#153D2B] mb-1 text-[11px]">🧪 Fertilizer</p>
                        <p className="text-[#3D4A3B] font-medium">{weekCard.fertilizerTask}</p>
                      </div>
                      <div className="bg-white rounded-xl border border-[#DCE5DC] p-3">
                        <p className="font-extrabold text-[#153D2B] mb-1 text-[11px]">💧 Irrigation</p>
                        <p className="text-[#3D4A3B] font-medium">{weekCard.irrigationTask}</p>
                      </div>
                      <div className="bg-white rounded-xl border border-[#DCE5DC] p-3">
                        <p className="font-extrabold text-[#153D2B] mb-1 text-[11px]">🔍 Scouting</p>
                        <p className="text-[#3D4A3B] font-medium">{weekCard.scoutingTask}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-extrabold text-[#153D2B] mb-1">Reminders</p>
                      {trackerWeather.state === 'ready' && trackerWeather.summary?.wateringSkipped && weekCard.reminders.some((r) => r.toLowerCase().includes('watering')) && (
                        <p className="text-[#895100] font-semibold flex items-center gap-1.5"><CloudRain className="w-3 h-3 shrink-0" /> Watering skipped: rain expected in the next 3 days (live weather)</p>
                      )}
                      {weekCard.reminders.map((r, i) => <p key={i} className="text-[#3D4A3B] font-medium flex items-center gap-1.5"><Droplets className="w-3 h-3 text-[#1BC447] shrink-0" />{r}</p>)}
                    </div>
                  </div>

                  {showReportForm && (
                    <div className="border border-[#DCE5DC] rounded-2xl p-4 space-y-4">
                      <div>
                        <p className="text-xs font-bold text-[#3D4A3B] mb-1.5">How does the crop look overall?</p>
                        <Segmented options={RATINGS} value={rating} onChange={setRating} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#3D4A3B] mb-1.5">Did you complete this week&apos;s actions?</p>
                        <div className="space-y-2">
                          {weekCard.actions.map((a) => (
                            <div key={a} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F3FCF3] rounded-xl px-3 py-2">
                              <span className="text-[11px] text-[#1C2922] font-semibold">{a}</span>
                              <Segmented
                                options={[{ value: 'yes', label: 'Yes' }, { value: 'partial', label: 'Partial' }, { value: 'no', label: 'No' }]}
                                value={actionValues[a] || 'yes'}
                                onChange={(v) => setActionValues({ ...actionValues, [a]: v })}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#3D4A3B] mb-1.5">Any issues spotted?</p>
                        <Segmented options={ISSUES} value={issues} onChange={setIssues} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#3D4A3B] mb-1.5">Anything else?</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes…" className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-sm bg-[#F3FCF3]/60 outline-none focus:ring-2 focus:ring-[#1BC447]" />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-[#3D4A3B] mb-1.5">
                          <Camera className="w-3.5 h-3.5 text-[#1BC447]" /> Photos (optional, up to 3 — stored locally only)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []).slice(0, 3);
                            const compressed = await Promise.all(files.map(compressImage));
                            setPhotos(compressed.filter((p): p is string => p !== null));
                            setPhotoAnalysis(null);
                          }}
                          className="text-[11px] text-[#3D4A3B] font-medium"
                        />
                        {photos.length > 0 && <p className="text-[10px] text-[#3D4A3B] font-medium mt-1">{photos.length} photo(s) attached. Photos are stored on this device only.</p>}

                        {photos.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {!photoAnalysis && (
                              <button
                                type="button"
                                onClick={analyzePhotos}
                                disabled={photoBusy}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#153D2B] text-white text-xs font-extrabold disabled:opacity-50"
                              >
                                <Sparkles className={`w-3.5 h-3.5 text-[#1BC447] ${photoBusy ? 'animate-pulse' : ''}`} />
                                {photoBusy ? 'Analyzing photos…' : 'Analyze photos with AI'}
                              </button>
                            )}
                            {photoAnalysis && (
                              <div className="bg-[#F3FCF3] border border-[#DCE5DC] rounded-xl p-3 space-y-2">
                                <p className="text-[11px] text-[#1C2922] font-semibold leading-relaxed">{photoAnalysis.text}</p>
                                {visionReport && (
                                  <div className="flex flex-wrap gap-1.5">
                                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                                      visionReport.stageMatch === 'behind_1_week' || visionReport.stageMatch === 'behind_2_plus'
                                        ? 'bg-[#FFF6EB] text-[#895100] border-[#FFE0B2]'
                                        : visionReport.stageMatch === 'on_schedule' || visionReport.stageMatch === 'ahead'
                                          ? 'bg-[#EDF6ED] text-[#153D2B] border-[#DCE5DC]'
                                          : 'bg-slate-100 text-slate-700 border-slate-300'
                                    }`}>
                                      Stage: {visionReport.stageMatch.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-white border border-[#DCE5DC] text-[#3D4A3B]">
                                      Severity: {visionReport.severity}
                                    </span>
                                    {visionReport.diseaseSigns.map((s, i) => (
                                      <span key={i} className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-[#FFF6EB] text-[#895100] border border-[#FFE0B2]">⚠ {s}</span>
                                    ))}
                                    {visionReport.nutrientFlags.map((s, i) => (
                                      <span key={i} className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-[#EDF7FF] text-[#004263] border border-[#BEE3F8]">🍃 {s}</span>
                                    ))}
                                  </div>
                                )}
                                {photoAnalysis.provider && (
                                  <p className="text-[10px] text-[#3D4A3B] font-medium inline-flex items-center gap-1"><Sparkles className="w-3 h-3 text-[#1BC447]" /> AI photo analysis via {photoAnalysis.provider} — advisory only, verify with your own eyes</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <button onClick={submitReport} disabled={reportBusy || photos.length === 0} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1BC447] text-[#153D2B] text-sm font-extrabold disabled:opacity-40">
                        <Bug className="w-4 h-4" /> Submit report
                      </button>
                      {photos.length === 0 && (
                        <p className="text-[10px] text-[#895100] font-bold">Attach at least 1 photo — photos are required for the weekly report.</p>
                      )}
                      <p className="text-[10px] text-[#3D4A3B] font-medium">Submitting analyzes your report and may adjust the schedule. No pesticide dosages are ever provided (ADR-006).</p>
                    </div>
                  )}
                </div>
              )}

              {/* Reports history */}
              {t.reports.length > 0 && (
                <div className="bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento space-y-3">
                  <h3 className="text-sm font-extrabold text-[#1C2922]">Weekly reports</h3>
                  {[...t.reports].reverse().map((r) => (
                    <div key={r.id} className="border border-[#DCE5DC] rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-xs font-extrabold text-[#1C2922]">Week {r.weekNumber}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                            r.rating === 'worried' ? 'bg-[#FFF6EB] text-[#895100] border-[#FFE0B2]' : 'bg-[#EDF6ED] text-[#153D2B] border-[#DCE5DC]'
                          }`}>{r.rating.replace('_', ' ')}</span>
                          {typeof r.healthScore === 'number' && (
                            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-white border border-[#DCE5DC] text-[#3D4A3B] tabular-nums">
                              Health {r.healthScore}/100
                            </span>
                          )}
                          {r.stageMatch && (
                            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-white border border-[#DCE5DC] text-[#3D4A3B]">
                              {r.stageMatch.replace(/_/g, ' ')}
                            </span>
                          )}
                          {r.appliedAdjustmentDays !== 0 && (
                            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-white border border-[#DCE5DC] text-[#3D4A3B]">
                              schedule {r.appliedAdjustmentDays > 0 ? '+' : ''}{r.appliedAdjustmentDays}d
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#3D4A3B] font-medium">{r.analysisNote}</p>
                      {r.aiSummary && (
                        <div className="bg-[#F3FCF3] rounded-xl p-3">
                          <p className="text-[11px] text-[#1C2922] font-semibold leading-relaxed">{r.aiSummary}</p>
                          <p className="text-[10px] text-[#3D4A3B] font-medium mt-1 inline-flex items-center gap-1"><Sparkles className="w-3 h-3 text-[#1BC447]" /> AI assessment via {r.aiProvider || 'provider'}</p>
                        </div>
                      )}
                      {r.photoAnalysis && (
                        <div className="bg-[#EDF7FF] border border-[#BEE3F8] rounded-xl p-3">
                          <p className="text-[11px] text-[#004263] font-semibold leading-relaxed"><Camera className="w-3 h-3 inline mr-1" />Photo analysis: {r.photoAnalysis}</p>
                          {r.photoAnalysisProvider && (
                            <p className="text-[10px] text-[#3D4A3B] font-medium mt-1 inline-flex items-center gap-1"><Sparkles className="w-3 h-3 text-[#1BC447]" /> via {r.photoAnalysisProvider} — advisory only</p>
                          )}
                        </div>
                      )}
                      {r.guidance.length > 0 && (
                        <div className="bg-[#FFF6EB] border border-[#FFE0B2] rounded-xl p-3 space-y-1">
                          {r.guidance.map((g, i) => <p key={i} className="text-[11px] text-[#895100] font-medium leading-relaxed">{g}</p>)}
                        </div>
                      )}
                      {r.photos && r.photos.length > 0 && (
                        <div className="flex gap-2">
                          {r.photos.map((p, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={p} alt={`Week ${r.weekNumber} crop photo`} className="w-16 h-16 rounded-xl object-cover border border-[#DCE5DC]" />
                          ))}
                        </div>
                      )}
                      {r.notes && <p className="text-[11px] text-[#3D4A3B] font-medium italic">“{r.notes}”</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Full roadmap */}
              <div className="bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento space-y-3">
                <button
                  type="button"
                  aria-expanded={showAllWeeks}
                  onClick={() => setShowAllWeeks((open) => !open)}
                  className="w-full flex items-center justify-between gap-3 px-1 py-2 rounded-xl hover:bg-[#F3FCF3] transition-smooth"
                >
                  <h3 className="text-sm font-extrabold text-[#1C2922] text-left">
                    Full roadmap ({t.totalWeeks} weeks, {t.stages.length} stages)
                    <span className="block text-[10px] font-medium text-[#3D4A3B] mt-0.5">
                      {showAllWeeks ? 'Tap a week to collapse the list' : 'Open the complete sowing-to-harvest plan'}
                    </span>
                  </h3>
                  {showAllWeeks ? <ChevronUp className="w-4 h-4 text-[#3D4A3B] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#3D4A3B] shrink-0" />}
                </button>
                {showAllWeeks && (
                  <div className="space-y-2">
                    {t.roadmap.map((w) => {
                      const isCurrent = w.weekNumber === week;
                      const isPast = w.weekNumber < week;
                      return (
                        <div
                          key={w.weekNumber}
                          className={`px-4 py-3 rounded-2xl border transition-smooth ${
                            isCurrent
                              ? 'bg-[#EDF6ED] border-[#1BC447]/50'
                              : isPast
                                ? 'bg-white border-[#DCE5DC] opacity-70'
                                : 'bg-[#F3FCF3]/50 border-[#DCE5DC]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-extrabold text-[#1C2922]">
                              Week {w.weekNumber} — {w.stageLabel}
                              {isPast && <span className="ml-2 text-[10px] font-bold text-[#3D4A3B]">done</span>}
                            </p>
                            {isCurrent && <span className="text-[10px] font-extrabold text-[#153D2B]">current</span>}
                          </div>
                          <p className="text-[11px] text-[#3D4A3B] font-medium mt-1.5">
                            <span className="font-extrabold text-[#153D2B]">Expect:</span> {w.expected}
                          </p>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                            <div className="bg-white rounded-xl border border-[#DCE5DC] p-2.5">
                              <p className="font-extrabold text-[#153D2B] mb-0.5 text-[10px]">🧪 Fertilizer</p>
                              <p className="text-[#3D4A3B] font-medium">{w.fertilizerTask || 'Per soil test and local extension guidance.'}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-[#DCE5DC] p-2.5">
                              <p className="font-extrabold text-[#153D2B] mb-0.5 text-[10px]">💧 Irrigation</p>
                              <p className="text-[#3D4A3B] font-medium">{w.irrigationTask || 'Follow your irrigation schedule.'}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-[#DCE5DC] p-2.5">
                              <p className="font-extrabold text-[#153D2B] mb-0.5 text-[10px]">🔍 Scouting</p>
                              <p className="text-[#3D4A3B] font-medium">{w.scoutingTask || 'Scout the crop and note anything unusual.'}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {w.actions.map((a, i) => (
                              <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-[#DCE5DC] text-[#3D4A3B] font-medium">{a}</span>
                            ))}
                          </div>
                          <div className="mt-2 space-y-0.5">
                            {w.reminders.map((r, i) => (
                              <p key={i} className="text-[10px] text-[#3D4A3B] font-medium flex items-center gap-1.5"><Droplets className="w-3 h-3 text-[#1BC447] shrink-0" />{r}</p>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {view === 'tracker' && !activeTracker && (
          <div className="bg-white p-10 rounded-3xl border border-[#DCE5DC] text-center">
            <p className="text-sm font-bold text-[#3D4A3B]">Tracker not found.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
