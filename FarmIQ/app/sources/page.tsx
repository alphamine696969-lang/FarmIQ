import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SourceCard } from '@/components/ui/SourceCard';
import { APPROVED_SOURCES } from '@/lib/data/mockDatabase';
import {
  ShieldCheck,
  BookOpen,
  Clock,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  Lock
} from 'lucide-react';

export default function SourcesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F3FCF3] text-[#1C2922]">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-[#153D2B] text-white py-16 border-b border-[#1C4D37]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0E281C] text-[#1BC447] text-xs font-bold border border-[#1C4D37]">
            <ShieldCheck className="w-4 h-4 text-[#1BC447]" />
            <span>Product Trust Contract (ADR-004 & ADR-005)</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Approved Sources & Scientific Integrity Policy
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Agricultural advice impacts livelihoods, soil biomes, and food safety. We openly document our sources, freshness rules, and safety boundaries.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        
        {/* Approved Source Registry Bento Grid */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-[#153D2B]">Approved Agricultural Knowledge Registries</h2>
              <p className="text-sm text-[#3D4A3B] font-medium">Current active registries indexed in the FarmIQ RAG grounding engine.</p>
            </div>
            <span className="text-xs bg-[#EDF6ED] text-[#153D2B] border border-[#DCE5DC] font-extrabold px-4 py-1.5 rounded-full self-start">
              {APPROVED_SOURCES.length} Active Registries
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {APPROVED_SOURCES.map((source) => (
              <SourceCard
                key={source.id}
                sourceName={source.sourceName}
                organization={source.organization}
                canonicalUrl={source.canonicalUrl}
                jurisdiction={source.jurisdiction}
                publicationDate={source.publicationDate}
                section={source.section}
                excerpt={source.excerpt}
              />
            ))}
          </div>
        </section>

        {/* Data Freshness Classification Protocol */}
        <section id="freshness" className="bg-white rounded-3xl border border-[#DCE5DC] p-8 sm:p-10 shadow-bento space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#153D2B] bg-[#EDF6ED] px-3.5 py-1.5 rounded-full border border-[#DCE5DC]">
              <Clock className="w-4 h-4 text-[#1BC447]" />
              <span>Provenance Standard</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#1C2922]">Data Freshness & Classification Protocol</h2>
            <p className="text-[#3D4A3B] text-sm max-w-3xl font-medium">
              FarmIQ classifies every observation into distinct operational states so you never mistake simulated or delayed numbers for live market quotes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl border border-[#DCE5DC] bg-[#EDF6ED] space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1BC447] animate-pulse" />
                <h4 className="font-extrabold text-[#153D2B] text-sm">Live Observation</h4>
              </div>
              <p className="text-xs text-[#3D4A3B] leading-relaxed font-medium">
                Direct API stream retrieved within the past 60 minutes from a validated exchange or weather sensor.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[#BEE3F8] bg-[#EDF7FF] space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#33B3FC]" />
                <h4 className="font-extrabold text-[#004263] text-sm">Cached Record</h4>
              </div>
              <p className="text-xs text-[#004263]/80 leading-relaxed font-medium">
                Retrieved within provider-approved caching intervals (1-24 hours). Observation timestamp displayed.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[#FFE0B2] bg-[#FFF6EB] space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FD9D1A]" />
                <h4 className="font-extrabold text-[#895100] text-sm">Sample Historical</h4>
              </div>
              <p className="text-xs text-[#895100]/80 leading-relaxed font-medium">
                Pre-configured benchmarks for demonstration when provider keys are unconfigured (ADR-005).
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[#FCDAD7] bg-[#FDF2F2] space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#BA1A1A]" />
                <h4 className="font-extrabold text-[#BA1A1A] text-sm">Unavailable</h4>
              </div>
              <p className="text-xs text-[#BA1A1A]/80 leading-relaxed font-medium">
                Explicit disclosure when no verified provider operates in the requested regional jurisdiction.
              </p>
            </div>
          </div>
        </section>

        {/* Chemical & Pesticide Safeguards (ADR-006) */}
        <section id="safety" className="bg-[#153D2B] text-white rounded-3xl border border-[#1C4D37] p-8 sm:p-10 shadow-floating space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#1BC447] bg-[#0E281C] px-3.5 py-1.5 rounded-full border border-[#1C4D37]">
              <AlertTriangle className="w-4 h-4 text-[#1BC447]" />
              <span>Mandatory Safety Policy</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">Chemical & Pesticide Dosage Safeguards (ADR-006)</h2>
            <p className="text-white/80 text-sm sm:text-base max-w-3xl leading-relaxed font-medium">
              Why FarmIQ strictly prohibits arbitrary pesticide dosage recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-white/85">
            <div className="p-5 bg-[#0E281C] rounded-2xl border border-[#1C4D37] space-y-2">
              <h4 className="font-extrabold text-[#1BC447]">1. Legal Label Primacy</h4>
              <p className="leading-relaxed text-white/80">
                In every major agricultural jurisdiction (EPA in the USA, EFSA in the EU, CIBRC in India), pesticide application rates are governed by law. Applying off-label rates constitutes a legal violation.
              </p>
            </div>
            <div className="p-5 bg-[#0E281C] rounded-2xl border border-[#1C4D37] space-y-2">
              <h4 className="font-extrabold text-[#1BC447]">2. Residue & Resistance Risks</h4>
              <p className="leading-relaxed text-white/80">
                Over-application leads to illegal Maximum Residue Limit (MRL) rejections at grain elevators and accelerates dangerous pathogen resistance.
              </p>
            </div>
            <div className="p-5 bg-[#0E281C] rounded-2xl border border-[#1C4D37] space-y-2">
              <h4 className="font-extrabold text-[#1BC447]">3. Integrated Pest Management First</h4>
              <p className="leading-relaxed text-white/80">
                We guide farmers toward cultural sanitation, crop rotation, resistant cultivars, and biological antagonists before chemical intervention.
              </p>
            </div>
          </div>
        </section>

      </div>

      <Footer />
    </div>
  );
}
