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
  Lock,
  User,
  Play,
  LogOut
} from 'lucide-react';
import { GoogleIcon, GoogleSignInButton } from '@/components/auth/GoogleAuth';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const user = getStoredUserProfile();
    setProfile(user);
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setCountry(user.country || '');
    }
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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      displayName: displayName.trim() || 'Farmer',
      email: email.trim(),
      country: country.trim(),
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
    if (confirm("Clear all local farm profiles, plots, and scenarios to start with a fresh clean workspace?")) {
      setProfile(INITIAL_USER_PROFILE);
      setDisplayName('');
      setEmail('');
      setCountry('');
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
              <h2 className="text-xl font-extrabold text-[#1C2922]">Workspace Settings</h2>
            </div>
            <p className="text-xs text-[#3D4A3B] mt-1 font-medium">
              Configure your profile identity, units of measurement, primary accounting currency, and notification thresholds.
            </p>
          </div>
          {saveSuccess && (
            <span className="text-xs font-bold text-[#153D2B] bg-[#EDF6ED] px-4 py-2 rounded-full border border-[#DCE5DC] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1BC447]" />
              <span>Preferences Saved</span>
            </span>
          )}
        </div>

        {/* Profile Identity Bento Card */}
        <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-[#DCE5DC] p-7 shadow-bento space-y-6">
          <h3 className="text-base font-extrabold text-[#1C2922] flex items-center gap-2.5 border-b border-[#DCE5DC] pb-3.5">
            <div className="w-8 h-8 rounded-xl bg-[#EDF6ED] text-[#153D2B] flex items-center justify-center border border-[#DCE5DC]">
              <User className="w-4 h-4 text-[#1BC447]" />
            </div>
            <span>Farmer Profile & Identity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#3D4A3B] mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. John Doe or Green Farm"
                className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3] font-medium focus:outline-none focus:ring-2 focus:ring-[#1BC447]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#3D4A3B] mb-1.5">Contact Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. farmer@example.com"
                className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3] font-medium focus:outline-none focus:ring-2 focus:ring-[#1BC447]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#3D4A3B] mb-1.5">Primary Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. United States, India, France"
                className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE5DC] text-[#1C2922] bg-[#F3FCF3] font-medium focus:outline-none focus:ring-2 focus:ring-[#1BC447]"
              />
            </div>
          </div>

          {/* Google Account Authentication Status */}
          {profile?.authProvider === 'google' ? (
            <div className="p-4 bg-[#EDF6ED] border border-[#DCE5DC] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                {profile.avatarUrl || profile.photoUrl ? (
                  <img
                    src={profile.avatarUrl || profile.photoUrl}
                    alt={profile.displayName}
                    className="w-10 h-10 rounded-full border border-[#DCE5DC] object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white border border-[#DCE5DC] flex items-center justify-center">
                    <GoogleIcon className="w-5 h-5 shrink-0" />
                  </div>
                )}
                <div>
                  <p className="font-extrabold text-[#1C2922]">Connected with Google Account</p>
                  <p className="text-[11px] text-[#3D4A3B]">{profile.email || email}</p>
                  {profile.googleSub && (
                    <p className="text-[10px] text-[#3D4A3B]/60 font-mono">Google ID: {profile.googleSub}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!profile) return;
                  await fetch('/api/auth/me', { method: 'DELETE' }).catch(() => {});
                  const updated: UserProfile = { ...profile, authProvider: undefined, avatarUrl: undefined, photoUrl: undefined, googleSub: undefined };
                  setProfile(updated);
                  saveStoredUserProfile(updated);
                  setSaveSuccess(true);
                }}
                className="px-4 py-2 rounded-full border border-[#DCE5DC] bg-white hover:bg-rose-50 text-[11px] font-bold text-[#BA1A1A] transition-colors self-start sm:self-auto cursor-pointer"
              >
                Disconnect Google
              </button>
            </div>
          ) : (
            <div className="p-4 bg-[#F3FCF3] border border-[#DCE5DC] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <GoogleIcon className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-extrabold text-[#1C2922]">Link Google Account</p>
                  <p className="text-[11px] text-[#3D4A3B]">Connect for instant one-click authentication and verified profile sync.</p>
                </div>
              </div>
              <div className="w-full sm:w-auto shrink-0">
                <GoogleSignInButton
                  label="Connect Google"
                  className="py-2.5 px-4 text-xs font-bold"
                  onSuccess={() => {
                    const user = getStoredUserProfile();
                    setProfile(user);
                    if (user) {
                      setDisplayName(user.displayName);
                      setEmail(user.email);
                    }
                    setSaveSuccess(true);
                  }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-full bg-[#1BC447] hover:bg-[#16a73c] text-[#1C2922] font-extrabold text-xs shadow-glow-lime transition-smooth"
          >
            Save Profile Details
          </button>
        </form>

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
              Export your farm records in open JSON format or reset your workspace to a clean initial state.
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
              type="button"
              onClick={() => {
                try { sessionStorage.removeItem('farmiq_splash_viewed'); } catch {}
                window.location.href = '/?splash=1';
              }}
              className="px-6 py-3 rounded-full border border-[#DCE5DC] hover:bg-[#EDF6ED] text-xs font-bold text-[#153D2B] flex items-center gap-2 transition-smooth shadow-xs"
            >
              <Play className="w-4 h-4 text-[#1BC447]" />
              <span>Replay Splash Screen</span>
            </button>

            <button
              onClick={handleResetData}
              className="px-6 py-3 rounded-full border border-[#DCE5DC] hover:bg-rose-50 text-xs font-bold text-[#BA1A1A] flex items-center gap-2 transition-smooth shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear Workspace & Start Clean</span>
            </button>

            <button
              type="button"
              onClick={() => {
                router.push('/login');
              }}
              className="px-6 py-3 rounded-full border border-[#DCE5DC] hover:bg-[#F3FCF3] text-xs font-bold text-[#1C2922] flex items-center gap-2 transition-smooth shadow-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-[#3D4A3B]" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
