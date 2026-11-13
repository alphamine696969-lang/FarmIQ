'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FreshnessBadge } from '@/components/ui/Badge';
import {
  getStoredUserProfile,
  saveStoredUserProfile,
  UserProfile,
  INITIAL_USER_PROFILE
} from '@/lib/data/userState';
import {
  Settings,
  Globe2,
  DollarSign,
  Bell,
  Download,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setProfile(getStoredUserProfile());
  }, []);

  const handleUpdate = (updates: Partial<UserProfile['preferences']>) => {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      preferences: {
        ...profile.preferences,
        ...updates,
      },
    };
    setProfile(updated);
    saveStoredUserProfile(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportData = () => {
    if (!profile) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `farmiq_workspace_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetData = () => {
    if (confirm("Reset all farm profiles and scenarios to default verified demonstration state?")) {
      setProfile(INITIAL_USER_PROFILE);
      saveStoredUserProfile(INITIAL_USER_PROFILE);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-7 rounded-3xl border border-[#DCE5DC] shadow-bento">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-[#1C2922]">Settings & Agricultural Preferences</h2>
              <FreshnessBadge status="supported" label="Saved Locally" />
            </div>
            <p className="text-xs text-[#3D4A3B] mt-1 font-medium">
              Configure units of measurement, primary accounting currency, and notification thresholds.
            </p>
          </div>
          {saveSuccess && (
            <span className="text-xs font-bold text-[#153D2B] bg-[#EDF6ED] px-4 py-2 rounded-full border border-[#DCE5DC] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1BC447]" />
              <span>Preferences Saved</span>
            </span>
          )}
        </div>

        {/* Units & Currency Bento Card */}
        <div className="bg-white rounded-3xl border border-[#DCE5DC] p-7 shadow-bento space-y-6">
          <h3 className="text-base font-extrabold text-[#1C2922] flex items-center gap-2.5 border-b border-[#DCE5DC] pb-3.5">
            <div className="w-8 h-8 rounded-xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
              <Globe2 className="w-4 h-4 text-[#1BC447]" />
            </div>
            <span>Localization & Agronomic Units</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-bold text-[#3D4A3B] mb-1.5">Measurement System</label>
              <select
                value={profile?.preferences.measurementSystem || 'metric'}
                onChange={(e) => handleUpdate({ measurementSystem: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3] font-medium"
              >
                <option value="metric">Metric (Hectares, Metric Tonnes, kg, mm)</option>
                <option value="imperial">Imperial (Acres, Bushels, Pounds, Inches)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#3D4A3B] mb-1.5">Accounting Currency</label>
              <select
                value={profile?.preferences.preferredCurrency || 'USD'}
                onChange={(e) => handleUpdate({ preferredCurrency: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3] font-bold"
              >
                <option value="USD">USD ($) — United States Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="INR">INR (₹) — Indian Rupee</option>
                <option value="KES">KES (KSh) — Kenyan Shilling</option>
                <option value="BRL">BRL (R$) — Brazilian Real</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications & Alert Thresholds Bento Card */}
        <div className="bg-white rounded-3xl border border-[#DCE5DC] p-7 shadow-bento space-y-6">
          <h3 className="text-base font-extrabold text-[#1C2922] flex items-center gap-2.5 border-b border-[#DCE5DC] pb-3.5">
            <div className="w-8 h-8 rounded-xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
              <Bell className="w-4 h-4 text-[#1BC447]" />
            </div>
            <span>Agro-Alert Subscriptions</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            <label className="flex items-center justify-between p-4 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] cursor-pointer hover:bg-white transition-colors">
              <div>
                <p className="font-extrabold text-[#1C2922]">Frost & Temperature Extremes Alerts</p>
                <p className="text-[#3D4A3B] text-[11px] font-medium">Notify when overnight valley temperatures drop below 3°C.</p>
              </div>
              <input
                type="checkbox"
                checked={profile?.preferences.frostAlerts ?? true}
                onChange={(e) => handleUpdate({ frostAlerts: e.target.checked })}
                className="w-5 h-5 accent-[#1BC447] rounded-full cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl bg-[#F3FCF3] border border-[#DCE5DC] cursor-pointer hover:bg-white transition-colors">
              <div>
                <p className="font-extrabold text-[#1C2922]">Market Price Volatility Notifications</p>
                <p className="text-[#3D4A3B] text-[11px] font-medium">Daily summary when monitored crops move ±2.5% in terminal markets.</p>
              </div>
              <input
                type="checkbox"
                checked={profile?.preferences.marketPriceAlerts ?? true}
                onChange={(e) => handleUpdate({ marketPriceAlerts: e.target.checked })}
                className="w-5 h-5 accent-[#1BC447] rounded-full cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Data Governance & Export Bento Card */}
        <div className="bg-white rounded-3xl border border-[#DCE5DC] p-7 shadow-bento space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-[#1C2922] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#1BC447]" />
              <span>Data Governance & Backup Portability</span>
            </h3>
            <p className="text-xs text-[#3D4A3B] font-medium">
              Export your farm records in open JSON format or reset to default demo scenario state.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={handleExportData}
              className="px-6 py-3 rounded-full border border-[#DCE5DC] hover:bg-[#EDF6ED] text-xs font-bold text-[#1C2922] flex items-center gap-2 transition-smooth shadow-xs"
            >
              <Download className="w-4 h-4 text-[#1BC447]" />
              <span>Export Farm Workspace (JSON)</span>
            </button>

            <button
              onClick={handleResetData}
              className="px-6 py-3 rounded-full border border-[#DCE5DC] hover:bg-rose-50 text-xs font-bold text-[#BA1A1A] flex items-center gap-2 transition-smooth shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Sample State</span>
            </button>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
