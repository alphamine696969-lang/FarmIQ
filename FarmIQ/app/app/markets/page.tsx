'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FreshnessBadge } from '@/components/ui/Badge';
import { INITIAL_MARKET_OBSERVATIONS, MarketObservation } from '@/lib/data/mockDatabase';
import {
  TrendingUp,
  Search,
  Filter,
  DollarSign,
  Truck,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  MapPin,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export default function MarketsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('All');
  
  // Net realization calculator state
  const [selectedObs, setSelectedObs] = useState<MarketObservation>(INITIAL_MARKET_OBSERVATIONS[0]);
  const [freightCost, setFreightCost] = useState(12.50);
  const [handlingCommission, setHandlingCommission] = useState(4.60);

  const filteredObservations = INITIAL_MARKET_OBSERVATIONS.filter((obs) => {
    const matchesCrop = selectedCrop === 'All' || obs.cropName.toLowerCase().includes(selectedCrop.toLowerCase());
    const matchesSearch =
      obs.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obs.marketName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obs.country.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCrop && matchesSearch;
  });

  const netRealization = Math.max(0, selectedObs.price - freightCost - handlingCommission);
  const deductionPercentage = Number((( (freightCost + handlingCommission) / selectedObs.price ) * 100).toFixed(1));

  return (
    <AppShell>
      <div className="space-y-8">
        
        {/* Header & Provenance Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-7 rounded-3xl border border-[#DCE5DC] shadow-bento">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-[#1C2922]">Crop Market Prices & Intelligence</h2>
              <FreshnessBadge status="sample-historical" label="Sample Benchmarks" />
            </div>
            <p className="text-xs text-[#3D4A3B] mt-1 font-medium">
              Transparent commodity market bids with observation dates and source provenance. Complies with ADR-004 & ADR-005.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-[#EDF6ED] text-[#153D2B] px-4 py-2 rounded-full border border-[#DCE5DC] font-bold">
            <ShieldCheck className="w-4 h-4 text-[#1BC447]" />
            <span>Multi-Jurisdiction Normalized Quotes</span>
          </div>
        </div>

        {/* Search and Filters Bento Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-5 rounded-3xl border border-[#DCE5DC] shadow-bento">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#3D4A3B] absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by crop, terminal market, or region..."
              className="w-full pl-11 pr-4 py-2.5 text-xs sm:text-sm rounded-full border border-[#DCE5DC] focus:outline-hidden focus:ring-2 focus:ring-[#1BC447] text-[#1C2922] bg-[#F3FCF3]/60 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-[#3D4A3B]">Commodity:</span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="px-4 py-2 text-xs font-bold rounded-full border border-[#DCE5DC] text-[#1C2922] bg-white cursor-pointer"
            >
              <option value="All">All Commodities</option>
              <option value="Wheat">Wheat</option>
              <option value="Soybeans">Soybeans</option>
              <option value="Maize">Maize (Corn)</option>
              <option value="Rice">Rice</option>
              <option value="Tomatoes">Tomatoes</option>
            </select>
          </div>
        </div>

        {/* Main Grid: Observation Table + Net Realization Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Observation Records (7 cols Bento Card) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#DCE5DC] p-7 shadow-bento space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#1C2922]">Regional Market Observations</h3>
              <span className="text-xs text-[#3D4A3B] font-bold bg-[#EDF6ED] px-3 py-1 rounded-full border border-[#DCE5DC] tabular-nums">
                {filteredObservations.length} records available
              </span>
            </div>

            <div className="space-y-3.5">
              {filteredObservations.map((obs) => {
                const isSelected = selectedObs.id === obs.id;
                return (
                  <div
                    key={obs.id}
                    onClick={() => setSelectedObs(obs)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-smooth flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-[#1BC447] bg-[#EDF6ED]/70 shadow-xs ring-1 ring-[#1BC447]/30'
                        : 'border-[#DCE5DC] bg-[#F3FCF3]/60 hover:bg-white hover:border-[#DCE5DC]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-[#1C2922]">{obs.cropName}</h4>
                        <span className="text-[11px] text-[#3D4A3B] font-medium">({obs.variety})</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#3D4A3B]">
                        <MapPin className="w-3.5 h-3.5 text-[#153D2B]" />
                        <span className="font-medium">{obs.marketName}, {obs.location} ({obs.country})</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#3D4A3B] pt-1">
                        <Calendar className="w-3 h-3 text-[#1BC447]" />
                        <span className="font-semibold">Observed: {obs.observationDate}</span>
                        <span>• Provider: {obs.sourceName}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xl font-extrabold text-[#153D2B] font-mono tabular-nums">
                        {obs.price} {obs.currency}
                      </p>
                      <p className="text-xs text-[#3D4A3B] font-medium">per {obs.unit}</p>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        obs.priceChangePercent24h >= 0 ? 'bg-[#EDF6ED] text-[#153D2B]' : 'bg-[#BA1A1A]/10 text-[#BA1A1A]'
                      }`}>
                        {obs.priceChangePercent24h >= 0 ? `+${obs.priceChangePercent24h}%` : `${obs.priceChangePercent24h}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Farm-Gate Net Realization Engine (5 cols Bento Card) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#DCE5DC] p-7 shadow-bento space-y-6 sticky top-24">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF6ED] text-[#153D2B] text-xs font-bold border border-[#DCE5DC]">
                <Truck className="w-3.5 h-3.5 text-[#1BC447]" />
                <span>Farm-Gate Net Realization</span>
              </div>
              <h3 className="text-lg font-extrabold text-[#1C2922]">Calculate Your Real Net Price</h3>
              <p className="text-xs text-[#3D4A3B] font-medium">
                Deduct freight and terminal grading fees from wholesale quotes to find your true farm-gate income.
              </p>
            </div>

            {/* Selected Benchmark Bento (Deep Forest Anchor #153D2B) */}
            <div className="p-5 rounded-2xl bg-[#153D2B] text-white space-y-2 border border-[#1C4D37] shadow-sm">
              <span className="text-[10px] text-[#1BC447] uppercase font-extrabold tracking-wider">Active Commodity Benchmark</span>
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-sm">{selectedObs.cropName} ({selectedObs.variety})</span>
                <span className="font-mono text-lg font-black text-[#1BC447] tabular-nums">
                  {selectedObs.price} {selectedObs.currency}/{selectedObs.unit}
                </span>
              </div>
              <p className="text-[11px] text-white/70 font-medium">{selectedObs.marketName}</p>
            </div>

            {/* Deduction Inputs */}
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-bold text-[#3D4A3B] mb-1.5">
                  <span>Transport / Freight to Terminal:</span>
                  <span className="font-extrabold text-[#153D2B] tabular-nums">{freightCost} {selectedObs.currency}/{selectedObs.unit}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="0.5"
                  value={freightCost}
                  onChange={(e) => setFreightCost(Number(e.target.value))}
                  className="w-full accent-[#1BC447] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-[#3D4A3B] mb-1.5">
                  <span>Elevator Handling & Commission:</span>
                  <span className="font-extrabold text-[#153D2B] tabular-nums">{handlingCommission} {selectedObs.currency}/{selectedObs.unit}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.5"
                  value={handlingCommission}
                  onChange={(e) => setHandlingCommission(Number(e.target.value))}
                  className="w-full accent-[#1BC447] cursor-pointer"
                />
              </div>
            </div>

            {/* Net Realization Box */}
            <div className="p-6 rounded-2xl bg-[#EDF6ED] border border-[#DCE5DC] space-y-2 text-center">
              <span className="text-xs text-[#3D4A3B] font-bold uppercase tracking-wider">Estimated Net Realization at Gate:</span>
              <p className="text-3xl font-black text-[#153D2B] font-mono tabular-nums">
                {netRealization.toFixed(2)} {selectedObs.currency}
              </p>
              <p className="text-xs text-[#3D4A3B] font-medium">
                per {selectedObs.unit} (<span className="tabular-nums font-bold">{deductionPercentage}%</span> logistics deduction)
              </p>
            </div>

            <div className="p-3.5 bg-[#F3FCF3] rounded-2xl border border-[#DCE5DC] text-[11px] text-[#3D4A3B] leading-relaxed font-medium">
              <strong>Notice (ADR-004):</strong> Market prices vary by moisture grade and dockage. Use this calculation as an objective guideline when selling to local elevators.
            </div>

          </div>

        </div>

      </div>
    </AppShell>
  );
}
