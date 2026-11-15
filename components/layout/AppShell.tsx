'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sprout,
  LayoutDashboard,
  Bot,
  TrendingUp,
  Calculator,
  Compass,
  ScanLine,
  CloudSun,
  Home,
  Settings,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Plus
} from 'lucide-react';
import { getStoredUserProfile, UserProfile, saveStoredUserProfile } from '@/lib/data/userState';
import { GoogleIcon } from '@/components/auth/GoogleAuth';

interface AppShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/assistant', label: 'AI Assistant', icon: Bot, badge: 'RAG' },
  { href: '/app/markets', label: 'Market Prices', icon: TrendingUp },
  { href: '/app/profit', label: 'Profit Calculator', icon: Calculator, badge: 'Tool' },
  { href: '/app/crop-advisor', label: 'Crop Advisor', icon: Compass },
  { href: '/app/crop-path', label: 'CropPath Tracker', icon: Sprout, badge: 'Live' },
  { href: '/app/disease', label: 'Disease Scanner', icon: ScanLine },
  { href: '/app/weather', label: 'Agro Weather', icon: CloudSun },
  { href: '/app/farms', label: 'Farms & Plots', icon: Home },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [farmDropdownOpen, setFarmDropdownOpen] = useState(false);

  useEffect(() => {
    const localProfile = getStoredUserProfile();
    setProfile(localProfile);

    // Sync server-side Google session if present
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          const user = data.user;
          const merged: UserProfile = {
            ...localProfile,
            displayName: user.name || localProfile.displayName || 'Farmer',
            email: user.email || localProfile.email,
            avatarUrl: user.picture || localProfile.avatarUrl,
            photoUrl: user.picture || localProfile.photoUrl,
            googleSub: user.sub || localProfile.googleSub,
            authProvider: 'google',
          };
          setProfile(merged);
          saveStoredUserProfile(merged);
        }
      })
      .catch(() => {});
  }, []);

  const activeFarm = profile?.farms.find((f) => f.id === profile.activeFarmId) || profile?.farms[0];

  const handleSelectFarm = (farmId: string) => {
    if (!profile) return;
    const updated = { ...profile, activeFarmId: farmId };
    setProfile(updated);
    saveStoredUserProfile(updated);
    setFarmDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F3FCF3] flex flex-col md:flex-row text-[#1C2922] font-sans antialiased">
      
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#153D2B] text-white border-b border-[#1C4D37] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-full bg-[#1C4D37] text-[#1BC447] hover:bg-[#1C4D37]/80"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/app" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1BC447] text-[#1C2922] flex items-center justify-center font-bold shadow-glow-lime">
              <Sprout className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg text-white">Farm<span className="text-[#1BC447]">IQ</span></span>
          </Link>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-[#EDF6ED] text-[#153D2B] font-bold border border-[#DCE5DC]">
            {profile?.preferences.preferredCurrency || 'USD'}
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#1BC447] animate-pulse" />
        </div>
      </div>

      {/* Desktop and Mobile Sidebar (Deep Forest Green Anchor #153D2B) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-[#153D2B] text-white flex flex-col justify-between border-r border-[#1C4D37] transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Brand Header */}
          <div className="p-5 border-b border-[#1C4D37] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-[#1BC447] text-[#1C2922] flex items-center justify-center shadow-glow-lime">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-2xl tracking-tight text-white">Farm<span className="text-[#1BC447]">IQ</span></span>
                <span className="block text-[10px] text-white/60 tracking-wider uppercase font-bold">Telemetry Control</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-white/70 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Farm Switcher in Sidebar (Farm selector pill: #153D2B text on #EDF6ED fill) */}
          <div className="p-4 border-b border-[#1C4D37]/80 relative">
            <div className="text-[11px] font-bold text-[#1BC447] uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Active Agricultural Holding</span>
              <span className="text-[10px] text-white/50">{profile?.farms.length || 0} registered</span>
            </div>
            <button
              onClick={() => setFarmDropdownOpen(!farmDropdownOpen)}
              className="w-full text-left bg-[#EDF6ED] hover:bg-white text-[#153D2B] rounded-2xl p-3 flex items-center justify-between transition-colors shadow-xs border border-[#DCE5DC]"
            >
              <div className="truncate">
                <p className="text-xs font-bold truncate text-[#153D2B]">{activeFarm?.name || 'No Farm Registered'}</p>
                <p className="text-[11px] text-[#3D4A3B] truncate font-medium">
                  {activeFarm ? `${activeFarm.region || activeFarm.country || 'Region'} • ${activeFarm.areaTotal} ${activeFarm.areaUnit}s` : 'Click to add a farm'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-[#153D2B] shrink-0 ml-1" />
            </button>

            {farmDropdownOpen && (
              <div className="animate-scale-in absolute top-full left-4 right-4 mt-1 bg-[#0E281C] border border-[#1BC447]/30 rounded-2xl shadow-floating z-50 p-2 space-y-1">
                {profile?.farms.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleSelectFarm(f.id)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      f.id === activeFarm?.id ? 'bg-[#1C4D37] text-[#1BC447] font-bold' : 'text-white/80 hover:bg-[#1C4D37]/50'
                    }`}
                  >
                    <span className="truncate">{f.name}</span>
                    {f.id === activeFarm?.id && <CheckCircle className="w-4 h-4 text-[#1BC447] shrink-0" />}
                  </button>
                ))}
                <Link
                  href="/app/farms"
                  onClick={() => setFarmDropdownOpen(false)}
                  className="w-full text-left p-2.5 rounded-xl text-xs font-bold text-[#1BC447] hover:bg-[#1C4D37] flex items-center gap-1.5 border-t border-[#1C4D37]/50 mt-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Manage All Holdings</span>
                </Link>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 stagger">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`animate-slide-left flex items-center justify-between px-4 py-3 rounded-full text-xs transition-smooth ${
                    isActive
                      ? 'bg-[#1BC447] text-[#1C2922] font-extrabold shadow-glow-lime'
                      : 'text-white/80 hover:bg-[#1C4D37]/70 hover:text-white font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#1C2922]' : 'text-[#1BC447]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isActive ? 'bg-[#153D2B] text-[#1BC447]' : 'bg-[#0E281C] text-[#1BC447] border border-[#1BC447]/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="animate-fade-in p-4 border-t border-[#1C4D37] bg-[#0E281C]/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-white/70">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#1BC447]" />
                <span>Verified RAG</span>
              </span>
              <span className="text-[10px] bg-[#1BC447]/20 text-[#1BC447] px-2 py-0.5 rounded-full font-mono font-bold">
                Telemetry v2.0
              </span>
            </div>
            <Link
              href="/"
              className="flex items-center justify-between text-xs text-white/70 hover:text-[#1BC447] transition-colors py-1 font-medium"
            >
              <span>Public Platform</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Main Content Area (Canvas Mint #F3FCF3) */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden bg-[#F3FCF3]">
        
        {/* Sticky Global Header & Command Bar */}
        <header className="hidden md:flex items-center justify-between h-20 px-8 bg-[#F3FCF3]/85 backdrop-blur-md border-b border-[#DCE5DC] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-[#153D2B]">
              {NAV_ITEMS.find((n) => n.href === pathname)?.label || 'Farmer Workspace'}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-[#153D2B] font-bold bg-[#EDF6ED] px-3.5 py-1.5 rounded-full border border-[#DCE5DC]">
              <span>Holding:</span>
              <span className="font-extrabold">{activeFarm?.name}</span>
              <span className="text-[11px] text-[#3D4A3B]">({activeFarm?.country})</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live telemetry indicator (pulsing #1BC447 dot) */}
            <div className="flex items-center gap-2 text-xs font-bold text-[#153D2B] bg-[#EDF6ED] px-3.5 py-1.5 rounded-full border border-[#DCE5DC]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1BC447] animate-pulse" />
              <span>Telemetry Active • Precision Sync</span>
            </div>

            {/* Currency switcher pill */}
            <div className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-white border border-[#DCE5DC] text-[#1C2922]">
              Currency: <span className="text-[#153D2B] font-extrabold">{profile?.preferences.preferredCurrency || 'USD'}</span>
            </div>

            {/* User profile avatar */}
            <Link href="/app/settings" className="flex items-center gap-2 pl-3 border-l border-[#DCE5DC] hover:opacity-85 transition-opacity">
              <div className={`w-9 h-9 rounded-full font-extrabold text-xs flex items-center justify-center border shadow-sm overflow-hidden ${
                profile?.authProvider === 'google'
                  ? 'bg-white border-[#DCE5DC] text-[#4285F4]'
                  : 'bg-[#153D2B] text-[#1BC447] border-[#1C4D37]'
              }`}>
                {profile?.avatarUrl || profile?.photoUrl ? (
                  <img
                    src={profile.avatarUrl || profile.photoUrl}
                    alt={profile.displayName || 'Google Profile'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : profile?.authProvider === 'google' ? (
                  <GoogleIcon className="w-5 h-5" />
                ) : (
                  profile?.displayName?.charAt(0) || 'F'
                )}
              </div>
              <div className="text-left text-xs">
                <p className="font-extrabold text-[#1C2922] leading-none">{profile?.displayName || 'Farmer'}</p>
                <p className="text-[10px] text-[#3D4A3B] font-semibold leading-tight">
                  {profile?.authProvider === 'google' ? 'Google Account' : (profile?.email ? 'Verified Email' : 'Operator Level 1')}
                </p>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

    </div>
  );
};
