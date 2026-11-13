import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ShieldCheck, Lock, FileText } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F3FCF3]">
      <Navbar />

      <div className="bg-[#153D2B] text-white py-14 border-b border-[#1C4D37]">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1BC447]/15 text-[#1BC447] text-xs font-bold border border-[#1BC447]/30 shadow-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>Farmer Data Governance Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Privacy Policy & Data Security</h1>
          <p className="text-[#ceded3] text-sm font-medium">Last updated: October 2026 • FarmIQ Product Trust Contract</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="bg-white rounded-3xl border border-[#DCE5DC] p-8 sm:p-12 shadow-bento space-y-8 text-sm text-[#1C2922] leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-[#153D2B]">1. Core Privacy Commitments</h2>
            <p className="text-[#3D4A3B]">
              At FarmIQ, we believe that farmer data belongs to the farmer. Your field locations, crop cycle yields, plot boundaries, and profit budgets are treated as private and proprietary. We do not sell your personal or farm data to seed brokers, agrochemical conglomerates, or commodity traders.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-[#153D2B]">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-[#3D4A3B]">
              <li><strong className="text-[#1C2922]">Account Credentials:</strong> Name, email address, country, and regional preferences.</li>
              <li><strong className="text-[#1C2922]">Farm Profiles:</strong> Farm names, acreage, plot soil classifications, and crop cycles entered by you.</li>
              <li><strong className="text-[#1C2922]">Agronomic Queries:</strong> Questions asked to the AI assistant to facilitate retrieval and session history.</li>
              <li><strong className="text-[#1C2922]">Diagnostic Images:</strong> Photos uploaded to the disease scanner, stored securely in private object storage.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-[#153D2B]">3. How Your Information Is Used</h2>
            <p className="text-[#3D4A3B]">
              Your information is used strictly to provide you with localized weather alerts, deterministic profit calculations, and evidence-grounded agronomic responses. We do not use your private farm data to train public AI models without explicit, opt-in consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-[#153D2B]">4. Row Level Security & Access Control</h2>
            <p className="text-[#3D4A3B]">
              Every database record is protected with Row Level Security (RLS). Users can only view and modify records that they own. Image uploads are held in private buckets accessible only via time-limited, signed URLs.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-[#153D2B]">5. Your Data Rights</h2>
            <p className="text-[#3D4A3B]">
              You maintain the absolute right to export your farm scenarios, delete uploaded diagnostic photos, or delete your entire account and associated records at any time from your settings panel.
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}
