import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Bot,
  TrendingUp,
  Calculator,
  Compass,
  ScanLine,
  CloudSun,
  Home,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Database,
  Sliders,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F3FCF3] text-[#1C2922]">
      <Navbar />

      {/* Hero Header (Deep Forest Green #153D2B) */}
      <div className="bg-[#153D2B] text-white py-16 border-b border-[#1C4D37]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0E281C] text-[#1BC447] text-xs font-bold border border-[#1C4D37]">
            <ShieldCheck className="w-4 h-4 text-[#1BC447]" />
            <span>Built on FarmIQ Evidence Standards</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Platform Capabilities & Architectural Depth
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Explore the seven purpose-built engines designed to help farmers eliminate guesswork and make financially viable agronomic decisions.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        
        {/* Capability 1: AI Assistant */}
        <section className="bg-white rounded-3xl border border-[#DCE5DC] p-8 sm:p-10 shadow-bento grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#153D2B] bg-[#EDF6ED] px-3.5 py-1.5 rounded-full border border-[#DCE5DC]">
              <Bot className="w-4 h-4 text-[#1BC447]" />
              <span>Grounded Knowledge Assistant</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#1C2922]">AI Grounded in Peer-Reviewed Agricultural Science</h2>
            <p className="text-[#3D4A3B] text-sm sm:text-base leading-relaxed font-medium">
              Unlike generic conversational models that hallucinate chemical recommendations, FarmIQ queries an approved repository of extension guides, FAO treatises, and research publications. Every response provides clickable source links, publication dates, and explicit disclosures of evidence limitations.
            </p>
            <ul className="space-y-2 text-sm text-[#1C2922]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1BC447] shrink-0" />
                <span className="font-medium">Strict abstention when reference documents lack sufficient proof</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1BC447] shrink-0" />
                <span className="font-medium">Automatic safety gates against unverified pesticide dosages (ADR-006)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1BC447] shrink-0" />
                <span className="font-medium">Multilingual reasoning with scientific terminology consistency</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link href="/app/assistant" className="inline-flex items-center gap-2 text-xs font-extrabold text-[#153D2B] hover:text-[#1BC447] bg-[#EDF6ED] px-5 py-2.5 rounded-full border border-[#DCE5DC] transition-smooth">
                Launch AI Assistant <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 bg-[#F3FCF3] p-6 rounded-2xl border border-[#DCE5DC] text-xs space-y-3 font-mono">
            <div className="text-[#153D2B] font-extrabold uppercase text-[10px] tracking-wider">RAG Verification Pipeline</div>
            <div className="p-3 bg-white rounded-xl border border-[#DCE5DC] text-[#1C2922] font-semibold">1. Input Query & Scope Filtering</div>
            <div className="p-3 bg-white rounded-xl border border-[#DCE5DC] text-[#1C2922] font-semibold">2. Vector & Semantic Ingestion Search</div>
            <div className="p-3 bg-white rounded-xl border border-[#DCE5DC] text-[#1C2922] font-semibold">3. Citation Identifier Validation</div>
            <div className="p-3 bg-[#EDF6ED] rounded-xl border border-[#DCE5DC] text-[#153D2B] font-bold">4. Verified Output + Limitation Disclosures</div>
          </div>
        </section>

        {/* Capability 2: Market Intelligence */}
        <section className="bg-white rounded-3xl border border-[#DCE5DC] p-8 sm:p-10 shadow-bento grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 bg-[#F3FCF3] p-6 rounded-2xl border border-[#DCE5DC] text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1C2922]">Commodity Observation Model</span>
              <span className="bg-[#FFF6EB] text-[#895100] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-[#FFE0B2]">Honest Freshness</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#DCE5DC] space-y-1 shadow-xs">
              <div className="flex justify-between font-extrabold text-[#1C2922]">
                <span>Hard Red Winter Wheat</span>
                <span className="font-mono text-[#153D2B] tabular-nums">$245.50 / MT</span>
              </div>
              <div className="text-[11px] text-[#3D4A3B]">Chicago Board & Midwest Terminal • 2026-10-10</div>
              <div className="text-[10px] text-[#153D2B] font-bold">Net realization after freight: $228.40/MT</div>
            </div>
            <div className="text-[11px] text-[#3D4A3B] italic font-medium">
              "Never present demo data as live. All external provider observations must store provenance and units."
            </div>
          </div>
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#153D2B] bg-[#EDF6ED] px-3.5 py-1.5 rounded-full border border-[#DCE5DC]">
              <TrendingUp className="w-4 h-4 text-[#1BC447]" />
              <span>Transparent Price Intelligence</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#1C2922]">Market Prices, Basis & Historical Trends</h2>
            <p className="text-[#3D4A3B] text-sm sm:text-base leading-relaxed font-medium">
              Compare regional market bids with global benchmarks. FarmIQ lets you normalize currency (USD, EUR, INR, KES, BRL) and units (Metric Tonnes, Bushels, Quintals, 90kg Bags) so you understand your real net realization at the farm gate.
            </p>
            <ul className="space-y-2 text-sm text-[#1C2922]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1BC447] shrink-0" />
                <span className="font-medium">Clear observation dates and source provider identification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1BC447] shrink-0" />
                <span className="font-medium">Net farm-gate realization calculation deducting transportation costs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1BC447] shrink-0" />
                <span className="font-medium">Explicit visual badges for Live vs Sample-Historical records</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link href="/app/markets" className="inline-flex items-center gap-2 text-xs font-extrabold text-[#153D2B] hover:text-[#1BC447] bg-[#EDF6ED] px-5 py-2.5 rounded-full border border-[#DCE5DC] transition-smooth">
                Explore Market Engine <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Capability 3: Profit Calculator */}
        <section className="bg-white rounded-3xl border border-[#DCE5DC] p-8 sm:p-10 shadow-bento grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#153D2B] bg-[#EDF6ED] px-3.5 py-1.5 rounded-full border border-[#DCE5DC]">
              <Calculator className="w-4 h-4 text-[#1BC447]" />
              <span>Deterministic Farm Economics</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#1C2922]">Deterministic Farm Profit & Break-Even Engine</h2>
            <p className="text-[#3D4A3B] text-sm sm:text-base leading-relaxed font-medium">
              Never gamble on seasonal crop profitability. Enter seed, fertilizer, labor, irrigation, and land expenses to see your break-even yield per acre and minimum viable selling price. Save multiple crop scenarios to compare potential returns before planting.
            </p>
            <ul className="space-y-2 text-sm text-[#1C2922]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1BC447] shrink-0" />
                <span className="font-medium">Mathematical precision without arbitrary AI hallucinations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1BC447] shrink-0" />
                <span className="font-medium">Instant ROI %, net margin %, and cost per acre breakdown</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1BC447] shrink-0" />
                <span className="font-medium">Save and load unlimited scenarios privately in your farm profile</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link href="/app/profit" className="inline-flex items-center gap-2 text-xs font-extrabold text-[#153D2B] hover:text-[#1BC447] bg-[#EDF6ED] px-5 py-2.5 rounded-full border border-[#DCE5DC] transition-smooth">
                Open Profit Engine <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 bg-[#F3FCF3] p-6 rounded-2xl border border-[#DCE5DC] text-xs space-y-3">
            <div className="font-extrabold text-[#1C2922]">Key Calculated Indicators</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-[#DCE5DC] shadow-xs">
                <span className="text-[11px] text-[#3D4A3B] font-medium">Break-Even Yield</span>
                <p className="font-extrabold text-[#153D2B] text-sm mt-0.5">Total Cost ÷ (Area × Price)</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#DCE5DC] shadow-xs">
                <span className="text-[11px] text-[#3D4A3B] font-medium">Break-Even Price</span>
                <p className="font-extrabold text-[#153D2B] text-sm mt-0.5">Total Cost ÷ Output</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#DCE5DC] shadow-xs">
                <span className="text-[11px] text-[#3D4A3B] font-medium">Net Margin</span>
                <p className="font-extrabold text-[#153D2B] text-sm mt-0.5">(Net Profit ÷ Revenue) %</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#DCE5DC] shadow-xs">
                <span className="text-[11px] text-[#3D4A3B] font-medium">Return on Capital</span>
                <p className="font-extrabold text-[#153D2B] text-sm mt-0.5">(Net Profit ÷ Cost) %</p>
              </div>
            </div>
          </div>
        </section>

        {/* Capability 4 & 5: Crop Advisor & Disease Scanner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-[#DCE5DC] shadow-bento space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
              <Compass className="w-6 h-6 text-[#1BC447]" />
            </div>
            <h3 className="text-xl font-extrabold text-[#1C2922]">Crop Suitability Advisor</h3>
            <p className="text-sm text-[#3D4A3B] leading-relaxed font-medium">
              Match soil pH, temperature range, and seasonal moisture to resilient crop varieties. Identifies critical growth stages and rotational benefits.
            </p>
            <Link href="/app/crop-advisor" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#153D2B] hover:text-[#1BC447]">
              Run Suitability Assessment <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-[#DCE5DC] shadow-bento space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
              <ScanLine className="w-6 h-6 text-[#1BC447]" />
            </div>
            <h3 className="text-xl font-extrabold text-[#1C2922]">Disease & Symptom Scanner</h3>
            <p className="text-sm text-[#3D4A3B] leading-relaxed font-medium">
              Upload leaf photos to identify candidate pathogens (e.g. Alternaria solani, Puccinia triticina). Delivers cultural sanitation steps while strictly abstaining from unverified chemical dosages.
            </p>
            <Link href="/app/disease" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#153D2B] hover:text-[#1BC447]">
              Diagnose Leaf Symptoms <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Capability 6 & 7: Weather & Multi-Farm */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-[#DCE5DC] shadow-bento space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EDF7FF] text-[#004263] flex items-center justify-center border border-[#BEE3F8]">
              <CloudSun className="w-6 h-6 text-[#33B3FC]" />
            </div>
            <h3 className="text-xl font-extrabold text-[#1C2922]">Agro-Meteorological Forecasts</h3>
            <p className="text-sm text-[#3D4A3B] leading-relaxed font-medium">
              Specialized farm weather tracking reference evapotranspiration (ET0), ground frost alerts, canopy humidity, and hourly spray drift ratings to protect sensitive crops.
            </p>
            <Link href="/app/weather" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#153D2B] hover:text-[#1BC447]">
              Inspect Weather Engine <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-[#DCE5DC] shadow-bento space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
              <Home className="w-6 h-6 text-[#1BC447]" />
            </div>
            <h3 className="text-xl font-extrabold text-[#1C2922]">Multi-Holding Spatial Governance</h3>
            <p className="text-sm text-[#3D4A3B] leading-relaxed font-medium">
              Track distinct plots across multiple geographical holdings. Record soil test pH logs, irrigation methods (drip, sprinkler, rainfed), and active crop cycles per field.
            </p>
            <Link href="/app/farms" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#153D2B] hover:text-[#1BC447]">
              Manage Plots & Cycles <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
