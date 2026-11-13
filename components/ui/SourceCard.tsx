import React from 'react';
import { ExternalLink, BookOpen, ShieldCheck } from 'lucide-react';

interface SourceCardProps {
  sourceName: string;
  organization: string;
  canonicalUrl: string;
  publicationDate?: string;
  jurisdiction?: string;
  section?: string;
  excerpt?: string;
}

export const SourceCard: React.FC<SourceCardProps> = ({
  sourceName,
  organization,
  canonicalUrl,
  publicationDate,
  jurisdiction,
  section,
  excerpt,
}) => {
  return (
    <div className="bg-white border border-[#DCE5DC] rounded-3xl p-6 shadow-bento hover:shadow-bento-hover hover:border-[#1BC447]/40 transition-smooth space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center shrink-0 border border-[#DCE5DC]">
            <BookOpen className="w-5 h-5 text-[#1BC447]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1C2922] leading-snug">{sourceName}</h4>
            <p className="text-xs text-[#3D4A3B]">{organization}</p>
          </div>
        </div>
        <a
          href={canonicalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-[#EDF6ED] hover:bg-[#1BC447] text-[#153D2B] hover:text-[#1C2922] flex items-center justify-center transition-colors shrink-0"
          title="Open original publication"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        {jurisdiction && (
          <span className="bg-[#EDF6ED] text-[#153D2B] border border-[#DCE5DC] px-3 py-1 rounded-full font-bold">
            Jurisdiction: {jurisdiction}
          </span>
        )}
        {publicationDate && (
          <span className="bg-[#EDF6ED] text-[#3D4A3B] border border-[#DCE5DC] px-3 py-1 rounded-full font-medium">
            Published: {publicationDate}
          </span>
        )}
      </div>

      {section && (
        <div className="text-xs font-semibold text-[#1C2922]">
          Section: <span className="text-[#3D4A3B] font-normal">{section}</span>
        </div>
      )}

      {excerpt && (
        <p className="text-xs italic text-[#3D4A3B] bg-[#F3FCF3] p-3.5 rounded-2xl border border-[#DCE5DC]">
          "{excerpt}"
        </p>
      )}

      <div className="pt-2 border-t border-[#DCE5DC] flex items-center gap-2 text-[11px] text-[#153D2B] font-bold">
        <ShieldCheck className="w-4 h-4 text-[#1BC447]" />
        <span>Verified in FarmIQ Approved Agricultural Registry</span>
      </div>
    </div>
  );
};
