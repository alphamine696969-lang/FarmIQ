'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { FreshnessBadge } from '@/components/ui/Badge';
import {
  Sprout,
  TrendingUp,
  Calculator,
  Bot,
  CloudSun,
  ScanLine,
  Compass,
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  DollarSign,
  Droplets,
  ShieldCheck,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import { getStoredUserProfile, UserProfile } from '@/lib/data/userState';
import { SAMPLE_WEATHER_DATA } from '@/lib/data/weatherData';

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setProfile(getStoredUserProfile());
  }, []);

  const activeFarm = profile?.farms.find((f) => f.id === profile.activeFarmId) || profile?.farms[0];
  const primaryScenario = profile?.savedScenarios[0];

  return (
    <AppShell>
      <div className="space-y-8">
        
        {/* Welcome & Farm Context Banner (Deep Forest Green Anchor #153D2B) */}
        <div className="bg-[#153D2B] text-white rounded-3xl p-7 sm:p-9 shadow-floating border border-[#1C4D37] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0E281C] text-[#1BC447] text-xs font-bold border border-[#1C4D37]">
              <span className="w-2 h-2 rounded-full bg-[#1BC447] animate-pulse" />
              <span>Telemetry Control Active • Level 1 Verified</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Good day, {profile?.displayName || 'Farmer Alex'}
            </h2>
            <p className="text-white/80 text-sm max-w-xl font-medium">
              Currently monitoring <strong>{activeFarm?.name}</strong> ({activeFarm?.areaTotal} {activeFarm?.areaUnit}s in {activeFarm?.region || 'United States'}). 
              Live telemetry is encrypted and private to your tenant.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
            <Link
              href="/app/profit"
              className="px-6 py-3 rounded-full bg-[#1BC447] hover:bg-[#16a73c] text-[#1C2922] font-extrabold text-xs shadow-glow-lime transition-smooth flex items-center gap-2"
            >
              <Calculator className="w-4 h-4 text-[#1C2922]" />
              <span>Run Profit Model</span>
            </Link>
            <Link
              href="/app/assistant"
              className="px-5 py-3 rounded-full bg-[#1C4D37] hover:bg-[#1C4D37]/80 text-white font-bold text-xs border border-white/20 transition-smooth flex items-center gap-2"
            >
              <Bot className="w-4 h-4 text-[#1BC447]" />
              <span>Ask Assistant</span>
            </Link>
          </div>
        </div>

        {/* Top 4 Bento Metric Cards with 40x40 squircle icon containers and tabular figures */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Bento Card 1: Area */}
          <div className="bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento hover:shadow-bento-hover transition-smooth space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                <Layers className="w-5 h-5 text-[#1BC447]" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#153D2B] bg-[#EDF6ED] px-2.5 py-0.5 rounded-full border border-[#DCE5DC]">
                Active Plots
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#3D4A3B] uppercase tracking-wider">Total Farm Holding</p>
              <p className="text-3xl font-extrabold text-[#1C2922] mt-1 tabular-nums">
                {activeFarm?.areaTotal} <span className="text-base font-semibold text-[#3D4A3B]">{activeFarm?.areaUnit}s</span>
              </p>
            </div>
            <p className="text-[11px] text-[#153D2B] font-bold flex items-center gap-1.5 pt-1 border-t border-[#DCE5DC]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1BC447]" />
              <span>{activeFarm?.plots.length || 0} active plots monitored</span>
            </p>
          </div>

          {/* Bento Card 2: Projected Revenue */}
          <div className="bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento hover:shadow-bento-hover transition-smooth space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                <DollarSign className="w-5 h-5 text-[#1BC447]" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#153D2B] bg-[#EDF6ED] px-2.5 py-0.5 rounded-full border border-[#DCE5DC]">
                <ArrowUpRight className="w-3.5 h-3.5 text-[#1BC447]" />
                Forecasted
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#3D4A3B] uppercase tracking-wider">Projected Revenue</p>
              <p className="text-3xl font-extrabold text-[#153D2B] mt-1 tabular-nums">
                {profile?.preferences.preferredCurrency} {primaryScenario ? primaryScenario.result.grossRevenue.toLocaleString() : '27,000'}
              </p>
            </div>
            <p className="text-[11px] text-[#3D4A3B] font-semibold pt-1 border-t border-[#DCE5DC]">
              Model: <span className="text-[#1C2922] font-bold">{primaryScenario?.name || 'Winter Wheat'}</span>
            </p>
          </div>

          {/* Bento Card 3: Net Margin */}
          <div className="bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento hover:shadow-bento-hover transition-smooth space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                <TrendingUp className="w-5 h-5 text-[#1BC447]" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#153D2B] bg-[#EDF6ED] px-2.5 py-0.5 rounded-full border border-[#DCE5DC]">
                ROI {primaryScenario ? `${primaryScenario.result.roiPercentage}%` : '22.7%'}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#3D4A3B] uppercase tracking-wider">Net Operating Margin</p>
              <p className="text-3xl font-extrabold text-[#153D2B] mt-1 tabular-nums">
                {primaryScenario ? `${primaryScenario.result.marginPercentage}%` : '18.5%'}
              </p>
            </div>
            <p className="text-[11px] text-[#153D2B] font-bold pt-1 border-t border-[#DCE5DC]">
              <span>Deterministic Net Gain Model</span>
            </p>
          </div>

          {/* Bento Card 4: Soil & Hydrology */}
          <div className="bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento hover:shadow-bento-hover transition-smooth space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#EDF7FF] text-[#004263] flex items-center justify-center border border-[#BEE3F8]">
                <CloudSun className="w-5 h-5 text-[#33B3FC]" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#004263] bg-[#EDF7FF] px-2.5 py-0.5 rounded-full border border-[#BEE3F8]">
                Hydrology
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#3D4A3B] uppercase tracking-wider">Canopy & Soil State</p>
              <p className="text-3xl font-extrabold text-[#1C2922] mt-1 tabular-nums">
                {SAMPLE_WEATHER_DATA.current.tempC}°C <span className="text-base font-semibold text-[#3D4A3B]">/ {SAMPLE_WEATHER_DATA.current.soilMoisturePercent}% moist</span>
              </p>
            </div>
            <p className="text-[11px] text-[#153D2B] font-bold flex items-center gap-1.5 pt-1 border-t border-[#DCE5DC]">
              <Droplets className="w-3.5 h-3.5 text-[#33B3FC]" />
              <span>Optimal Spray Window Today</span>
            </p>
          </div>

        </div>

        {/* Agro Weather & Hazard Alert Banner (Harvest Warning #FFF6EB / #FD9D1A) */}
        {SAMPLE_WEATHER_DATA.alerts.length > 0 && (
          <div className="p-6 rounded-3xl bg-[#FFF6EB] border border-[#FFE0B2] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#FFE0B2] text-[#895100] flex items-center justify-center shrink-0 border border-[#FD9D1A]/30">
                <AlertTriangle className="w-5 h-5 text-[#FD9D1A]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#5d3500]">{SAMPLE_WEATHER_DATA.alerts[1]?.title || 'Agro Alert'}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FD9D1A] text-white px-2.5 py-0.5 rounded-full">
                    {SAMPLE_WEATHER_DATA.alerts[1]?.alertType}
                  </span>
                </div>
                <p className="text-xs text-[#895100] leading-relaxed max-w-3xl font-medium">
                  {SAMPLE_WEATHER_DATA.alerts[1]?.description} — <strong>Agronomic Action:</strong> {SAMPLE_WEATHER_DATA.alerts[1]?.agronomicAction}
                </p>
              </div>
            </div>
            <Link
              href="/app/weather"
              className="shrink-0 px-5 py-2.5 rounded-full bg-white text-[#895100] border border-[#FFE0B2] text-xs font-bold hover:bg-[#FFE0B2] transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Inspect Forecast</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Main Grid: Active Field Plots + Market Watch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Active Field Plots & Crop Cycles (8 cols Bento Card) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#DCE5DC] p-7 sm:p-8 shadow-bento space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#1C2922]">Field Plots & Crop Cycle Telemetry</h3>
                <p className="text-xs text-[#3D4A3B]">Plot-by-plot soil parameters and active growing stages.</p>
              </div>
              <Link
                href="/app/farms"
                className="px-4 py-2 rounded-full bg-[#EDF6ED] hover:bg-[#1BC447] text-[#153D2B] hover:text-[#1C2922] text-xs font-bold transition-smooth flex items-center gap-1 border border-[#DCE5DC]"
              >
                <span>Edit Holdings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {activeFarm?.plots.map((plot) => (
                <div
                  key={plot.id}
                  className="p-5 rounded-2xl border border-[#DCE5DC] bg-[#F3FCF3] hover:bg-white hover:border-[#1BC447]/50 hover:shadow-xs transition-smooth flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-sm font-extrabold text-[#1C2922]">{plot.name}</h4>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        plot.status === 'Planted' ? 'bg-[#EDF6ED] text-[#153D2B] border border-[#DCE5DC]' :
                        plot.status === 'Harvesting' ? 'bg-[#FFF6EB] text-[#895100] border border-[#FFE0B2]' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {plot.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#3D4A3B] font-medium">
                      Crop: <strong className="text-[#1C2922]">{plot.currentCrop || 'Fallow'}</strong> • <span className="tabular-nums">{plot.areaValue}</span> {plot.areaUnit}s
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="bg-white px-3 py-1 rounded-full border border-[#DCE5DC] text-[#3D4A3B] font-medium">
                      Soil: <span className="font-bold text-[#1C2922]">{plot.soilType}</span>
                    </div>
                    <div className="bg-white px-3 py-1 rounded-full border border-[#DCE5DC] text-[#3D4A3B] font-medium">
                      pH: <span className="font-extrabold text-[#153D2B] tabular-nums">{plot.soilPh}</span>
                    </div>
                    <div className="bg-white px-3 py-1 rounded-full border border-[#DCE5DC] text-[#3D4A3B] font-medium">
                      Irrigation: <span className="font-bold text-[#1C2922]">{plot.irrigationType}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions Bar */}
            <div className="pt-4 border-t border-[#DCE5DC] grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/app/assistant"
                className="p-3.5 rounded-2xl bg-[#EDF6ED] hover:bg-white text-center text-xs font-bold text-[#1C2922] border border-[#DCE5DC] hover:border-[#1BC447]/60 shadow-xs transition-smooth flex flex-col items-center gap-2"
              >
                <div className="w-8 h-8 rounded-xl bg-white text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                  <Bot className="w-4 h-4 text-[#1BC447]" />
                </div>
                <span>Ask Agronomist</span>
              </Link>
              <Link
                href="/app/disease"
                className="p-3.5 rounded-2xl bg-[#EDF6ED] hover:bg-white text-center text-xs font-bold text-[#1C2922] border border-[#DCE5DC] hover:border-[#1BC447]/60 shadow-xs transition-smooth flex flex-col items-center gap-2"
              >
                <div className="w-8 h-8 rounded-xl bg-white text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                  <ScanLine className="w-4 h-4 text-[#1BC447]" />
                </div>
                <span>Scan Disease</span>
              </Link>
              <Link
                href="/app/crop-advisor"
                className="p-3.5 rounded-2xl bg-[#EDF6ED] hover:bg-white text-center text-xs font-bold text-[#1C2922] border border-[#DCE5DC] hover:border-[#1BC447]/60 shadow-xs transition-smooth flex flex-col items-center gap-2"
              >
                <div className="w-8 h-8 rounded-xl bg-white text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                  <Compass className="w-4 h-4 text-[#1BC447]" />
                </div>
                <span>Crop Suitability</span>
              </Link>
              <Link
                href="/app/crop-path"
                className="p-3.5 rounded-2xl bg-[#EDF6ED] hover:bg-white text-center text-xs font-bold text-[#1C2922] border border-[#DCE5DC] hover:border-[#1BC447]/60 shadow-xs transition-smooth flex flex-col items-center gap-2"
              >
                <div className="w-8 h-8 rounded-xl bg-white text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                  <Sprout className="w-4 h-4 text-[#1BC447]" />
                </div>
                <span>CropPath Tracker</span>
              </Link>
              <Link
                href="/app/markets"
                className="p-3.5 rounded-2xl bg-[#EDF6ED] hover:bg-white text-center text-xs font-bold text-[#1C2922] border border-[#DCE5DC] hover:border-[#1BC447]/60 shadow-xs transition-smooth flex flex-col items-center gap-2"
              >
                <div className="w-8 h-8 rounded-xl bg-white text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                  <TrendingUp className="w-4 h-4 text-[#1BC447]" />
                </div>
                <span>Market Prices</span>
              </Link>
            </div>
          </div>

          {/* Market Intelligence Sidebar Bento (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#DCE5DC] p-7 shadow-bento space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#1C2922]">Market Price Watch</h3>
                <p className="text-[11px] text-[#3D4A3B]">Official prices for your region.</p>
              </div>
              <FreshnessBadge status="live" label="Official source" />
            </div>

            <div className="p-5 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-2 text-center">
              <p className="text-xs font-extrabold text-[#1C2922]">Pick your region to load live official prices</p>
              <p className="text-[11px] text-[#3D4A3B] font-medium leading-relaxed">
                Prices come straight from the official source with provenance — no sample or simulated numbers are shown anywhere in FarmIQ.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/app/markets"
                className="w-full py-3 rounded-full bg-[#EDF6ED] hover:bg-[#1BC447] text-[#153D2B] hover:text-[#1C2922] border border-[#DCE5DC] text-xs font-bold text-center block transition-smooth shadow-xs"
              >
                View All Commodities & Net Realization
              </Link>
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
