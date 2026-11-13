'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FreshnessBadge } from '@/components/ui/Badge';
import { DISEASE_KNOWLEDGE_BASE, DiseaseAssessmentCase, APPROVED_SOURCES } from '@/lib/data/mockDatabase';
import {
  ScanLine,
  Upload,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Info,
  RotateCcw
} from 'lucide-react';

export default function DiseaseScannerPage() {
  const [selectedCase, setSelectedCase] = useState<DiseaseAssessmentCase | null>(DISEASE_KNOWLEDGE_BASE[0]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnalyzing(true);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setTimeout(() => {
        setSelectedCase(DISEASE_KNOWLEDGE_BASE[0]);
        setAnalyzing(false);
      }, 700);
    }
  };

  const handleSelectSample = (diseaseCase: DiseaseAssessmentCase) => {
    setAnalyzing(true);
    setImagePreview(null);
    setTimeout(() => {
      setSelectedCase(diseaseCase);
      setAnalyzing(false);
    }, 350);
  };

  const citation = APPROVED_SOURCES.find((s) => s.id === selectedCase?.sourceCitationId);

  return (
    <AppShell>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-7 rounded-3xl border border-[#DCE5DC] shadow-bento">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-[#1C2922]">Crop-Health Disease & Symptom Scanner</h2>
              <FreshnessBadge status="supported" label="IPM Safeguards (ADR-006)" />
            </div>
            <p className="text-xs text-[#3D4A3B] mt-1 font-medium">
              Computer-vision assisted leaf symptom assessment with cultural management and certified IPM advice.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-[#FFF6EB] text-[#895100] px-4 py-2 rounded-full border border-[#FFE0B2] font-bold">
            <AlertTriangle className="w-4 h-4 text-[#FD9D1A]" />
            <span>Strict Pesticide Safety Safeguards</span>
          </div>
        </div>

        {/* Upload & Sample Selector Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Upload / Selector Section (5 cols Bento Card) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#DCE5DC] p-7 shadow-bento space-y-6">
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-[#1C2922] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#1BC447]" />
                <span>Upload Leaf Image for Analysis</span>
              </h3>
              <p className="text-xs text-[#3D4A3B] font-medium">
                Accepts JPG or PNG files. All image data is held securely in private storage (docs/SECURITY.md).
              </p>
            </div>

            {/* Drag & Drop Upload Zone */}
            <label className="border-2 border-dashed border-[#DCE5DC] hover:border-[#1BC447] rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-[#F3FCF3] hover:bg-white transition-smooth group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-[#EDF6ED] group-hover:bg-[#1BC447] text-[#153D2B] group-hover:text-[#1C2922] flex items-center justify-center transition-colors mb-3 border border-[#DCE5DC]">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-xs font-extrabold text-[#1C2922]">Click to select photo or drag & drop</p>
              <p className="text-[11px] text-[#3D4A3B] mt-1 font-medium">Capture clear, close-up foliage with natural lighting</p>
            </label>

            {/* Instant Sample Selectors */}
            <div className="space-y-3 pt-4 border-t border-[#DCE5DC]">
              <span className="text-xs font-extrabold text-[#3D4A3B] uppercase tracking-wider block">
                Or Test Verified Foliar Samples:
              </span>
              <div className="space-y-2">
                {DISEASE_KNOWLEDGE_BASE.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className={`w-full p-3.5 rounded-2xl border text-left text-xs transition-smooth flex items-center justify-between ${
                      selectedCase?.id === sample.id
                        ? 'border-[#1BC447] bg-[#EDF6ED] font-extrabold text-[#153D2B] shadow-xs'
                        : 'border-[#DCE5DC] bg-[#F3FCF3] hover:bg-white text-[#1C2922]'
                    }`}
                  >
                    <div>
                      <p className="font-extrabold">{sample.conditionName}</p>
                      <p className="text-[10px] text-[#3D4A3B] font-medium">Crop: {sample.crop} • {sample.pathogenType}</p>
                    </div>
                    <Sparkles className="w-3.5 h-3.5 text-[#1BC447]" />
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Diagnostic Assessment Report (7 cols Bento Card) */}
          <div className="lg:col-span-7 space-y-6">
            
            {analyzing ? (
              <div className="bg-white rounded-3xl border border-[#DCE5DC] p-12 text-center space-y-3 shadow-bento">
                <div className="w-12 h-12 rounded-2xl bg-[#153D2B] text-[#1BC447] flex items-center justify-center mx-auto animate-spin">
                  <ScanLine className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-extrabold text-[#1C2922]">Analyzing Foliar Symptoms...</h4>
                <p className="text-xs text-[#3D4A3B]">Cross-referencing candidate visual patterns with approved pathology database.</p>
              </div>
            ) : selectedCase ? (
              <div className="bg-white rounded-3xl border border-[#DCE5DC] p-7 sm:p-9 shadow-bento space-y-6">
                
                {/* Condition Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE5DC] pb-5">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#FFF6EB] text-[#895100] px-3 py-1 rounded-full border border-[#FFE0B2]">
                      Candidate Diagnostic Assessment
                    </span>
                    <h3 className="text-2xl font-black text-[#153D2B] mt-2">{selectedCase.conditionName}</h3>
                    <p className="text-xs text-[#3D4A3B] font-medium mt-0.5">Target Crop: {selectedCase.crop} • Pathogen Class: {selectedCase.pathogenType}</p>
                  </div>
                  <FreshnessBadge status="supported" label="Evidence Grounded" />
                </div>

                {/* Visual Indicators */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#3D4A3B]">
                    Visual Diagnostic Indicators:
                  </h4>
                  <p className="text-xs sm:text-sm text-[#1C2922] bg-[#F3FCF3] p-4 rounded-2xl border border-[#DCE5DC] font-medium leading-relaxed">
                    {selectedCase.visualIndicators}
                  </p>
                </div>

                {/* Primary Symptoms */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#3D4A3B]">
                    Observed Symptoms:
                  </h4>
                  <ul className="space-y-2 text-xs text-[#1C2922]">
                    {selectedCase.symptoms.map((sym, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#1BC447] shrink-0 mt-0.5" />
                        <span className="font-medium">{sym}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Preventative Cultural Practices */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#153D2B] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#1BC447]" />
                    <span>Non-Chemical & Cultural Management:</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#3D4A3B]">
                    {selectedCase.preventativeCulturalPractices.map((prac, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#1BC447] shrink-0 mt-1.5" />
                        <span className="font-medium">{prac}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Biological & Organic Alternatives */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#153D2B]">
                    Biological & Certified Organic Options:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#3D4A3B]">
                    {selectedCase.biologicalAndOrganicOptions.map((bio, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#1BC447] shrink-0 mt-1.5" />
                        <span className="font-medium">{bio}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mandatory ADR-006 Safety Box */}
                <div className="p-5 rounded-2xl bg-[#FFF6EB] border border-[#FFE0B2] text-xs text-[#895100] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-extrabold text-[#5d3500]">
                    <AlertTriangle className="w-4 h-4 text-[#FD9D1A]" />
                    <span>Regulatory Pesticide Safety Notice (ADR-006)</span>
                  </div>
                  <p className="leading-relaxed text-[11px] font-medium">
                    {selectedCase.officialRegulationNotice}
                  </p>
                </div>

                {/* Provenance Citation */}
                {citation && (
                  <div className="pt-3.5 border-t border-[#DCE5DC] flex items-center justify-between text-[11px] text-[#3D4A3B]">
                    <span className="font-medium">Reference: {citation.sourceName}</span>
                    <a
                      href={citation.canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#153D2B] font-bold hover:text-[#1BC447] underline"
                    >
                      Canonical Document
                    </a>
                  </div>
                )}

              </div>
            ) : null}

          </div>

        </div>

      </div>
    </AppShell>
  );
}
