'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FreshnessBadge } from '@/components/ui/Badge';
import {
  MapPin,
  Crosshair,
  Search,
  ShieldCheck,
  TrendingUp,
  ExternalLink,
  Calculator,
  AlertTriangle
} from 'lucide-react';

interface GeoSuggestion {
  name: string;
  admin1?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
}

interface PriceRow {
  cropName: string;
  price: number;
  unit: string;
  currency: string;
  period: string;
  sourceName: string;
  datasetUrl: string;
  retrievedAt: string;
}

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'live'; rows: PriceRow[]; locationLabel: string; note: string; provider: string; retrievedAt: string }
  | { kind: 'unavailable'; reason: string; locationLabel?: string };

export default function MarketsPage() {
  const [placeQuery, setPlaceQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [state, setState] = useState<LoadState>({ kind: 'idle' });
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [freightCost, setFreightCost] = useState(0);
  const [handlingCost, setHandlingCost] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const fetchPrices = async (payload: Record<string, unknown>) => {
    setState({ kind: 'loading' });
    setShowSuggestions(false);
    setSelectedCrop(null);
    try {
      const res = await fetch('/api/markets/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      const data = json?.data;
      if (data?.available && Array.isArray(data.prices) && data.prices.length > 0) {
        setState({
          kind: 'live',
          rows: data.prices as PriceRow[],
          locationLabel: data.location?.label || 'Your region',
          note: data.note || '',
          provider: json?.meta?.provider || 'Official source',
          retrievedAt: json?.meta?.retrievedAt || new Date().toISOString()
        });
      } else {
        setState({
          kind: 'unavailable',
          reason: data?.reason || 'Prices are unavailable for this region right now.',
          locationLabel: data?.location?.label || undefined
        });
      }
    } catch {
      setState({ kind: 'unavailable', reason: 'Could not reach the price feed. Try again shortly — no sample prices are ever shown.' });
    }
  };

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

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setState({ kind: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (pos) => { void fetchPrices({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: 'My location' }); },
      () => setState({ kind: 'unavailable', reason: 'Location permission denied — search for your region instead.' })
    );
  };

  const rows = (state.kind === 'live' ? state.rows : []).filter((row) =>
    !searchTerm.trim() || row.cropName.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );
  const selected = state.kind === 'live' ? state.rows.find((r) => r.cropName === selectedCrop) ?? null : null;
  const netRealization = selected ? Math.max(0, selected.price - freightCost - handlingCost) : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-extrabold tracking-tight text-[#1C2922]">Market Prices</h2>
            </div>
            <p className="text-xs text-[#3D4A3B] mt-1 font-medium">
              Pick your region to load official crop prices for your country. No sample or simulated prices are shown — only what the official source publishes.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-[#EDF6ED] text-[#153D2B] px-4 py-2 rounded-full border border-[#DCE5DC] font-bold shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#1BC447]" />
            <span>Verified Data</span>
          </div>
        </div>

        {/* Region picker */}
        <div className="bg-white rounded-3xl border border-[#DCE5DC] p-6 shadow-bento space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#DCE5DC] pb-3.5">
            <div className="w-9 h-9 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
              <MapPin className="w-5 h-5 text-[#1BC447]" />
            </div>
            <h3 className="text-sm font-extrabold text-[#1C2922]">Choose your region</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#3D4A3B]" />
              <input
                value={placeQuery}
                onChange={(e) => onPlaceInput(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search city, district or region… (e.g. Lyon, Bhopal, Nakuru)"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#DCE5DC] text-sm text-[#1C2922] bg-[#F3FCF3]/60 focus:ring-2 focus:ring-[#1BC447] outline-none font-semibold"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-20 mt-2 w-full bg-white border border-[#DCE5DC] rounded-2xl shadow-bento overflow-hidden max-h-56 overflow-y-auto">
                  {suggestions.map((s) => (
                    <li key={`${s.latitude},${s.longitude}`}>
                      <button
                        onClick={() => {
                          const label = [s.name, s.admin1, s.country].filter(Boolean).join(', ');
                          setPlaceQuery(label);
                          void fetchPrices({ place: label, label });
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
              disabled={state.kind === 'loading'}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#153D2B] text-[#1BC447] text-sm font-extrabold disabled:opacity-50 hover:brightness-110 transition-smooth shrink-0"
            >
              <Crosshair className="w-4 h-4" />
              Use my location
            </button>
          </div>
          <p className="text-[10px] text-[#3D4A3B] font-medium">
            Coverage: Official daily APMC Mandi prices for India (Agmarknet) and annual producer prices for EU countries (Eurostat). Other regions show an honest
            “not connected” state instead of sample numbers.
          </p>
        </div>

        {/* Idle */}
        {state.kind === 'idle' && (
          <div className="bg-white rounded-3xl border border-[#DCE5DC] p-8 text-center space-y-2 shadow-bento">
            <TrendingUp className="w-6 h-6 text-[#1BC447] mx-auto" />
            <p className="text-sm font-extrabold text-[#1C2922]">No prices loaded yet</p>
            <p className="text-xs text-[#3D4A3B] font-medium max-w-md mx-auto">
              Pick your region above. Prices arrive directly from the official source with the publication period and provenance shown on every row.
            </p>
          </div>
        )}

        {/* Loading */}
        {state.kind === 'loading' && (
          <div className="bg-white rounded-3xl border border-[#DCE5DC] p-8 text-center shadow-bento">
            <p className="text-sm font-extrabold text-[#1C2922] animate-pulse">Loading official prices for your region…</p>
          </div>
        )}

        {/* Honest unavailable */}
        {state.kind === 'unavailable' && (
          <div className="bg-[#FFF6EB] border border-[#FFE0B2] rounded-3xl p-6 space-y-2">
            <p className="text-sm font-extrabold text-[#895100] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FD9D1A]" /> No live prices for this region
            </p>
            <p className="text-xs text-[#895100] font-medium leading-relaxed">{state.reason}</p>
          </div>
        )}

        {/* Live results */}
        {state.kind === 'live' && (
          <div className="space-y-4">
            {/* Provenance banner */}
            <div className="bg-[#EDF7FF] border border-[#BEE3F8] rounded-3xl p-5 space-y-1.5">
              <p className="text-xs font-extrabold text-[#004263] flex items-center gap-2 flex-wrap">
                <MapPin className="w-3.5 h-3.5" /> {state.locationLabel}
                <span className="font-bold text-[#3D4A3B]">·</span>
                <span className="font-bold text-[#3D4A3B]">{state.provider}</span>
                <span className="font-bold text-[#3D4A3B]">·</span>
                <span className="font-bold text-[#3D4A3B]">fetched {new Date(state.retrievedAt).toLocaleString()}</span>
              </p>
              <p className="text-[11px] text-[#004263] font-medium leading-relaxed">{state.note}</p>
            </div>

            {/* Filter + count */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <span className="text-xs font-bold text-[#3D4A3B] bg-[#EDF6ED] px-3.5 py-1 rounded-full border border-[#DCE5DC] tabular-nums">
                {rows.length} official price{rows.length === 1 ? '' : 's'}
              </span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#3D4A3B]" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter crops…"
                  className="pl-9 pr-3 py-2 rounded-xl border border-[#DCE5DC] text-xs font-semibold w-48 focus:ring-2 focus:ring-[#1BC447] outline-none"
                />
              </div>
            </div>

            {/* Price rows */}
            <div className="bg-white rounded-3xl border border-[#DCE5DC] shadow-bento overflow-hidden divide-y divide-[#DCE5DC]">
              <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-[#F3FCF3] text-[11px] font-extrabold text-[#3D4A3B] uppercase tracking-wider">
                <span className="col-span-4">Crop</span>
                <span className="col-span-4">Official price</span>
                <span className="col-span-3">Period</span>
                <span className="col-span-1 text-right">Source</span>
              </div>
              {rows.map((row) => (
                <button
                  key={row.cropName}
                  onClick={() => { setSelectedCrop(row.cropName); setFreightCost(0); setHandlingCost(0); }}
                  className={`w-full grid grid-cols-12 gap-2 px-5 py-3.5 text-left text-xs transition-smooth ${
                    selectedCrop === row.cropName ? 'bg-[#EDF6ED]' : 'hover:bg-[#F3FCF3]'
                  }`}
                >
                  <span className="col-span-4 font-extrabold text-[#1C2922]">{row.cropName}</span>
                  <span className="col-span-4 font-mono font-extrabold text-[#153D2B] tabular-nums">
                    {row.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} {row.currency} / {row.unit}
                  </span>
                  <span className="col-span-3 text-[#3D4A3B] font-semibold">{row.period}</span>
                  <span className="col-span-1 text-right">
                    <a
                      href={row.datasetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#153D2B] hover:text-[#1BC447] inline-flex"
                      title="Open official dataset"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </span>
                </button>
              ))}
              {rows.length === 0 && (
                <p className="px-5 py-6 text-xs text-[#3D4A3B] font-medium text-center">No crops match that filter.</p>
              )}
            </div>

            {/* Net realization calculator — uses the selected OFFICIAL price */}
            {selected && (
              <div className="bg-white rounded-3xl border border-[#DCE5DC] p-6 shadow-bento space-y-4">
                <div className="flex items-center gap-2 border-b border-[#DCE5DC] pb-3">
                  <Calculator className="w-4 h-4 text-[#1BC447]" />
                  <h3 className="text-sm font-extrabold text-[#1C2922]">Net realization — {selected.cropName}</h3>
                  <span className="text-[10px] font-bold text-[#3D4A3B] bg-[#F3FCF3] border border-[#DCE5DC] px-2.5 py-0.5 rounded-full">
                    Based on the official price above
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#3D4A3B] mb-1.5">Freight cost ({selected.currency}/{selected.unit})</label>
                    <input type="number" min="0" step="0.01" value={freightCost}
                      onChange={(e) => setFreightCost(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DCE5DC] font-semibold focus:ring-2 focus:ring-[#1BC447] outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold text-[#3D4A3B] mb-1.5">Handling / commission ({selected.currency}/{selected.unit})</label>
                    <input type="number" min="0" step="0.01" value={handlingCost}
                      onChange={(e) => setHandlingCost(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DCE5DC] font-semibold focus:ring-2 focus:ring-[#1BC447] outline-none" />
                  </div>
                  <div className="bg-[#EDF6ED] border border-[#DCE5DC] rounded-2xl px-4 py-3">
                    <p className="text-[10px] font-bold text-[#3D4A3B] uppercase tracking-wider">Your net realization</p>
                    <p className="text-lg font-black text-[#153D2B] font-mono tabular-nums">
                      {netRealization.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selected.currency}
                    </p>
                    <p className="text-[10px] text-[#3D4A3B] font-medium">
                      per {selected.unit} · official price {selected.price.toLocaleString()} − your costs
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-[#3D4A3B] font-medium">
                  Freight and handling are <strong>your own estimates</strong> — FarmIQ does not know your transport rates. The price basis is the official
                  source period shown above ({selected.period}), not a same-day quote.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
