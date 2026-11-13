import React from 'react';
import { CheckCircle2, AlertCircle, Clock, Database, ShieldCheck, Check } from 'lucide-react';

interface FreshnessBadgeProps {
  status: 'live' | 'sample-historical' | 'cached' | 'supported' | 'partial' | 'insufficient';
  label?: string;
  className?: string;
}

export const FreshnessBadge: React.FC<FreshnessBadgeProps> = ({ status, label, className = '' }) => {
  switch (status) {
    case 'live':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-tight bg-[#EDF6ED] text-[#153D2B] border border-[#DCE5DC] ${className}`}>
          <span className="w-2 h-2 rounded-full bg-[#1BC447] animate-pulse" />
          {label || 'Operational / Live'}
        </span>
      );
    case 'sample-historical':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-tight bg-[#FFF6EB] text-[#895100] border border-[#FFE0B2] ${className}`}>
          <span className="w-2 h-2 rounded-full bg-[#FD9D1A]" />
          {label || 'Sample Data (ADR-005)'}
        </span>
      );
    case 'cached':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-tight bg-[#EDF7FF] text-[#004263] border border-[#BEE3F8] ${className}`}>
          <span className="w-2 h-2 rounded-full bg-[#33B3FC]" />
          {label || 'Cached Telemetry'}
        </span>
      );
    case 'supported':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-tight bg-[#EDF6ED] text-[#153D2B] border border-[#DCE5DC] ${className}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-[#1BC447]" />
          {label || 'Evidence Grounded'}
        </span>
      );
    case 'partial':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-tight bg-[#EDF7FF] text-[#004263] border border-[#BEE3F8] ${className}`}>
          <span className="w-2 h-2 rounded-full bg-[#33B3FC]" />
          {label || 'Partial Evidence'}
        </span>
      );
    case 'insufficient':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-tight bg-[#FDF2F2] text-[#BA1A1A] border border-[#FCDAD7] ${className}`}>
          <span className="w-2 h-2 rounded-full bg-[#BA1A1A]" />
          {label || 'Evidence Insufficient (Abstained)'}
        </span>
      );
    default:
      return null;
  }
};

interface TrustBadgeProps {
  label: string;
  className?: string;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ label, className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-tight bg-white text-[#153D2B] border border-[#153D2B] shadow-xs ${className}`}>
      <Check className="w-3.5 h-3.5 text-[#1BC447]" />
      <span>{label}</span>
    </span>
  );
};
