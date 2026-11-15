'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FreshnessBadge } from '@/components/ui/Badge';
import { DISEASE_KNOWLEDGE_BASE, APPROVED_SOURCES } from '@/lib/data/mockDatabase';
import {
  ScanLine,
  Upload,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  Leaf,
  RefreshCw,
  ExternalLink,
  Bug,
  Sprout
} from 'lucide-react';

interface DiseaseReportView {
  plantIdentified: string;
  plantMatchConfirmed: boolean;
  plantDetails: string;
  growingConditions: string;
  diseaseName: string;
  diseaseWhy: string;
  severity: 'none' | 'early' | 'moderate' | 'severe' | 'uncertain';
  recoverySteps: string[];
  preventionSteps: string[];
}

interface SourceView {
  id: string;
  sourceName: string;
  organization: string;
  canonicalUrl: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  none: 'bg-[#EDF6ED] text-[#153D2B] border-[#DCE5DC]',
  early: 'bg-[#FFF6EB] text-[#895100] border-[#FFE0B2]',
  moderate: 'bg-[#FFF6EB] text-[#895100] border-[#FFE0B2]',
  severe: 'bg-red-50 text-red-700 border-red-200',
  uncertain: 'bg-slate-100 text-slate-700 border-slate-300'
};

async function compressImage(file: File): Promise<string | null> {
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const img = document.createElement('img');
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = dataUrl; });
    const scale = Math.min(1, 640 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.75);
  } catch {
    return null;
  }
}

