import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Sprout,
  ShieldCheck,
  Target,
  AlertCircle,
  Users,
  Globe2,
  ArrowRight,
  HeartHandshake
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F3FCF3] text-[#1C2922]">
      <Navbar />

      {/* Hero Header (Deep Forest Green Anchor #153D2B) */}
      <div className="bg-[#153D2B] text-white py-16 border-b border-[#1C4D37]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0E281C] text-[#1BC447] text-xs font-bold border border-[#1C4D37]">
            <Sprout className="w-4 h-4 text-[#1BC447]" />
            <span>FarmIQ Mission & Ethos</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Grow Smarter. Earn Better.
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            We are building the trusted operating system for evidence-based agriculture—combining scientific rigor with practical farm economics.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        
        {/* Mission Statement Bento Card */}
        <section className="bg-white rounded-3xl border border-[#DCE5DC] p-8 sm:p-12 shadow-bento space-y-4">
          <h2 className="text-2xl font-extrabold text-[#153D2B]">The Problem We Solve</h2>
          <p className="text-[#3D4A3B] text-base leading-relaxed font-medium">
            Farmers around the world operate under tremendous uncertainty. Weather patterns are erratic, commodity markets are volatile, and agronomic advice is scattered across fragmented PDF manuals, commercial seed reps, and unvetted online forums.
          </p>
          <p className="text-[#3D4A3B] text-base leading-relaxed font-medium">
            Generic AI assistants make matters worse by confidently hallucinating chemical dosages and misattributing plant diseases. <strong>FarmIQ was created to restore trust to agricultural intelligence.</strong> We bridge scientific research institutions with active farm fields through grounded, traceable, and deterministic tools.
          </p>
        </section>

        {/* Non-Goals & Boundaries Bento Card */}
        <section className="bg-white rounded-3xl border border-[#DCE5DC] p-8 sm:p-12 shadow-bento space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#BA1A1A] bg-[#FDF2F2] px-3.5 py-1.5 rounded-full border border-[#FCDAD7]">
              <AlertCircle className="w-4 h-4" />
              <span>Explicit Non-Goals & Boundaries</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#1C2922]">What FarmIQ Is NOT</h2>
            <p className="text-[#3D4A3B] text-sm font-medium">
              We define clear operational boundaries to protect our users and preserve scientific credibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div className="p-5 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-2">
              <h3 className="font-extrabold text-[#1C2922]">Not an Extension Agent Replacement</h3>
              <p className="text-xs text-[#3D4A3B] leading-relaxed font-medium">
                FarmIQ assists your analysis but does not replace on-site physical soil sampling or inspection by licensed local agricultural extension officers.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-2">
              <h3 className="font-extrabold text-[#1C2922]">No Guaranteed Yield or Price Outcomes</h3>
              <p className="text-xs text-[#3D4A3B] leading-relaxed font-medium">
                Agriculture is subject to weather events, biological blights, and macroeconomic shocks. Our economic tools model scenarios; they do not guarantee profits.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-2">
              <h3 className="font-extrabold text-[#1C2922]">No Unverified Chemical Prescriptions</h3>
              <p className="text-xs text-[#3D4A3B] leading-relaxed font-medium">
                We strictly abstain from generating chemical spray recipes or dosages without verified, authorized local government registration labels.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] space-y-2">
              <h3 className="font-extrabold text-[#1C2922]">No Commodity Brokering or Speculation</h3>
              <p className="text-xs text-[#3D4A3B] leading-relaxed font-medium">
                We provide benchmark observation data to help you calculate your farm-gate realization; we do not execute financial trades or take positions in commodity futures.
              </p>
            </div>
          </div>
        </section>

        {/* Primary Users Bento Card (Deep Forest Anchor #153D2B) */}
        <section className="bg-[#153D2B] text-white rounded-3xl border border-[#1C4D37] p-8 sm:p-12 shadow-floating space-y-6">
          <h2 className="text-2xl font-extrabold text-white">Who FarmIQ Is Built For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-white/80">
            <div className="space-y-2">
              <h3 className="font-extrabold text-[#1BC447] text-base">Small & Medium Growers</h3>
              <p className="text-xs leading-relaxed font-medium">Family farms seeking to protect margins, avoid crop failure, and negotiate equitable commodity selling prices.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-[#1BC447] text-base">Agribusiness & Co-ops</h3>
              <p className="text-xs leading-relaxed font-medium">Cooperatives needing standardized economic scenario modeling and traceable agronomic decision logs across multiple member holdings.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-[#1BC447] text-base">Consultants & Agronomists</h3>
              <p className="text-xs leading-relaxed font-medium">Extension professionals looking for instant citation retrieval and agro-meteorological spray window calculations.</p>
            </div>
          </div>
        </section>

        {/* Ready to join CTA */}
        <div className="text-center pt-4">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#1BC447] hover:bg-[#16a73c] text-[#1C2922] font-extrabold text-base shadow-glow-lime transition-smooth"
          >
            <span>Launch FarmIQ Workspace</span>
            <ArrowRight className="w-5 h-5 text-[#1C2922]" />
          </Link>
        </div>

      </div>

      <Footer />
    </div>
  );
}
