'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FreshnessBadge } from '@/components/ui/Badge';
import { CROP_ADVISORY_CATALOG, CROP_ADVISORY_CATEGORIES, CropAdvisoryProfile } from '@/lib/data/cropCatalog';
import { scoreCrops, ScoredCrop } from '@/lib/services/cropAdvisor/scoring';
import {
  MapPin,
  Crosshair,
  Sliders,
  Search,
  AlertTriangle,
  ShieldCheck,
  Layers,
  Sparkles,
  ExternalLink,
  Thermometer,
  Droplets,
  FlaskConical
} from 'lucide-react';

interface GeoSuggestion {
  name: string;
  admin1?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
}

interface LiveClimate {
  avgTempC: number;
  totalPrecipMm: number;
  sourceName: string;
}
interface LiveSoil {
  textureClass: string;
  ph: number | null;
  sourceName: string;
}

const SOIL_OPTIONS = [
  'Loam', 'Sandy loam', 'Silt loam', 'Clay loam', 'Clay',
  'Sand', 'Silt', 'Sandy clay loam', 'Silty clay loam', 'Silty clay', 'Black Soil'
];

export default function CropAdvisorPage() {
  /* ---------------- Location / region ---------------- */
  const [placeQuery, setPlaceQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextNote, setContextNote] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------------- Plot inputs (auto-filled from live data when picked) ---------------- */
  const [soilType, setSoilType] = useState('Loam');
  const [soilPh, setSoilPh] = useState(6.5);
  const [rainfallMm, setRainfallMm] = useState(600);
  const [avgTempC, setAvgTempC] = useState(21);
  const [liveClimate, setLiveClimate] = useState<LiveClimate | null>(null);
  const [liveSoil, setLiveSoil] = useState<LiveSoil | null>(null);
  const [inputsLive, setInputsLive] = useState(false);

  /* ---------------- Result filters ---------------- */
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const onPlaceInput = (value: string) => {
    setPlaceQuery(value);
    setShowSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/crop-path/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: value })
        });
        const json = await res.json();
        setSuggestions((json?.data?.suggestions as GeoSuggestion[]) || []);
      } catch {
        setSuggestions([]);
      }
    }, 400);
  };

  const loadContext = async (lat: number, lon: number, label: string) => {
    setContextLoading(true);
    setContextNote(null);
    setShowSuggestions(false);
    setLocationLabel(label);
    try {
      const res = await fetch('/api/crop-advisor/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon, label })
      });
      const json = await res.json();
      const data = json?.data;
      if (!data?.available) {
        setContextNote(data?.reason || 'Live data unavailable — sliders remain manual.');
        setInputsLive(false);
        return;
      }
      const nextNotes: string[] = [];
      if (data.climate) {
        setAvgTempC(data.climate.avgTempC);
        setRainfallMm(data.climate.totalPrecipMm);
        setLiveClimate(data.climate as LiveClimate);
        nextNotes.push(`Temperature & rainfall auto-filled from ${data.climate.sourceName}.`);
      }
      if (data.soil) {
        if (data.soil.textureClass) setSoilType(data.soil.textureClass);
        if (typeof data.soil.ph === 'number') setSoilPh(data.soil.ph);
        setLiveSoil(data.soil as LiveSoil);
        nextNotes.push(`Soil auto-filled from ${data.soil.sourceName}.`);
      }
      if (Array.isArray(data.reasons)) nextNotes.push(...data.reasons);
      setInputsLive(Boolean(data.climate || data.soil));
      setContextNote(nextNotes.join(' ') || null);
    } catch {
      setContextNote('Live location data failed to load — sliders remain manual.');
      setInputsLive(false);
    } finally {
      setContextLoading(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) { setContextNote('GPS is not available in this browser.'); return; }
    setContextLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { void loadContext(pos.coords.latitude, pos.coords.longitude, 'My location'); },
      () => { setContextLoading(false); setContextNote('Location permission denied — search for your region instead.'); },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  /* ---------------- Scoring over the FULL catalog ---------------- */
  const scoredAll: ScoredCrop[] = useMemo(
    () => scoreCrops({ soilType, soilPh, rainfallMm, avgTempC }),
    [soilType, soilPh, rainfallMm, avgTempC]
  );

  const visibleCrops = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = scoredAll.filter((crop) => {
      const categoryOk = categoryFilter === 'All' || crop.category === categoryFilter;
      const searchOk = !term || crop.cropName.toLowerCase().includes(term) || crop.category.toLowerCase().includes(term);
      return categoryOk && searchOk;
    });
    return showAll ? filtered : filtered.slice(0, 12);
  }, [scoredAll, searchTerm, categoryFilter, showAll]);

  const totalMatched = useMemo(
    () => scoredAll.filter((crop) =>
      (categoryFilter === 'All' || crop.category === categoryFilter) &&
      (!searchTerm.trim() || crop.cropName.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    ).length,
    [scoredAll, categoryFilter, searchTerm]
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-extrabold tracking-tight text-[#1C2922]">Crop Advisor</h2>
            </div>
            <p className="text-xs text-[#3D4A3B] mt-1 font-medium">
              Pick your location to load observed climate and soil, then see suitability for every crop in the catalog — not a handful of presets.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-[#EDF6ED] text-[#153D2B] px-4 py-2 rounded-full border border-[#DCE5DC] font-bold shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#1BC447]" />
            <span>{CROP_ADVISORY_CATALOG.length} Verified Crops</span>
          </div>
        </div>

        {/* Location + inputs */}
        <div className="bg-white rounded-3xl border border-[#DCE5DC] p-6 shadow-bento space-y-5">
          <div className="flex items-center gap-2.5 border-b border-[#DCE5DC] pb-3.5">
            <div className="w-9 h-9 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
              <MapPin className="w-5 h-5 text-[#1BC447]" />
            </div>
            <h3 className="text-sm font-extrabold text-[#1C2922]">Step 1 — Choose your location or region</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#3D4A3B]" />
              <input
                value={placeQuery}
                onChange={(e) => onPlaceInput(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search city, district or region… (e.g. Ludhiana, Nakuru, Davis)"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#DCE5DC] text-sm text-[#1C2922] bg-[#F3FCF3]/60 focus:ring-2 focus:ring-[#1BC447] outline-none font-semibold"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-20 mt-2 w-full bg-white border border-[#DCE5DC] rounded-2xl shadow-bento overflow-hidden max-h-56 overflow-y-auto">
                  {suggestions.map((s) => (
                    <li key={`${s.latitude},${s.longitude}`}>
                      <button
                        onClick={() => {
                          setPlaceQuery([s.name, s.admin1, s.country].filter(Boolean).join(', '));
                          setShowSuggestions(false);
                          void loadContext(s.latitude, s.longitude, [s.name, s.admin1, s.country].filter(Boolean).join(', '));
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#1C2922] hover:bg-[#F3FCF3]"
                      >
                        {s.name}{s.admin1 ? `, ${s.admin1}` : ''}{s.country ? ` · ${s.country}` : ''}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={useMyLocation}
              disabled={contextLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#153D2B] text-[#1BC447] text-sm font-extrabold disabled:opacity-50 hover:brightness-110 transition-smooth shrink-0"
            >
              <Crosshair className="w-4 h-4" />
              Use my location
            </button>
          </div>

          {locationLabel && (
            <p className="text-[11px] text-[#3D4A3B] font-bold inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#1BC447]" /> Selected: {locationLabel}
              {inputsLive && <span className="text-[#1BC447]">— live inputs applied</span>}
            </p>
          )}
          {contextNote && (
            <p className="text-[11px] text-[#3D4A3B] font-medium bg-[#F3FCF3] border border-[#DCE5DC] rounded-xl px-3.5 py-2.5 inline-flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1BC447] shrink-0 mt-0.5" /> {contextNote}
            </p>
          )}
          {contextLoading && (
            <p className="text-[11px] text-[#3D4A3B] font-bold animate-pulse">Loading live climate and soil for this location…</p>
          )}

          {/* Manual overrides */}
          <div className="pt-4 border-t border-[#DCE5DC] space-y-1">
            <h3 className="text-sm font-extrabold text-[#1C2922] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#1BC447]" />
              Step 2 — Plot parameters
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${inputsLive ? 'bg-[#EDF6ED] text-[#153D2B] border-[#DCE5DC]' : 'bg-[#FFF6EB] text-[#895100] border-[#FFE0B2]'}`}>
                {inputsLive ? 'Auto-filled from live data — adjust if you know your field' : 'Manual inputs'}
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
            <div>
              <label className="block font-bold text-[#3D4A3B] mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#1BC447]" />
                <span>Soil texture {liveSoil && <span className="text-[#1BC447]">●</span>}</span>
              </label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3]/60 cursor-pointer font-medium focus:ring-2 focus:ring-[#1BC447]"
              >
                {SOIL_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              {liveSoil && <p className="text-[10px] text-[#3D4A3B] font-semibold mt-1">Live: {liveSoil.sourceName}</p>}
            </div>

            <div>
              <div className="flex justify-between font-bold text-[#3D4A3B] mb-1.5">
                <span className="flex items-center gap-1"><FlaskConical className="w-3.5 h-3.5 text-[#1BC447]" /> Soil pH {liveSoil?.ph != null && <span className="text-[#1BC447]">●</span>}</span>
                <span className="text-[#153D2B] font-extrabold tabular-nums">{soilPh}</span>
              </div>
              <input type="range" min="4.0" max="8.5" step="0.1" value={soilPh}
                onChange={(e) => setSoilPh(Number(e.target.value))}
                className="w-full accent-[#1BC447] cursor-pointer" />
              <span className="text-[10px] text-[#3D4A3B] font-semibold">
                {soilPh < 6.0 ? 'Acidic' : soilPh > 7.5 ? 'Alkaline' : 'Near neutral'}
                {liveSoil?.ph != null ? ` · live ${liveSoil.ph}` : ''}
              </span>
            </div>

            <div>
              <div className="flex justify-between font-bold text-[#3D4A3B] mb-1.5">
                <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-[#1BC447]" /> Season rainfall {liveClimate && <span className="text-[#1BC447]">●</span>}</span>
                <span className="text-[#153D2B] font-extrabold tabular-nums">{rainfallMm} mm</span>
              </div>
              <input type="range" min="100" max="2600" step="50" value={rainfallMm}
                onChange={(e) => setRainfallMm(Number(e.target.value))}
                className="w-full accent-[#1BC447] cursor-pointer" />
              <span className="text-[10px] text-[#3D4A3B] font-semibold">
                {liveClimate ? `Observed total · ${liveClimate.sourceName}` : 'Set expected seasonal moisture'}
              </span>
            </div>

            <div>
              <div className="flex justify-between font-bold text-[#3D4A3B] mb-1.5">
                <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-[#1BC447]" /> Avg temperature {liveClimate && <span className="text-[#1BC447]">●</span>}</span>
                <span className="text-[#153D2B] font-extrabold tabular-nums">{avgTempC}°C</span>
              </div>
              <input type="range" min="-5" max="40" step="1" value={avgTempC}
                onChange={(e) => setAvgTempC(Number(e.target.value))}
                className="w-full accent-[#1BC447] cursor-pointer" />
              <span className="text-[10px] text-[#3D4A3B] font-semibold">
                {liveClimate ? `Observed mean · ${liveClimate.sourceName}` : 'Set mean growth temperature'}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-lg font-extrabold text-[#1C2922]">Ranked crop suitability</h3>
            <span className="text-xs font-bold text-[#3D4A3B] bg-[#EDF6ED] px-3.5 py-1 rounded-full border border-[#DCE5DC] tabular-nums">
              {totalMatched} of {CROP_ADVISORY_CATALOG.length} crops match your filters · all {CROP_ADVISORY_CATALOG.length} evaluated
            </span>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#3D4A3B]" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search crop…"
                className="pl-9 pr-3 py-2 rounded-xl border border-[#DCE5DC] text-xs font-semibold w-40 focus:ring-2 focus:ring-[#1BC447] outline-none"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#DCE5DC] text-xs font-semibold cursor-pointer focus:ring-2 focus:ring-[#1BC447] outline-none"
            >
              <option value="All">All categories</option>
              {CROP_ADVISORY_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {visibleCrops.map((crop) => (
            <CropCard key={crop.cropName} crop={crop} />
          ))}
        </div>

        {visibleCrops.length === 0 && (
          <div className="bg-white rounded-3xl border border-[#DCE5DC] p-8 text-center text-xs text-[#3D4A3B] font-medium">
            No crops match that search — clear the filter to see all {CROP_ADVISORY_CATALOG.length}.
          </div>
        )}

        {totalMatched > visibleCrops.length && (
          <div className="text-center">
            <button
              onClick={() => setShowAll((v) => !v)}
              className="px-6 py-3 rounded-2xl bg-white border border-[#DCE5DC] text-sm font-extrabold text-[#1C2922] hover:border-[#1BC447]/50 transition-smooth"
            >
              {showAll ? 'Show top12 only' : `Show all ${totalMatched} matching crops`}
            </button>
          </div>
        )}

        {/* Honest-method footer */}
        <div className="bg-[#F3FCF3] border border-[#DCE5DC] rounded-3xl p-5 text-[11px] text-[#3D4A3B] font-medium space-y-1.5">
          <p className="font-extrabold text-[#153D2B]">How scoring works</p>
          <p>
            Every crop in the {CROP_ADVISORY_CATALOG.length}-crop catalog is scored against your parameters: pH in range (+5) or out (−35),
            temperature in range or out (−30), seasonal rainfall in range or out (−20), soil texture match (−15 if not) — clamped to 20–98%.
            Temperature and rainfall are observed agroclimatology for the selected location (Open-Meteo observed); soil texture and pH come from ISRIC SoilGrids
            when available. Crop ranges are accepted agronomic envelopes from the approved source registry — they are guidance, not guarantees,
            and this advisor makes no yield or profit claims.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function CropCard({ crop }: { crop: ScoredCrop }) {
  const isHigh = crop.calculatedMatchScore >= 80;
  const isModerate = crop.calculatedMatchScore >= 60 && crop.calculatedMatchScore < 80;
  const cycle = crop.cycleLabel || `${crop.growthCycleDays} days`;
  return (
    <div className="bg-white rounded-3xl border border-[#DCE5DC] p-5 shadow-bento space-y-3 hover:shadow-bento-hover hover:border-[#1BC447]/50 transition-smooth flex flex-col justify-between">
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-extrabold text-[#1C2922] truncate">{crop.cropName}</h4>
            <p className="text-[10px] text-[#3D4A3B] font-semibold">{crop.category}</p>
          </div>
          <span className={`text-xs font-extrabold font-mono tabular-nums px-2.5 py-1 rounded-full border shrink-0 ${
            isHigh ? 'bg-[#EDF6ED] text-[#153D2B] border-[#DCE5DC]'
            : isModerate ? 'bg-[#FFF6EB] text-[#895100] border-[#FFE0B2]'
            : 'bg-slate-100 text-slate-700 border-slate-300'
          }`}>
            {crop.calculatedMatchScore}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-[#F3FCF3] p-3 rounded-2xl border border-[#DCE5DC]">
          <div><span className="text-[#3D4A3B]">Cycle:</span> <span className="font-bold text-[#1C2922]">{cycle}</span></div>
          <div><span className="text-[#3D4A3B]">Resilience:</span> <span className="font-bold text-[#153D2B]">{crop.resilienceScore}/10</span></div>
          <div><span className="text-[#3D4A3B]">Temp:</span> <span className="font-bold text-[#1C2922]">{crop.minTempC}–{crop.maxTempC}°C</span></div>
          <div><span className="text-[#3D4A3B]">pH:</span> <span className="font-bold text-[#1C2922]">{crop.minPh}–{crop.maxPh}</span></div>
          <div className="col-span-2"><span className="text-[#3D4A3B]">Rainfall:</span> <span className="font-bold text-[#1C2922]">{crop.minRainfallMm}–{crop.maxRainfallMm} mm</span></div>
          <div className="col-span-2"><span className="text-[#3D4A3B]">Soils:</span> <span className="font-bold text-[#1C2922]">{crop.suitableSoilTypes.join(', ')}</span></div>
        </div>

        <p className="text-[11px] text-[#3D4A3B] leading-relaxed font-medium">
          <strong className="text-[#1C2922]">Guidance:</strong> {crop.keyAgronomicAdvice}
        </p>
      </div>

      {crop.citation && (
        <div className="pt-2.5 border-t border-[#DCE5DC] flex items-center justify-between text-[10px] text-[#3D4A3B]">
          <span className="truncate max-w-[180px] font-medium">Ref: {crop.citation.sourceName}</span>
          <a href={crop.citation.canonicalUrl} target="_blank" rel="noopener noreferrer"
            className="text-[#153D2B] font-bold hover:text-[#1BC447] underline inline-flex items-center gap-0.5 shrink-0">
            Source <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}

export type { CropAdvisoryProfile };
