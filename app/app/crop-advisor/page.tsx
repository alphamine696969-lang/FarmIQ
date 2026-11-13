'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FreshnessBadge } from '@/components/ui/Badge';
import { CROP_SUITABILITY_DB, CropSuitabilityProfile, APPROVED_SOURCES } from '@/lib/data/mockDatabase';
import {
  Compass,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Droplets,
  Thermometer,
  Layers
} from 'lucide-react';

export default function CropAdvisorPage() {
  const [selectedSoilType, setSelectedSoilType] = useState('Loam');
  const [soilPh, setSoilPh] = useState(6.5);
  const [expectedRainfall, setExpectedRainfall] = useState(550);
  const [avgTemp, setAvgTemp] = useState(21);

  // Compute suitability match for each crop
  const scoredCrops = CROP_SUITABILITY_DB.map((crop) => {
    let score = 100;

    // pH match
    if (soilPh < crop.minPh || soilPh > crop.maxPh) {
      score -= 35;
    } else if (soilPh >= crop.minPh && soilPh <= crop.maxPh) {
      score += 5;
    }

    // Temperature match
    if (avgTemp < crop.minTempC || avgTemp > crop.maxTempC) {
      score -= 30;
    }

    // Rainfall match
    if (expectedRainfall < crop.minRainfallMm || expectedRainfall > crop.maxRainfallMm) {
      score -= 20;
    }

    // Soil type check
    const soilMatch = crop.suitableSoilTypes.some((st) =>
      st.toLowerCase().includes(selectedSoilType.toLowerCase()) ||
      selectedSoilType.toLowerCase().includes(st.toLowerCase())
    );
    if (!soilMatch) {
      score -= 15;
    }

    const clampedScore = Math.max(20, Math.min(98, score));
    const citation = APPROVED_SOURCES.find((s) => s.id === crop.scientificReferenceId);

    return {
      ...crop,
      calculatedMatchScore: clampedScore,
      citation,
    };
  }).sort((a, b) => b.calculatedMatchScore - a.calculatedMatchScore);

  return (
    <AppShell>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-7 rounded-3xl border border-[#DCE5DC] shadow-bento">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-[#1C2922]">Crop Suitability & Agro-Ecological Advisor</h2>
              <FreshnessBadge status="supported" label="Evidence Grounded (FIQ-071)" />
            </div>
            <p className="text-xs text-[#3D4A3B] mt-1 font-medium">
              Evaluates soil pH, temperature thresholds, and seasonal rainfall against FAO and CGIAR agronomic datasets.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-[#EDF6ED] text-[#153D2B] px-4 py-2 rounded-full border border-[#DCE5DC] font-bold">
            <ShieldCheck className="w-4 h-4 text-[#1BC447]" />
            <span>Scientific Phenology Rules</span>
          </div>
        </div>

        {/* Filters and Sliders Bento Grid */}
        <div className="bg-white rounded-3xl border border-[#DCE5DC] p-7 shadow-bento space-y-6">
          <div className="flex items-center gap-2.5 border-b border-[#DCE5DC] pb-3.5">
            <div className="w-8 h-8 rounded-xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
              <Sliders className="w-4 h-4 text-[#1BC447]" />
            </div>
            <h3 className="text-base font-extrabold text-[#1C2922]">Configure Your Plot Agro-Parameters</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            
            {/* Soil Type */}
            <div>
              <label className="block font-bold text-[#3D4A3B] mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#1BC447]" />
                <span>Soil Texture</span>
              </label>
              <select
                value={selectedSoilType}
                onChange={(e) => setSelectedSoilType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3]/60 cursor-pointer font-medium focus:ring-2 focus:ring-[#1BC447]"
              >
                <option value="Loam">Loam (Balanced)</option>
                <option value="Clay Loam">Clay Loam (Heavy water holding)</option>
                <option value="Sandy Loam">Sandy Loam (Rapid drainage)</option>
                <option value="Silt Loam">Silt Loam (Fertile alluvial)</option>
                <option value="Black Soil">Black Cotton Soil (Vertisol)</option>
              </select>
            </div>

            {/* Soil pH */}
            <div>
              <div className="flex justify-between font-bold text-[#3D4A3B] mb-1.5">
                <span>Soil pH Level:</span>
                <span className="text-[#153D2B] font-extrabold tabular-nums">{soilPh}</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="8.5"
                step="0.1"
                value={soilPh}
                onChange={(e) => setSoilPh(Number(e.target.value))}
                className="w-full accent-[#1BC447] cursor-pointer"
              />
              <span className="text-[10px] text-[#3D4A3B] font-semibold">
                {soilPh < 6.0 ? 'Acidic' : soilPh > 7.5 ? 'Alkaline' : 'Near Neutral (Ideal)'}
              </span>
            </div>

            {/* Rainfall */}
            <div>
              <div className="flex justify-between font-bold text-[#3D4A3B] mb-1.5">
                <span>Expected Season Moisture:</span>
                <span className="text-[#153D2B] font-extrabold tabular-nums">{expectedRainfall} mm</span>
              </div>
              <input
                type="range"
                min="200"
                max="1200"
                step="25"
                value={expectedRainfall}
                onChange={(e) => setExpectedRainfall(Number(e.target.value))}
                className="w-full accent-[#1BC447] cursor-pointer"
              />
              <span className="text-[10px] text-[#3D4A3B] font-semibold">Rainfall & Irrigation aggregate</span>
            </div>

            {/* Average Temperature */}
            <div>
              <div className="flex justify-between font-bold text-[#3D4A3B] mb-1.5">
                <span>Avg Growth Temperature:</span>
                <span className="text-[#153D2B] font-extrabold tabular-nums">{avgTemp}°C</span>
              </div>
              <input
                type="range"
                min="10"
                max="38"
                step="1"
                value={avgTemp}
                onChange={(e) => setAvgTemp(Number(e.target.value))}
                className="w-full accent-[#1BC447] cursor-pointer"
              />
              <span className="text-[10px] text-[#3D4A3B] font-semibold">Mean seasonal day temp</span>
            </div>

          </div>
        </div>

        {/* Results Bento List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-[#1C2922]">Ranked Crop Suitability Analysis</h3>
            <span className="text-xs font-bold text-[#3D4A3B] bg-[#EDF6ED] px-3.5 py-1 rounded-full border border-[#DCE5DC] tabular-nums">
              Showing {scoredCrops.length} candidate crops
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scoredCrops.map((crop) => {
              const isHighMatch = crop.calculatedMatchScore >= 80;
              const isModerate = crop.calculatedMatchScore >= 60 && crop.calculatedMatchScore < 80;

              return (
                <div
                  key={crop.cropName}
                  className="bg-white rounded-3xl border border-[#DCE5DC] p-7 shadow-bento space-y-4 hover:shadow-bento-hover hover:border-[#1BC447]/50 transition-smooth flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-extrabold text-[#1C2922]">{crop.cropName}</h4>
                          <span className="text-[11px] text-[#3D4A3B] font-semibold">({crop.category})</span>
                        </div>
                        <p className="text-xs text-[#3D4A3B] font-medium">Cycle: {crop.growthCycleDays} days • Yield potential: {crop.potentialYieldPerAcre}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-extrabold font-mono tabular-nums ${
                          isHighMatch ? 'bg-[#EDF6ED] text-[#153D2B] border border-[#DCE5DC]' :
                          isModerate ? 'bg-[#FFF6EB] text-[#895100] border border-[#FFE0B2]' :
                          'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}>
                          {crop.calculatedMatchScore}% Match
                        </span>
                      </div>
                    </div>

                    {/* Agronomic specs grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#F3FCF3] p-4 rounded-2xl border border-[#DCE5DC]">
                      <div>
                        <span className="text-[#3D4A3B] font-medium">Optimal Temp:</span>
                        <p className="font-extrabold text-[#1C2922]">{crop.optimalTempC}</p>
                      </div>
                      <div>
                        <span className="text-[#3D4A3B] font-medium">Optimal pH:</span>
                        <p className="font-extrabold text-[#1C2922]">{crop.optimalPh}</p>
                      </div>
                      <div>
                        <span className="text-[#3D4A3B] font-medium">Moisture Demand:</span>
                        <p className="font-extrabold text-[#1C2922] tabular-nums">{crop.minRainfallMm} - {crop.maxRainfallMm} mm</p>
                      </div>
                      <div>
                        <span className="text-[#3D4A3B] font-medium">Stress Resilience:</span>
                        <p className="font-extrabold text-[#153D2B] tabular-nums">{crop.resilienceScore}/10 Score</p>
                      </div>
                    </div>

                    {/* Agronomic Advice */}
                    <p className="text-xs text-[#3D4A3B] leading-relaxed font-medium">
                      <strong className="text-[#1C2922]">Agronomic Guidance:</strong> {crop.keyAgronomicAdvice}
                    </p>
                  </div>

                  {/* Citation Footer */}
                  {crop.citation && (
                    <div className="pt-3.5 border-t border-[#DCE5DC] flex items-center justify-between text-[11px] text-[#3D4A3B]">
                      <span className="truncate max-w-[280px] font-medium">
                        Ref: {crop.citation.sourceName}
                      </span>
                      <a
                        href={crop.citation.canonicalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#153D2B] font-bold hover:text-[#1BC447] underline shrink-0"
                      >
                        Source
                      </a>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
