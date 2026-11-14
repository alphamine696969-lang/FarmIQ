'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sprout,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Calculator,
  Bot,
  CloudSun,
  ScanLine,
  Compass,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  BarChart3,
  Layers,
  Globe2,
  Lock,
  FileCheck
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FreshnessBadge } from '@/components/ui/Badge';
import { calculateFarmProfit } from '@/lib/calculations/profit';

export default function HomePage() {
  // Mini interactive calculator preview on landing page
  const [demoArea, setDemoArea] = useState(25);
  const [demoYield, setDemoYield] = useState(2.2);
  const [demoPrice, setDemoPrice] = useState(260);

  const demoResult = calculateFarmProfit({
    cropName: 'Hard Red Winter Wheat',
    areaValue: demoArea,
    areaUnit: 'acre',
    expectedYieldPerUnitArea: demoYield,
    yieldUnit: 'tonnes',
    expectedPricePerYieldUnit: demoPrice,
    currency: 'USD',
    costs: {
      seeds: demoArea * 65,
      fertilizers: demoArea * 95,
      cropProtection: demoArea * 35,
      labor: demoArea * 70,
      irrigation: demoArea * 25,
      machineryFuel: demoArea * 60,
      landRent: demoArea * 80,
      miscellaneous: demoArea * 20,
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F3FCF3] text-[#1C2922]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-[#DCE5DC]">
        {/* Luminous ambient accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-40">
          <div className="absolute -top-24 left-1/4 w-96 h-96 bg-[#1BC447]/25 rounded-full blur-3xl" />
          <div className="absolute top-32 right-10 w-96 h-96 bg-[#33B3FC]/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EDF6ED] text-[#153D2B] text-xs sm:text-sm font-bold shadow-xs border border-[#DCE5DC]">
              <Sparkles className="w-4 h-4 text-[#1BC447]" />
              <span>Grow Smarter. Earn Better. — Precision Agronomy System</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#153D2B] tracking-tight leading-[1.15]">
              Know Your Farm. <br />
              <span className="text-[#1BC447]">Grow Your Future.</span>
            </h1>

            {/* Supporting text */}
            <p className="text-lg sm:text-xl text-[#3D4A3B] leading-relaxed max-w-2xl mx-auto font-medium">
              From crop diseases and unpredictable weather to market prices and farm profits, FarmIQ brings trusted agricultural intelligence together in one powerful platform.
            </p>

            {/* Pill Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/app"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#1BC447] hover:bg-[#16a73c] text-[#1C2922] font-extrabold text-sm sm:text-base shadow-glow-lime hover:-translate-y-0.5 transition-smooth inline-flex items-center justify-center gap-2.5 group"
              >
                <span>Explore FarmIQ</span>
                <ArrowRight className="w-4 h-4 text-[#1C2922] group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/how-it-works"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white hover:bg-[#EDF6ED] text-[#1C2922] font-bold text-sm sm:text-base border border-[#DCE5DC] shadow-xs transition-smooth inline-flex items-center justify-center gap-2"
              >
                <span>See How It Works</span>
                <ChevronRight className="w-4 h-4 text-[#3D4A3B]" />
              </Link>
            </div>

            {/* Trust Contract highlight pills */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-[#153D2B]">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF6ED] border border-[#DCE5DC]">
                <CheckCircle2 className="w-4 h-4 text-[#1BC447]" />
                No Invented Market Prices
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF6ED] border border-[#DCE5DC]">
                <CheckCircle2 className="w-4 h-4 text-[#1BC447]" />
                Evidence-Grounded RAG
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF6ED] border border-[#DCE5DC]">
                <CheckCircle2 className="w-4 h-4 text-[#1BC447]" />
                Verified FAO & USDA Sources
              </span>
            </div>

          </div>

          {/* Interactive Live Preview Bento Card */}
          <div className="mt-14 max-w-5xl mx-auto bg-white border border-[#DCE5DC] rounded-3xl shadow-bento overflow-hidden">
            <div className="bg-[#153D2B] px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1BC447] animate-pulse" />
                <span className="text-sm font-extrabold tracking-wide">Interactive Farm Economics Telemetry</span>
                <FreshnessBadge status="sample-historical" label="Sample Model • Verified Math" />
              </div>
              <Link
                href="/app/profit"
                className="text-xs font-bold text-[#1BC447] hover:underline flex items-center gap-1"
              >
                <span>Open Full Engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Interactive Controls */}
              <div className="lg:col-span-5 space-y-5">
                <h3 className="text-base font-extrabold text-[#1C2922]">Adjust Quick Scenario Parameters:</h3>
                
                <div>
                  <div className="flex justify-between text-xs font-bold text-[#3D4A3B] mb-1.5">
                    <span>Cultivated Area:</span>
                    <span className="text-[#153D2B] font-extrabold tabular-nums">{demoArea} Acres</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={demoArea}
                    onChange={(e) => setDemoArea(Number(e.target.value))}
                    className="w-full accent-[#1BC447] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-[#3D4A3B] mb-1.5">
                    <span>Expected Yield (Tonnes / Acre):</span>
                    <span className="text-[#153D2B] font-extrabold tabular-nums">{demoYield} MT</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="6.0"
                    step="0.1"
                    value={demoYield}
                    onChange={(e) => setDemoYield(Number(e.target.value))}
                    className="w-full accent-[#1BC447] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-[#3D4A3B] mb-1.5">
                    <span>Market Selling Price ($ / MT):</span>
                    <span className="text-[#153D2B] font-extrabold tabular-nums">${demoPrice}</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="450"
                    step="5"
                    value={demoPrice}
                    onChange={(e) => setDemoPrice(Number(e.target.value))}
                    className="w-full accent-[#1BC447] cursor-pointer"
                  />
                </div>

                <div className="p-3.5 bg-[#EDF6ED] rounded-2xl border border-[#DCE5DC] text-xs text-[#3D4A3B] font-medium">
                  Instant deterministic calculations: gross revenue, total inputs, break-even yields, and net margins.
                </div>
              </div>

              {/* Instant Results Output Bento Sub-Grid */}
              <div className="lg:col-span-7 bg-[#F3FCF3] rounded-2xl p-6 border border-[#DCE5DC] grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-[#DCE5DC] shadow-xs">
                  <p className="text-[11px] text-[#3D4A3B] font-bold uppercase tracking-wider">Total Output</p>
                  <p className="text-xl font-extrabold text-[#1C2922] mt-1 tabular-nums">{demoResult.totalProduction} MT</p>
                  <span className="text-[10px] text-[#3D4A3B] font-semibold">{demoArea} acres</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#DCE5DC] shadow-xs">
                  <p className="text-[11px] text-[#3D4A3B] font-bold uppercase tracking-wider">Gross Revenue</p>
                  <p className="text-xl font-extrabold text-[#153D2B] mt-1 tabular-nums">${demoResult.grossRevenue.toLocaleString()}</p>
                  <span className="text-[10px] text-[#3D4A3B] font-semibold">at ${demoPrice}/MT</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#DCE5DC] shadow-xs">
                  <p className="text-[11px] text-[#3D4A3B] font-bold uppercase tracking-wider">Operating Cost</p>
                  <p className="text-xl font-extrabold text-[#1C2922] mt-1 tabular-nums">${demoResult.totalCost.toLocaleString()}</p>
                  <span className="text-[10px] text-[#3D4A3B] font-semibold">${demoResult.costPerUnitArea}/acre</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#1BC447]/50 shadow-xs col-span-2 sm:col-span-1">
                  <p className="text-[11px] text-[#153D2B] font-extrabold uppercase tracking-wider">Net Profit</p>
                  <p className="text-2xl font-black text-[#153D2B] mt-1 tabular-nums">${demoResult.netProfit.toLocaleString()}</p>
                  <span className="text-[10px] font-bold text-[#153D2B] bg-[#EDF6ED] px-2 py-0.5 rounded-full border border-[#DCE5DC]">
                    {demoResult.marginPercentage}% margin
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#DCE5DC] shadow-xs">
                  <p className="text-[11px] text-[#3D4A3B] font-bold uppercase tracking-wider">Break-Even</p>
                  <p className="text-xl font-extrabold text-[#1C2922] mt-1 tabular-nums">{demoResult.breakEvenYieldPerUnitArea} MT</p>
                  <span className="text-[10px] text-[#3D4A3B] font-semibold">per acre</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#DCE5DC] shadow-xs">
                  <p className="text-[11px] text-[#3D4A3B] font-bold uppercase tracking-wider">Net ROI</p>
                  <p className="text-xl font-extrabold text-[#153D2B] mt-1 tabular-nums">{demoResult.roiPercentage}%</p>
                  <span className="text-[10px] text-[#153D2B] font-bold">Capital Return</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Market Ticker Bar (Deep Forest Anchor #153D2B) */}
      <section className="bg-[#153D2B] py-3.5 border-y border-[#1C4D37] text-white text-xs overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <TrendingUp className="w-4 h-4 text-[#1BC447]" />
            <span className="font-extrabold text-[#1BC447] uppercase tracking-wider text-[11px]">Commodity Telemetry:</span>
          </div>
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1">
            {['Official prices by region — live from the source', 'EU producer prices via Eurostat (latest published period)', 'No sample or simulated prices, ever'].map((item) => (
              <div key={item} className="flex items-center gap-2 shrink-0 text-white/90">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1BC447] shrink-0" />
                <span className="font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seven Core Capabilities Bento Grid */}
      <section className="py-20 bg-[#F3FCF3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#153D2B] bg-[#EDF6ED] px-3.5 py-1 rounded-full border border-[#DCE5DC]">
              Integrated Agronomic Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#153D2B]">Seven Specialized Precision Engines</h2>
            <p className="text-base text-[#3D4A3B] font-medium">
              Every tool is engineered around evidentiary traceability, deterministic safety, and real-world farm usability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Pillar 1 */}
            <div className="bg-white p-7 rounded-3xl border border-[#DCE5DC] shadow-bento hover:shadow-bento-hover hover:border-[#1BC447]/50 transition-smooth flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                  <Bot className="w-6 h-6 text-[#1BC447]" />
                </div>
                <h3 className="text-lg font-extrabold text-[#1C2922]">AI Agricultural Assistant</h3>
                <p className="text-sm text-[#3D4A3B] leading-relaxed">
                  Ask agronomic questions grounded in approved agricultural research. Transparently cites FAO, USDA, and ICAR references with safety gates.
                </p>
              </div>
              <div className="pt-6 border-t border-[#DCE5DC] mt-6 flex items-center justify-between">
                <span className="text-xs text-[#153D2B] font-bold">Grounded RAG Pipeline</span>
                <Link href="/app/assistant" className="text-xs font-extrabold text-[#153D2B] hover:text-[#1BC447] flex items-center gap-1">
                  Try Chat <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white p-7 rounded-3xl border border-[#DCE5DC] shadow-bento hover:shadow-bento-hover hover:border-[#1BC447]/50 transition-smooth flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                  <TrendingUp className="w-6 h-6 text-[#1BC447]" />
                </div>
                <h3 className="text-lg font-extrabold text-[#1C2922]">Market Prices & Comparisons</h3>
                <p className="text-sm text-[#3D4A3B] leading-relaxed">
                  Track regional wholesale market prices across commodities. Multi-currency and multi-unit conversions with clear provenance and freshness timestamps.
                </p>
              </div>
              <div className="pt-6 border-t border-[#DCE5DC] mt-6 flex items-center justify-between">
                <span className="text-xs text-[#153D2B] font-bold">Net Realization Analysis</span>
                <Link href="/app/markets" className="text-xs font-extrabold text-[#153D2B] hover:text-[#1BC447] flex items-center gap-1">
                  View Markets <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white p-7 rounded-3xl border border-[#DCE5DC] shadow-bento hover:shadow-bento-hover hover:border-[#1BC447]/50 transition-smooth flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                  <Calculator className="w-6 h-6 text-[#1BC447]" />
                </div>
                <h3 className="text-lg font-extrabold text-[#1C2922]">Profit & Break-Even Calculator</h3>
                <p className="text-sm text-[#3D4A3B] leading-relaxed">
                  Model complete crop budgets including seeds, fertilizers, labor, and irrigation. Calculate break-even yields and save comparative scenarios.
                </p>
              </div>
              <div className="pt-6 border-t border-[#DCE5DC] mt-6 flex items-center justify-between">
                <span className="text-xs text-[#153D2B] font-bold">Deterministic Financials</span>
                <Link href="/app/profit" className="text-xs font-extrabold text-[#153D2B] hover:text-[#1BC447] flex items-center gap-1">
                  Calculate <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="bg-white p-7 rounded-3xl border border-[#DCE5DC] shadow-bento hover:shadow-bento-hover hover:border-[#1BC447]/50 transition-smooth flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                  <Compass className="w-6 h-6 text-[#1BC447]" />
                </div>
                <h3 className="text-lg font-extrabold text-[#1C2922]">Crop Suitability Advisor</h3>
                <p className="text-sm text-[#3D4A3B] leading-relaxed">
                  Match your specific soil type, pH range, and rainfall expectations to resilient crop varieties based on validated agronomic parameters.
                </p>
              </div>
              <div className="pt-6 border-t border-[#DCE5DC] mt-6 flex items-center justify-between">
                <span className="text-xs text-[#153D2B] font-bold">Soil & Climate Matching</span>
                <Link href="/app/crop-advisor" className="text-xs font-extrabold text-[#153D2B] hover:text-[#1BC447] flex items-center gap-1">
                  Explore Crops <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Pillar 5 */}
            <div className="bg-white p-7 rounded-3xl border border-[#DCE5DC] shadow-bento hover:shadow-bento-hover hover:border-[#1BC447]/50 transition-smooth flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                  <ScanLine className="w-6 h-6 text-[#1BC447]" />
                </div>
                <h3 className="text-lg font-extrabold text-[#1C2922]">Disease & Symptom Scanner</h3>
                <p className="text-sm text-[#3D4A3B] leading-relaxed">
                  Upload leaf symptoms for candidate pathogen assessment. Transparent cultural management guidelines with strict safety disclaimers.
                </p>
              </div>
              <div className="pt-6 border-t border-[#DCE5DC] mt-6 flex items-center justify-between">
                <span className="text-xs text-[#153D2B] font-bold">Safe IPM Guidance</span>
                <Link href="/app/disease" className="text-xs font-extrabold text-[#153D2B] hover:text-[#1BC447] flex items-center gap-1">
                  Scan Leaf <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Pillar 6 */}
            <div className="bg-white p-7 rounded-3xl border border-[#DCE5DC] shadow-bento hover:shadow-bento-hover hover:border-[#1BC447]/50 transition-smooth flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                  <CloudSun className="w-6 h-6 text-[#1BC447]" />
                </div>
                <h3 className="text-lg font-extrabold text-[#1C2922]">Agro-Meteorological Weather</h3>
                <p className="text-sm text-[#3D4A3B] leading-relaxed">
                  Localized agricultural forecasts with calculated optimal spraying windows, evapotranspiration rates (ET0), and critical frost/heat alerts.
                </p>
              </div>
              <div className="pt-6 border-t border-[#DCE5DC] mt-6 flex items-center justify-between">
                <span className="text-xs text-[#153D2B] font-bold">Hydrological & Frost Feeds</span>
                <Link href="/app/weather" className="text-xs font-extrabold text-[#153D2B] hover:text-[#1BC447] flex items-center gap-1">
                  Check Weather <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Pillar 7 Bento Wide Card */}
            <div className="bg-[#153D2B] text-white p-8 rounded-3xl border border-[#1C4D37] shadow-floating md:col-span-2 lg:col-span-3 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#1BC447] bg-[#0E281C] px-3.5 py-1 rounded-full border border-[#1C4D37]">
                  <Layers className="w-4 h-4" />
                  <span>Pillar 7 — Multi-Holding Spatial Governance</span>
                </div>
                <h3 className="text-2xl font-extrabold text-white">Manage Multiple Holdings Across Global Jurisdictions</h3>
                <p className="text-sm text-white/80 max-w-2xl leading-relaxed">
                  Support separate plots with distinct soil types, pH measurements, irrigation systems, and active crop cycles. Switch seamlessly between Metric and Imperial telemetry.
                </p>
              </div>
              <Link
                href="/app/farms"
                className="shrink-0 px-8 py-3.5 rounded-full bg-[#1BC447] hover:bg-[#16a73c] text-[#1C2922] font-extrabold text-xs shadow-glow-lime transition-smooth"
              >
                Manage My Holdings
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Product Trust Contract Bento Grid */}
      <section className="py-20 bg-white border-t border-[#DCE5DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#153D2B] bg-[#EDF6ED] px-3.5 py-1 rounded-full border border-[#DCE5DC]">
              Our Operating Standard
            </span>
            <h2 className="text-3xl font-extrabold text-[#153D2B]">The FarmIQ Product Trust Contract</h2>
            <p className="text-[#3D4A3B] text-sm sm:text-base font-medium">
              Why precision agricultural operators rely on FarmIQ over generic conversational AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#F3FCF3] p-6 rounded-3xl border border-[#DCE5DC] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                <FileCheck className="w-5 h-5 text-[#1BC447]" />
              </div>
              <h3 className="font-extrabold text-[#1C2922] text-base">Traceable Provenance</h3>
              <p className="text-xs text-[#3D4A3B] leading-relaxed">
                Every data-driven feature exposes where its data originated, publication timestamps, and official publication URLs.
              </p>
            </div>

            <div className="bg-[#F3FCF3] p-6 rounded-3xl border border-[#DCE5DC] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                <ShieldCheck className="w-5 h-5 text-[#1BC447]" />
              </div>
              <h3 className="font-extrabold text-[#1C2922] text-base">Pesticide Safety Gates</h3>
              <p className="text-xs text-[#3D4A3B] leading-relaxed">
                No arbitrary chemical dosages. We abstain from treatment dosages unless backed by verified jurisdiction-specific labels (ADR-006).
              </p>
            </div>

            <div className="bg-[#F3FCF3] p-6 rounded-3xl border border-[#DCE5DC] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                <BarChart3 className="w-5 h-5 text-[#1BC447]" />
              </div>
              <h3 className="font-extrabold text-[#1C2922] text-base">Explicit Data Freshness</h3>
              <p className="text-xs text-[#3D4A3B] leading-relaxed">
                We clearly label Live, Cached, Stale, and Sample records (ADR-005). We never present demo data as live market reality.
              </p>
            </div>

            <div className="bg-[#F3FCF3] p-6 rounded-3xl border border-[#DCE5DC] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
                <Lock className="w-5 h-5 text-[#1BC447]" />
              </div>
              <h3 className="font-extrabold text-[#1C2922] text-base">Farmer Data Privacy</h3>
              <p className="text-xs text-[#3D4A3B] leading-relaxed">
                Your farm acreage, yield forecasts, and financial budgets remain private to your account. We never sell farmer data.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/sources"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#153D2B] hover:text-[#1BC447] transition-colors"
            >
              <span>Explore our Approved Agricultural Source Registry & Governance</span>
              <ArrowRight className="w-4 h-4 text-[#1BC447]" />
            </Link>
          </div>
        </div>
      </section>

      {/* Global Impact CTA Banner */}
      <section className="py-20 bg-[#153D2B] text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-[#1BC447] text-[#1C2922] flex items-center justify-center mx-auto shadow-glow-lime">
            <Sprout className="w-8 h-8" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Make Evidence-Informed Farm Decisions?
          </h2>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Experience the dedicated workspace built for modern farmers, agricultural consultants, and agribusiness leaders.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app"
              className="px-8 py-4 rounded-full bg-[#1BC447] hover:bg-[#16a73c] text-[#1C2922] font-extrabold text-base shadow-glow-lime transition-smooth inline-flex items-center gap-2"
            >
              <span>Launch FarmIQ Workspace</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/sources"
              className="px-7 py-4 rounded-full border border-white/20 hover:bg-white/10 text-white font-bold text-base transition-colors"
            >
              Review Source Catalog
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
