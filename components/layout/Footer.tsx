import React from 'react';
import Link from 'next/link';
import { Sprout, ShieldCheck, Globe, Check } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0B4D2E] text-white/90 border-t border-[#135D38] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          
          {/* Column 1: Brand & Principles */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img src="/brand/logo-icon.png" alt="FarmIQ" className="w-9 h-9 object-contain group-hover:scale-105 transition-transform" />
              <span className="font-extrabold text-2xl tracking-tight text-white font-poppins">Farm<span className="text-[#A8E063]">IQ</span></span>
            </Link>
            <p className="text-sm text-white/75 leading-relaxed">
              Global precision agricultural intelligence platform combining satellite telemetry, market benchmarks, deterministic economics, and agro-meteorology.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#07331E] text-[#A8E063] text-xs font-bold border border-[#135D38]">
              <ShieldCheck className="w-4 h-4 text-[#4CAF50]" />
              <span>Trust Contract Compliant</span>
            </div>
          </div>

          {/* Column 2: Platform Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#A8E063]">Capabilities</h4>
            <ul className="space-y-2 text-sm text-white/75">
              <li><Link href="/app/assistant" className="hover:text-white transition-colors">AI Agricultural Assistant</Link></li>
              <li><Link href="/app/markets" className="hover:text-white transition-colors">Crop Market Intelligence</Link></li>
              <li><Link href="/app/profit" className="hover:text-white transition-colors">Profit & Break-Even Engine</Link></li>
              <li><Link href="/app/crop-advisor" className="hover:text-white transition-colors">Crop Suitability Advisor</Link></li>
              <li><Link href="/app/disease" className="hover:text-white transition-colors">Disease & Symptom Scanner</Link></li>
              <li><Link href="/app/weather" className="hover:text-white transition-colors">Agro-Weather Forecasts</Link></li>
            </ul>
          </div>

          {/* Column 3: Trust & Evidence */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1BC447]">Trust & Methodology</h4>
            <ul className="space-y-2 text-sm text-white/75">
              <li><Link href="/sources" className="hover:text-white transition-colors">Approved Source Registry</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">Evidence-Backed Workflow</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">Scientific Non-Goals & Scope</Link></li>
              <li><Link href="/sources#freshness" className="hover:text-white transition-colors">Data Freshness Policy</Link></li>
              <li><Link href="/sources#safety" className="hover:text-white transition-colors">Pesticide Safety Safeguards</Link></li>
            </ul>
          </div>

          {/* Column 4: Legal & Standards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1BC447]">Legal & Standards</h4>
            <ul className="space-y-2 text-sm text-white/75">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy & Data Governance</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/about#principles" className="hover:text-white transition-colors">Fair Agronomy Oath</Link></li>
            </ul>
            <div className="pt-2 text-xs text-white/60 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#1BC447]" />
              <span>Internationalized units (Metric & Imperial)</span>
            </div>
          </div>

        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-8 pt-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p className="max-w-2xl leading-relaxed">
            <strong>Important Agricultural Notice:</strong> FarmIQ assists operational decision-making through verified reference documents and models. It is not an insurance policy, pesticide label substitute, or replacement for a licensed agronomist or local government extension officer.
          </p>
          <p>© {new Date().getFullYear()} FarmIQ Global. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
