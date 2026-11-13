import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  FileCheck,
  Search,
  Cpu,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Calculator,
  ScanLine,
  Compass
} from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'Configure Your Farm & Soil Parameters',
      desc: 'Define your agricultural holdings, plots, soil texture, pH observations, and irrigation infrastructure. FarmIQ tailors calculations and weather alerts directly to your exact acreage and microclimate.',
      icon: Compass,
    },
    {
      num: '02',
      title: 'Evidence Ingestion & Approved Document Retrieval',
      desc: 'When you ask a question or assess a crop, FarmIQ searches our verified agricultural knowledge base (FAO, USDA, CGIAR, ICAR). Documents are filtered by jurisdiction, crop variety, and publication recency.',
      icon: Search,
    },
    {
      num: '03',
      title: 'Grounded Synthesis & Citation Verification',
      desc: 'Our models are constrained to answer strictly from the retrieved evidence. If the evidence is incomplete, the system abstains rather than inventing answers. Every citation is mathematically verified against stored document IDs.',
      icon: Cpu,
    },
    {
      num: '04',
      title: 'Deterministic Financial Modeling & Net Realization',
      desc: 'Calculate precise break-even yields and minimum viable farm-gate prices. We apply deterministic mathematical formulas—never probabilistic approximations—ensuring your seasonal budgets are audit-ready.',
      icon: Calculator,
    },
    {
      num: '05',
      title: 'Pesticide & Safety Enforcement (ADR-006)',
      desc: 'Treatment advice prioritizes cultural sanitation and biological options. FarmIQ strictly blocks unverified synthetic chemical dosages unless backed by an authorized jurisdiction label.',
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F3FCF3] text-[#1C2922]">
      <Navbar />

      {/* Hero Header (Deep Forest Green Anchor #153D2B) */}
      <div className="bg-[#153D2B] text-white py-16 border-b border-[#1C4D37]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0E281C] text-[#1BC447] text-xs font-bold border border-[#1C4D37]">
            <FileCheck className="w-4 h-4 text-[#1BC447]" />
            <span>Traceable Agronomic Evidence Pipeline</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            How FarmIQ Grounds Every Decision
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            A transparent look at how we combine verified agricultural science, provider adapters, and deterministic financial logic to safeguard your farm.
          </p>
        </div>
      </div>

      {/* Step by step timeline bento cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-white rounded-3xl border border-[#DCE5DC] p-8 shadow-bento flex flex-col md:flex-row items-start gap-6 hover:shadow-bento-hover hover:border-[#1BC447]/50 transition-smooth"
              >
                <div className="flex items-center gap-4 md:flex-col md:items-center shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center font-extrabold text-xl shadow-xs border border-[#DCE5DC]">
                    <Icon className="w-7 h-7 text-[#1BC447]" />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#153D2B] bg-[#EDF6ED] px-2.5 py-0.5 rounded-full border border-[#DCE5DC]">
                    STEP {step.num}
                  </span>
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-xl font-extrabold text-[#1C2922]">{step.title}</h3>
                  <p className="text-[#3D4A3B] text-sm sm:text-base leading-relaxed font-medium">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Workflow Diagram Box */}
        <div className="mt-16 bg-[#153D2B] text-white p-8 sm:p-12 rounded-3xl border border-[#1C4D37] shadow-floating text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to put evidence to work on your fields?</h2>
          <p className="text-white/80 max-w-xl mx-auto text-sm sm:text-base font-medium">
            Create your farm profile in 60 seconds and run your first profit scenario or agronomic question today.
          </p>
          <div className="pt-2">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#1BC447] hover:bg-[#16a73c] text-[#1C2922] font-extrabold text-base transition-smooth shadow-glow-lime"
            >
              <span>Open Farmer Workspace</span>
              <ArrowRight className="w-5 h-5 text-[#1C2922]" />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
