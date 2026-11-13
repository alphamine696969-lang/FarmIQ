import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FileText, ShieldAlert } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F3FCF3]">
      <Navbar />

      <div className="bg-[#153D2B] text-white py-14 border-b border-[#1C4D37]">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1BC447]/15 text-[#1BC447] text-xs font-bold border border-[#1BC447]/30 shadow-xs">
            <FileText className="w-3.5 h-3.5" />
            <span>Usage Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Terms of Service</h1>
          <p className="text-[#ceded3] text-sm font-medium">Last updated: October 2026 • FarmIQ Product Standards</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="bg-white rounded-3xl border border-[#DCE5DC] p-8 sm:p-12 shadow-bento space-y-8 text-sm text-[#1C2922] leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-[#153D2B]">1. Nature of the Service</h2>
            <p className="text-[#3D4A3B]">
              FarmIQ provides informational decision-support software for agriculture. By accessing or using the platform, you agree to these Terms. FarmIQ synthesizes retrieved agricultural publications, historical market records, weather forecasts, and mathematical calculations to help you evaluate farming choices.
            </p>
          </section>

          <section className="p-5 rounded-2xl bg-[#FFF6EB] border border-[#FD9D1A]/30 space-y-2">
            <div className="flex items-center gap-2 text-[#895100] font-bold">
              <ShieldAlert className="w-4 h-4 text-[#FD9D1A]" />
              <span>2. Crucial Agricultural & Safety Notice</span>
            </div>
            <p className="text-xs text-[#895100] leading-relaxed font-medium">
              FarmIQ outputs are not a warranty or guarantee of crop yields, profitability, disease eradication, or market prices. FarmIQ does NOT provide synthetic pesticide prescriptions or chemical dosage instructions. You must always confirm plant protection interventions against officially registered product labels in your jurisdiction or consult a certified local agronomist.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-[#153D2B]">3. Calculation & Economic Tools</h2>
            <p className="text-[#3D4A3B]">
              Our profit calculators and break-even engines apply deterministic mathematics based on user-supplied numbers and baseline assumptions. They do not account for unforeseen meteorological catastrophes, localized soil variations, or post-harvest storage losses.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-[#153D2B]">4. User Responsibilities</h2>
            <p className="text-[#3D4A3B]">
              You agree not to upload malicious scripts, attempt unauthorized database penetration, or scrape platform data in violation of server rate limits. You remain solely responsible for validating real-world agricultural operations conducted on your land.
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}