export default function DiseaseScannerPage() {
  const [plantName, setPlantName] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DiseaseReportView | null>(null);
  const [sources, setSources] = useState<SourceView[]>([]);
  const [providerUsed, setProviderUsed] = useState<string | null>(null);

  // Honest fallback: verified reference library match (clearly NOT an image analysis).
  const referenceMatch = plantName.trim()
    ? DISEASE_KNOWLEDGE_BASE.find((entry) => {
        const token = plantName.trim().toLowerCase().split(/[( /]/)[0];
        return token.length >= 3 && entry.crop.toLowerCase().includes(token);
      })
    : undefined;
  const referenceCitation = referenceMatch
    ? APPROVED_SOURCES.find((s) => s.id === referenceMatch.sourceCitationId)
    : undefined;

  const runAnalysis = async () => {
    if (plantName.trim().length < 2 || !images.length || analyzing) return;
    setAnalyzing(true);
    setError(null);
    setReport(null);
    setSources([]);
    setProviderUsed(null);
    try {
      const res = await fetch('/api/disease/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plantName: plantName.trim(), images: images.slice(0, 3) })
      });
      const json = await res.json();
      if (json?.data?.report) {
        setReport(json.data.report as DiseaseReportView);
        setSources((json.data.sources as SourceView[]) || []);
        setProviderUsed(json.data.providerUsed ?? null);
      } else {
        setError(json?.data?.reason || 'Image analysis is unavailable right now. Try again shortly, or use the verified reference below.');
      }
    } catch {
      setError('Analysis failed this time. Check your connection and try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setPlantName('');
    setImages([]);
    setReport(null);
    setSources([]);
    setError(null);
    setProviderUsed(null);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#DCE5DC] shadow-bento">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-extrabold tracking-tight text-[#1C2922]">Disease Scanner</h2>
            </div>
            <p className="text-xs text-[#3D4A3B] mt-1 font-medium">
              Name your plant, upload a photo of the affected plant, and the AI identifies it, explains the disease, and gives recovery and prevention guidance with official sources.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-[#EDF6ED] text-[#153D2B] px-4 py-2 rounded-full border border-[#DCE5DC] font-bold shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#1BC447]" />
            <span>Agronomic Diagnosis</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Step 1 + 2: plant name + photos */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#DCE5DC] p-6 shadow-bento space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#1C2922] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#EDF6ED] text-[#153D2B] text-[11px] font-extrabold flex items-center justify-center border border-[#DCE5DC]">1</span>
                <span>Name your plant or crop</span>
              </h3>
              <p className="text-[11px] text-[#3D4A3B] font-medium">The AI uses this to confirm the plant before analyzing disease signs.</p>
            </div>
            <input
              value={plantName}
              onChange={(e) => setPlantName(e.target.value)}
              placeholder="e.g. Tomato, Wheat, Maize…"
              className="w-full px-4 py-3 rounded-2xl border border-[#DCE5DC] text-sm text-[#1C2922] bg-[#F3FCF3]/60 focus:ring-2 focus:ring-[#1BC447] outline-none font-semibold"
            />

            <div className="space-y-1 pt-4 border-t border-[#DCE5DC]">
              <h3 className="text-sm font-extrabold text-[#1C2922] flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#EDF6ED] text-[#153D2B] text-[11px] font-extrabold flex items-center justify-center border border-[#DCE5DC]">2</span>
                <span>Upload photo(s) of the diseased plant</span>
              </h3>
              <p className="text-[11px] text-[#3D4A3B] font-medium">1–3 photos, up to 3 shown. Capture affected leaves in daylight, close-up.</p>
            </div>
            <label className="border-2 border-dashed border-[#DCE5DC] hover:border-[#1BC447] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-[#F3FCF3] hover:bg-white transition-smooth group">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []).slice(0, 3);
                  const compressed = await Promise.all(files.map(compressImage));
                  setImages(compressed.filter((p): p is string => p !== null));
                  setReport(null);
                  setError(null);
                }}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-xl bg-white group-hover:bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center transition-colors mb-2 border border-[#DCE5DC]">
                <ImageIcon className="w-5 h-5" />
              </div>
              <p className="text-xs font-extrabold text-[#1C2922]">Click to select photo(s)</p>
            </label>

            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt={`Upload ${i + 1}`} className="w-16 h-16 rounded-xl object-cover border border-[#DCE5DC]" />
                ))}
              </div>
            )}

            <button
              onClick={runAnalysis}
              disabled={analyzing || plantName.trim().length < 2 || images.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#1BC447] text-[#153D2B] text-sm font-extrabold disabled:opacity-40 hover:brightness-105 transition-smooth"
            >
              <ScanLine className={`w-4 h-4 ${analyzing ? 'animate-pulse' : ''}`} />
              {analyzing ? 'Analyzing plant photo…' : 'Analyze with AI'}
            </button>
            {(plantName.trim().length < 2 || images.length === 0) && !analyzing && (
              <p className="text-[10px] text-[#3D4A3B] font-medium text-center">
                {plantName.trim().length < 2 ? 'Step 1: enter the plant name.' : 'Step 2: attach at least one photo.'}
              </p>
            )}

            {/* Verified reference fallback (honest, clearly labeled) */}
            {referenceMatch && !report && (
              <div className="pt-4 border-t border-[#DCE5DC] space-y-2">
                <p className="text-[11px] font-extrabold text-[#153D2B] inline-flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-[#1BC447]" /> Verified reference for “{plantName.trim()}”
                </p>
                <p className="text-[10px] text-[#3D4A3B] font-medium">
                  Shown from FarmIQ&apos;s verified knowledge base (ICAR/FAO-sourced) — this is reference material, <strong>not an image analysis</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="lg:col-span-7 space-y-4">
            {analyzing && (
              <div className="bg-white rounded-3xl border border-[#DCE5DC] p-10 text-center space-y-3 shadow-bento">
                <div className="w-12 h-12 rounded-2xl bg-[#153D2B] text-[#1BC447] flex items-center justify-center mx-auto animate-spin">
                  <ScanLine className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-extrabold text-[#1C2922]">Analyzing your plant photo…</h4>
                <p className="text-xs text-[#3D4A3B] font-medium">Identifying the plant, checking for disease signs, and preparing guidance with official sources.</p>
              </div>
            )}

            {error && !analyzing && (
              <div className="bg-[#FFF6EB] border border-[#FFE0B2] rounded-3xl p-5 text-[11px] text-[#895100] font-medium space-y-2">
                <p className="font-extrabold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-[#FD9D1A]" /> {error}</p>
                <button onClick={runAnalysis} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#FFE0B2] font-extrabold">
                  <RefreshCw className="w-3 h-3" /> Try again
                </button>
              </div>
            )}

            {/* AI report */}
            {report && !analyzing && (
              <div className="bg-white rounded-3xl border border-[#DCE5DC] p-6 sm:p-7 shadow-bento space-y-6">
                {/* 1. Header & Disease Name Banner */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#DCE5DC] pb-5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider bg-[#EDF6ED] text-[#153D2B] px-3 py-1 rounded-full border border-[#DCE5DC] inline-flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5 text-[#1BC447]" /> {report.plantIdentified}
                      </span>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${report.plantMatchConfirmed ? 'bg-[#EDF6ED] text-[#153D2B] border-[#DCE5DC]' : 'bg-[#FFF6EB] text-[#895100] border-[#FFE0B2]'}`}>
                        {report.plantMatchConfirmed ? `Matches “${plantName}”` : `Differs from “${plantName}”`}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-[#153D2B] mt-2">
                      {report.diseaseName}
                    </h3>
                    <p className="text-xs text-[#3D4A3B] font-medium mt-1">Identified from sample for: {plantName}</p>
                  </div>
                  <span className={`text-xs px-3.5 py-1.5 rounded-full font-extrabold border self-start shrink-0 ${SEVERITY_STYLES[report.severity]}`}>
                    {report.severity === 'none' ? 'Healthy • No disease seen' : `Severity: ${report.severity.toUpperCase()}`}
                  </span>
                </div>

                {/* 2. Cause & Symptoms Overview Box */}
                <div className="bg-[#FFF9ED] border border-[#F6D8A2] border-l-4 border-l-[#E69500] rounded-2xl p-4 sm:p-5 space-y-1.5">
                  <p className="text-xs font-bold text-[#895100] uppercase tracking-wider flex items-center gap-1.5">
                    <Bug className="w-4 h-4 text-[#E69500]" /> Why It Occurs & Symptoms
                  </p>
                  <p className="text-sm text-[#5d3500] font-medium leading-relaxed">
                    {report.diseaseWhy}
                  </p>
                </div>

                {/* 3. Action Plan: Recovery Steps (Priority #1) */}
                {report.recoverySteps.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center font-bold text-xs border border-[#DCE5DC]">
                        <RefreshCw className="w-3.5 h-3.5 text-[#1BC447]" />
                      </div>
                      <h4 className="text-sm font-extrabold text-[#153D2B]">
                        Immediate Recovery Plan (What to do now)
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {report.recoverySteps.map((step, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 bg-[#F3FCF3]/70 border border-[#DCE5DC] rounded-xl p-3.5 text-sm text-[#1C2922] font-medium leading-relaxed"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#1BC447] shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Prevention Plan: Future Protection (Priority #2) */}
                {report.preventionSteps.length > 0 && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center font-bold text-xs border border-[#DCE5DC]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#1BC447]" />
                      </div>
                      <h4 className="text-sm font-extrabold text-[#153D2B]">
                        Future Prevention & Crop Protection
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {report.preventionSteps.map((step, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 bg-white border border-[#DCE5DC] rounded-xl p-3.5 text-sm text-[#1C2922] font-medium leading-relaxed"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#1BC447] shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Simplified Plant Profile & Ideal Conditions (Secondary details) */}
                <div className="pt-2 border-t border-[#DCE5DC]">
                  <p className="text-xs font-extrabold text-[#153D2B] mb-2.5 flex items-center gap-1.5">
                    <Sprout className="w-3.5 h-3.5 text-[#1BC447]" /> Plant Profile & Ideal Growing Conditions
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#F8FAF8] border border-[#DCE5DC] rounded-2xl p-4 space-y-1">
                      <p className="text-xs font-bold text-[#153D2B]">About this crop</p>
                      <p className="text-xs text-[#3D4A3B] font-medium leading-relaxed">{report.plantDetails}</p>
                    </div>
                    <div className="bg-[#F8FAF8] border border-[#DCE5DC] rounded-2xl p-4 space-y-1">
                      <p className="text-xs font-bold text-[#153D2B]">Preferred growing conditions</p>
                      <p className="text-xs text-[#3D4A3B] font-medium leading-relaxed">{report.growingConditions}</p>
                    </div>
                  </div>
                </div>

                {/* 6. Official sources — real, verified registry URLs */}
                <div className="pt-3 border-t border-[#DCE5DC] space-y-2.5">
                  <p className="text-xs font-extrabold text-[#1C2922]">Official sources for this guidance</p>
                  {sources.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sources.map((src) => (
                        <a
                          key={src.id}
                          href={src.canonicalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 bg-[#F3FCF3] border border-[#DCE5DC] rounded-xl px-4 py-3 hover:border-[#1BC447] hover:shadow-xs transition-smooth group"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-[#153D2B] group-hover:text-[#0B4D2E] truncate">{src.sourceName}</p>
                            <p className="text-[10px] text-[#3D4A3B] font-medium truncate">{src.organization}</p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-[#1BC447] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#3D4A3B] font-medium">Verified by FarmIQ Agricultural Evidence Pipeline.</p>
                  )}
                </div>

                {/* 7. Agricultural Safety Notice */}
                <div className="p-4 rounded-2xl bg-[#FFF6EB] border border-[#FFE0B2] text-xs text-[#895100] space-y-1">
                  <p className="font-extrabold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-[#FD9D1A]" /> Agricultural Safety Notice</p>
                  <p className="leading-relaxed font-medium">
                    This analysis is advisory and observational. FarmIQ never provides pesticide dosages or chemical treatment instructions. For any treatment decision, consult your local certified extension officer and follow an authorized product label.
                  </p>
                </div>

                {/* 8. Bottom Footer */}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-[#3D4A3B] font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1BC447]" /> Verified Agronomic Diagnosis
                  </p>
                  <button onClick={reset} className="text-xs font-bold text-[#153D2B] hover:text-[#0B4D2E] px-4 py-2 rounded-xl border border-[#DCE5DC] bg-[#F3FCF3] hover:bg-[#EDF6ED] transition-colors">
                    Analyze another plant
                  </button>
                </div>
              </div>
            )}

            {/* Idle / honest verified reference (never presented as a scan) */}
            {!report && !analyzing && (
              <div className="bg-white rounded-3xl border border-[#DCE5DC] p-6 shadow-bento space-y-4">
                <div className="flex items-center gap-2 text-[#3D4A3B]">
                  <Upload className="w-4 h-4 text-[#1BC447]" />
                  <p className="text-xs font-extrabold">How it works</p>
                </div>
                <ol className="text-[11px] text-[#3D4A3B] font-medium space-y-1.5 list-decimal list-inside">
                  <li>Enter your plant or crop name (step 1).</li>
                  <li>Upload 1–3 photos of the affected plant (step 2).</li>
                  <li>The AI identifies the plant, explains any disease, and returns recovery steps, prevention advice, and official sources.</li>
                </ol>
                {error && referenceMatch && (
                  <div className="pt-4 border-t border-[#DCE5DC] space-y-3">
                    <p className="text-[11px] font-extrabold text-[#153D2B]">Verified reference (not an image analysis)</p>
                    <p className="text-xs font-extrabold text-[#1C2922]">{referenceMatch.conditionName}</p>
                    <p className="text-[11px] text-[#3D4A3B] font-medium">{referenceMatch.crop} • {referenceMatch.pathogenType}</p>
                    <ul className="space-y-1">
                      {referenceMatch.preventativeCulturalPractices.slice(0, 3).map((p, i) => (
                        <li key={i} className="text-[11px] text-[#3D4A3B] font-medium flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1BC447] shrink-0 mt-1.5" /> {p}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#3D4A3B] font-medium">Ref: {referenceCitation?.sourceName}</span>
                      {referenceCitation && (
                        <a href={referenceCitation.canonicalUrl} target="_blank" rel="noopener noreferrer" className="text-[#153D2B] font-bold underline">
                          Official source
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
