'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FreshnessBadge } from '@/components/ui/Badge';
import { FarmWeatherSnapshot } from '@/lib/data/weatherData';
import { getStoredUserProfile } from '@/lib/data/userState';
import {
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  Sun,
  AlertTriangle,
  Layers,
  Clock,
  MapPin,
  Crosshair,
  Search,
  CheckCircle2,
  Sparkles,
  CloudRain,
  Satellite,
  ExternalLink,
} from 'lucide-react';

interface GeoSuggestion {
  name: string;
  admin1?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
}

export default function WeatherPage() {
  const [data, setData] = useState<FarmWeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeQuery, setPlaceQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchWeather = async (lat: number, lon: number, label?: string) => {
    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    try {
      const url = `/api/weather/current?lat=${lat}&lon=${lon}${label ? `&label=${encodeURIComponent(label)}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.data) {
        setData(json.data as FarmWeatherSnapshot);
      } else {
        setError(json?.error?.message || json?.meta?.reason || 'Failed to load weather forecast.');
      }
    } catch {
      setError('Could not reach weather service. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If user has a farm registered with a region, try geocoding it on initial visit
    const profile = getStoredUserProfile();
    const activeFarm = profile?.farms.find((f) => f.id === profile.activeFarmId) || profile?.farms[0];
    if (activeFarm && activeFarm.region) {
      void (async () => {
        try {
          const res = await fetch('/api/crop-path/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: activeFarm.region })
          });
          const json = await res.json();
          const first = json?.data?.suggestions?.[0];
          if (first) {
            void fetchWeather(first.latitude, first.longitude, `${activeFarm.name} (${first.name})`);
          }
        } catch {
          // Keep idle if background geocode fails
        }
      })();
    }
  }, []);

  const onPlaceInput = (val: string) => {
    setPlaceQuery(val);
    setShowSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/crop-path/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: val })
        });
        const json = await res.json();
        setSuggestions((json?.data?.suggestions as GeoSuggestion[]) || []);
      } catch {
        setSuggestions([]);
      }
    }, 400);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void fetchWeather(pos.coords.latitude, pos.coords.longitude, 'My Field Location');
      },
      () => {
        setLoading(false);
        setError('Location permission denied. Please search for your city or region instead.');
      },
      { timeout: 10000 }
    );
  };

  return (
    <AppShell>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-7 rounded-3xl border border-[#DCE5DC] shadow-bento">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-[#1C2922]">Agro-Meteorological Weather Intelligence</h2>
              <FreshnessBadge status={data ? "live" : "supported"} label={data ? "NASA POWER Live Satellite API" : "NASA POWER Ready"} />
            </div>
            <p className="text-xs text-[#3D4A3B] mt-1 font-medium">
              Field-level weather forecasting tailored for evapotranspiration (ET0), soil workability, and foliar spray drift.
            </p>
          </div>
          {data && (
            <div className="flex items-center gap-2 text-xs text-[#3D4A3B] bg-[#EDF6ED] px-4 py-2 rounded-full border border-[#DCE5DC] font-bold">
              <Clock className="w-3.5 h-3.5 text-[#153D2B]" />
              <span>Retrieved: {new Date(data.retrievedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Location Picker */}
        <div className="bg-white rounded-3xl border border-[#DCE5DC] p-6 shadow-bento space-y-4">
          <div className="flex items-center gap-2 border-b border-[#DCE5DC] pb-3">
            <MapPin className="w-4 h-4 text-[#1BC447]" />
            <h3 className="text-sm font-extrabold text-[#1C2922]">Select Monitoring Location</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 relative">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3D4A3B]" />
              <input
                type="text"
                value={placeQuery}
                onChange={(e) => onPlaceInput(e.target.value)}
                placeholder="Search city, district, or agricultural zone..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#DCE5DC] bg-[#F3FCF3] text-xs font-medium text-[#1C2922] focus:outline-none focus:ring-2 focus:ring-[#1BC447]"
              />

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DCE5DC] rounded-2xl shadow-floating z-50 p-2 space-y-1">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPlaceQuery([s.name, s.admin1, s.country].filter(Boolean).join(', '));
                        void fetchWeather(s.latitude, s.longitude, [s.name, s.admin1].filter(Boolean).join(', '));
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-[#EDF6ED] text-xs flex items-center justify-between transition-colors"
                    >
                      <span className="font-bold text-[#1C2922]">{s.name}</span>
                      <span className="text-[11px] text-[#3D4A3B]">{[s.admin1, s.country].filter(Boolean).join(', ')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={useMyLocation}
              disabled={loading}
              className="px-5 py-2.5 rounded-2xl bg-[#EDF6ED] hover:bg-[#1BC447] text-[#153D2B] hover:text-[#1C2922] text-xs font-bold transition-smooth flex items-center justify-center gap-2 border border-[#DCE5DC] shrink-0"
            >
              <Crosshair className="w-4 h-4 text-[#1BC447]" />
              <span>Use My Location (GPS)</span>
            </button>
          </div>

          {loading && (
            <p className="text-xs text-[#153D2B] font-bold animate-pulse">Loading satellite agro-meteorology from NASA POWER...</p>
          )}

          {error && (
            <p className="text-xs text-[#BA1A1A] font-medium bg-rose-50 p-3 rounded-xl border border-rose-200">{error}</p>
          )}
        </div>

        {/* If no data yet */}
        {!data && !loading && (
          <div className="bg-white rounded-3xl border border-[#DCE5DC] p-12 text-center space-y-3 shadow-bento">
            <div className="w-14 h-14 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center mx-auto border border-[#DCE5DC]">
              <CloudSun className="w-7 h-7 text-[#1BC447]" />
            </div>
            <h3 className="text-lg font-extrabold text-[#1C2922]">No Location Selected</h3>
            <p className="text-xs text-[#3D4A3B] max-w-md mx-auto">
              Search for your town, village, or farm region above, or click &quot;Use My Location&quot; to load live field-level agro-meteorological forecasting and spraying windows.
            </p>
          </div>
        )}

        {/* Live Weather Content */}
        {data && (
          <>
            {/* Current Field-Level Snapshot (Top 6 Bento Cards with tabular figures) */}
            <div className="bg-white rounded-3xl border border-[#DCE5DC] p-7 sm:p-9 shadow-bento space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCE5DC] pb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#153D2B] bg-[#EDF6ED] px-2.5 py-0.5 rounded-full border border-[#DCE5DC]">
                    Active Satellite Telemetry (NASA POWER AG)
                  </span>
                  <h3 className="text-lg font-extrabold text-[#1C2922] mt-1.5">{data.locationName}</h3>
                </div>
                <span className="text-xs text-[#3D4A3B] font-mono font-semibold tabular-nums">
                  Coords: {data.coordinates.lat.toFixed(4)}° N, {data.coordinates.lng.toFixed(4)}° E
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
                
                <div className="p-5 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-1">
                  <div className="flex items-center justify-between text-[#3D4A3B]">
                    <span className="font-bold">Air Temp</span>
                    <Thermometer className="w-4 h-4 text-[#FD9D1A]" />
                  </div>
                  <p className="text-2xl font-black text-[#1C2922] tabular-nums">{data.current.tempC}°C</p>
                  <p className="text-[11px] text-[#3D4A3B] font-medium">Feels like {data.current.feelsLikeC}°C</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-1">
                  <div className="flex items-center justify-between text-[#3D4A3B]">
                    <span className="font-bold">Canopy RH</span>
                    <Droplets className="w-4 h-4 text-[#33B3FC]" />
                  </div>
                  <p className="text-2xl font-black text-[#1C2922] tabular-nums">{data.current.humidityPercent}%</p>
                  <p className="text-[11px] text-[#3D4A3B] font-medium">Dew Point: {data.current.dewPointC}°C</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-1">
                  <div className="flex items-center justify-between text-[#3D4A3B]">
                    <span className="font-bold">Wind Speed</span>
                    <Wind className="w-4 h-4 text-teal-600" />
                  </div>
                  <p className="text-2xl font-black text-[#1C2922] tabular-nums">{data.current.windSpeedKmh} <span className="text-xs font-normal">km/h</span></p>
                  <p className="text-[11px] text-[#153D2B] font-bold">
                    {data.current.windSpeedKmh < 15 ? 'Low drift risk' : 'Elevated drift'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-1">
                  <div className="flex items-center justify-between text-[#3D4A3B]">
                    <span className="font-bold">Soil Temp</span>
                    <Layers className="w-4 h-4 text-[#153D2B]" />
                  </div>
                  <p className="text-2xl font-black text-[#1C2922] tabular-nums">{data.current.soilTempC}°C</p>
                  <p className="text-[11px] text-[#3D4A3B] font-medium">Estimated root zone</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-1">
                  <div className="flex items-center justify-between text-[#3D4A3B]">
                    <span className="font-bold">Soil Moisture</span>
                    <Droplets className="w-4 h-4 text-[#1BC447]" />
                  </div>
                  <p className="text-2xl font-black text-[#153D2B] tabular-nums">{data.current.soilMoisturePercent}%</p>
                  <p className="text-[11px] text-[#3D4A3B] font-medium">Available water</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-1">
                  <div className="flex items-center justify-between text-[#3D4A3B]">
                    <span className="font-bold">Conditions</span>
                    <Sun className="w-4 h-4 text-[#FD9D1A]" />
                  </div>
                  <p className="text-base font-black text-[#1C2922] truncate mt-1">{data.current.condition}</p>
                  <p className="text-[11px] text-[#3D4A3B] font-medium">UV Index: {data.current.uvIndex}</p>
                </div>

              </div>
            </div>

            {/* NASA POWER Agroclimatology Bento Card */}
            {data.nasaPower && (
              <div className="bg-white rounded-3xl border border-[#DCE5DC] p-7 sm:p-9 shadow-bento space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE5DC] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#0B4D2E] text-[#A8E063] flex items-center justify-center font-bold shadow-sm">
                      <Satellite className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-[#1C2922]">NASA POWER Satellite Agroclimatology</h3>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#EDF6ED] text-[#0B4D2E] px-2 py-0.5 rounded-full border border-[#DCE5DC]">
                          Community: AG
                        </span>
                      </div>
                      <p className="text-xs text-[#3D4A3B] mt-0.5">
                        {data.nasaPower.provenance.source} • {data.nasaPower.provenance.datasetRange}
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://power.larc.nasa.gov/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#0B4D2E] hover:text-[#4CAF50] inline-flex items-center gap-1 transition-colors"
                  >
                    <span>NASA POWER Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Key NASA Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-5 rounded-2xl bg-[#F5FBEF] border border-[#DCE5DC] space-y-1">
                    <div className="flex items-center justify-between text-[#3D4A3B]">
                      <span className="font-bold">Solar Irradiance (PAR)</span>
                      <Sun className="w-4 h-4 text-[#FD9D1A]" />
                    </div>
                    <p className="text-2xl font-black text-[#1C2922] tabular-nums">
                      {data.nasaPower.currentMonthBenchmark.solarMJ} <span className="text-xs font-normal">MJ/m²/day</span>
                    </p>
                    <p className="text-[11px] text-[#3D4A3B]">Solar potential ({data.nasaPower.currentMonthBenchmark.month})</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#F5FBEF] border border-[#DCE5DC] space-y-1">
                    <div className="flex items-center justify-between text-[#3D4A3B]">
                      <span className="font-bold">25-Yr Precip. Norm</span>
                      <CloudRain className="w-4 h-4 text-[#33B3FC]" />
                    </div>
                    <p className="text-2xl font-black text-[#1C2922] tabular-nums">
                      {data.nasaPower.currentMonthBenchmark.precipMmPerDay} <span className="text-xs font-normal">mm/day</span>
                    </p>
                    <p className="text-[11px] text-[#3D4A3B]">Annual: {data.nasaPower.annualAveragePrecipMm} mm</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#F5FBEF] border border-[#DCE5DC] space-y-1">
                    <div className="flex items-center justify-between text-[#3D4A3B]">
                      <span className="font-bold">Historical Temp Norm</span>
                      <Thermometer className="w-4 h-4 text-[#0B4D2E]" />
                    </div>
                    <p className="text-2xl font-black text-[#1C2922] tabular-nums">
                      {data.nasaPower.currentMonthBenchmark.tempMeanC}°C
                    </p>
                    <p className="text-[11px] text-[#3D4A3B]">Annual baseline: {data.nasaPower.annualAverageTempC}°C</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#F5FBEF] border border-[#DCE5DC] space-y-1">
                    <div className="flex items-center justify-between text-[#3D4A3B]">
                      <span className="font-bold">Terrain Elevation</span>
                      <Layers className="w-4 h-4 text-teal-600" />
                    </div>
                    <p className="text-2xl font-black text-[#1C2922] tabular-nums">
                      {data.nasaPower.provenance.elevationMeters ? `${Math.round(data.nasaPower.provenance.elevationMeters)}m` : 'Sea Level'}
                    </p>
                    <p className="text-[11px] text-[#3D4A3B]">NASA MERRA-2 terrain surface</p>
                  </div>
                </div>

                {/* Monthly Solar & Precip Distribution (12-Month Climatology) */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#1C2922]">
                    <span>NASA 25-Year Agroclimatological Monthly Profile</span>
                    <span className="text-[11px] text-[#3D4A3B] font-medium">Solar Radiation (MJ/m²/day) & Rain (mm/day)</span>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 text-center text-[10px]">
                    {Object.entries(data.nasaPower.solarRadiationMonthly)
                      .filter(([m]) => m !== 'ANN')
                      .map(([month, solar]) => {
                        const isCurrent = month === data.nasaPower?.currentMonthBenchmark.month;
                        const rain = data.nasaPower?.precipitationMonthly[month] ?? 0;
                        return (
                          <div
                            key={month}
                            className={`p-2.5 rounded-xl border transition-colors ${
                              isCurrent
                                ? 'bg-[#EDF6ED] border-[#0B4D2E] text-[#0B4D2E] font-extrabold ring-1 ring-[#0B4D2E]'
                                : 'bg-[#F5FBEF]/60 border-[#DCE5DC] text-[#3D4A3B]'
                            }`}
                          >
                            <p className="font-bold text-[11px]">{month}</p>
                            <p className="text-xs font-black text-[#FD9D1A] mt-1">{solar}</p>
                            <p className="text-[10px] text-[#33B3FC] font-semibold">{rain}mm</p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* Agro Alerts Bento Cards */}
            {data.alerts.length > 0 && (
              <div className="space-y-3.5">
                <h3 className="text-base font-extrabold text-[#1C2922]">Active Agro-Meteorological Alerts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {data.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-6 rounded-3xl border space-y-3.5 shadow-bento ${
                        alert.severity === 'high'
                          ? 'bg-[#FFF6EB] border-[#FFE0B2] text-[#895100]'
                          : 'bg-[#EDF6ED] border-[#DCE5DC] text-[#153D2B]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`w-4 h-4 ${alert.severity === 'high' ? 'text-[#FD9D1A]' : 'text-[#1BC447]'}`} />
                          <span className="font-extrabold text-sm">{alert.title}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full ${
                          alert.severity === 'high' ? 'bg-[#FD9D1A] text-white' : 'bg-[#153D2B] text-white'
                        }`}>
                          {alert.alertType}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed font-medium">{alert.description}</p>
                      <div className="p-3 bg-white/90 rounded-2xl border border-current/20 text-xs font-medium">
                        <strong className="text-[#1C2922]">Recommended Field Action:</strong> {alert.agronomicAction}
                      </div>
                      <div className="text-[10px] text-[#3D4A3B] flex items-center justify-between pt-1 font-semibold">
                        <span>Source: {alert.sourceProvider}</span>
                        <span>Valid until: {alert.validUntil}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7-Day Agricultural Forecast Bento Container */}
            <div className="bg-white rounded-3xl border border-[#DCE5DC] p-7 sm:p-8 shadow-bento space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#1C2922]">7-Day Agro-Meteorological Forecast</h3>
                <span className="text-xs text-[#3D4A3B] font-bold bg-[#EDF6ED] px-3.5 py-1 rounded-full border border-[#DCE5DC]">
                  Spray Windows & Soil Workability
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#DCE5DC] text-[#3D4A3B] uppercase tracking-wider text-[11px] font-bold">
                      <th className="py-3 px-3">Day</th>
                      <th className="py-3 px-3">Conditions</th>
                      <th className="py-3 px-3">Temp (Max/Min)</th>
                      <th className="py-3 px-3">Rain (mm / %)</th>
                      <th className="py-3 px-3">ET0 Evap.</th>
                      <th className="py-3 px-3">Spraying Window</th>
                      <th className="py-3 px-3">Soil Workability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DC]">
                    {data.forecast.map((day) => (
                      <tr key={day.date} className="hover:bg-[#F3FCF3] transition-colors">
                        <td className="py-4 px-3 font-extrabold text-[#1C2922]">
                          {day.dayName}
                          <span className="block text-[10px] font-normal text-[#3D4A3B]">{day.date}</span>
                        </td>
                        <td className="py-4 px-3">
                          <span className="font-semibold text-[#1C2922]">{day.condition}</span>
                        </td>
                        <td className="py-4 px-3 font-mono font-extrabold text-[#1C2922] tabular-nums">
                          {day.tempMaxC}°C / <span className="text-[#3D4A3B] font-normal">{day.tempMinC}°C</span>
                          {day.frostRisk && (
                            <span className="ml-2 text-[10px] text-[#BA1A1A] bg-[#FDF2F2] px-2 py-0.5 rounded-full font-bold border border-[#FCDAD7]">
                              Frost Hazard
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-3 font-mono tabular-nums">
                          <span className="font-bold text-[#1C2922]">{day.precipitationMm} mm</span>
                          <span className="text-[10px] text-[#3D4A3B] block">({day.precipitationChance}% chance)</span>
                        </td>
                        <td className="py-4 px-3 font-mono font-extrabold text-[#153D2B] tabular-nums">
                          {day.evapotranspirationMm} mm/day
                        </td>
                        <td className="py-4 px-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold ${
                            day.sprayingWindowRating === 'Excellent' ? 'bg-[#EDF6ED] text-[#153D2B] border border-[#DCE5DC]' :
                            day.sprayingWindowRating === 'Moderate' ? 'bg-[#FFF6EB] text-[#895100] border border-[#FFE0B2]' :
                            'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {day.sprayingWindowRating}
                          </span>
                        </td>
                        <td className="py-4 px-3">
                          <span className="font-bold text-[#1C2922]">{day.fieldWorkability}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </AppShell>
  );
}
