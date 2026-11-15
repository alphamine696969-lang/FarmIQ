'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Globe2, ArrowRight, ShieldCheck } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/GoogleAuth';
import { getStoredUserProfile, saveStoredUserProfile, UserProfile } from '@/lib/data/userState';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('United States');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Save new user profile locally
    const existing = getStoredUserProfile();
    const updated: UserProfile = {
      ...existing,
      displayName: name.trim() || 'Farm Owner',
      email: email.trim(),
      country: country,
      authProvider: 'email',
    };
    saveStoredUserProfile(updated);

    setTimeout(() => {
      router.push('/app');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F5FBEF] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-block group">
          <img
            src="/brand/logo.png"
            alt="FarmIQ"
            className="h-16 w-auto mx-auto object-contain group-hover:scale-105 transition-transform"
          />
        </Link>
        <h2 className="text-2xl font-extrabold text-[#0B4D2E] font-poppins">Create your FarmIQ Account</h2>
        <p className="text-xs text-[#3D4A3B]">Start tracking economics, market prices, and evidence-grounded agronomy.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-bento rounded-3xl border border-[#DCE5DC] space-y-6">
          
          {/* Google Account Authentication */}
          <div className="space-y-3">
            <GoogleSignInButton label="Sign up with Google" />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#DCE5DC]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-white px-3 text-[#3D4A3B] font-bold text-[10px]">Or register with email</span>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1C2922] uppercase tracking-wider mb-1.5">
                Full Name or Farm Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maria Gonzalez or Sunset Ridge Farms"
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCE5DC] bg-[#F3FCF3]/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1BC447] focus:border-[#1BC447] text-[#1C2922] transition-all"
                />
                <User className="w-4 h-4 text-[#3D4A3B]/60 absolute right-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C2922] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@domain.com"
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCE5DC] bg-[#F3FCF3]/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1BC447] focus:border-[#1BC447] text-[#1C2922] transition-all"
                />
                <Mail className="w-4 h-4 text-[#3D4A3B]/60 absolute right-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C2922] uppercase tracking-wider mb-1.5">
                Country / Agricultural Jurisdiction
              </label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCE5DC] bg-[#F3FCF3]/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1BC447] focus:border-[#1BC447] text-[#1C2922] transition-all cursor-pointer"
                >
                  <option value="United States">United States (USDA Benchmarks)</option>
                  <option value="India">India (APMC & ICAR Advisory)</option>
                  <option value="European Union">European Union (EU CAP / Agrimonitor)</option>
                  <option value="Brazil">Brazil (CEPEA / Conab)</option>
                  <option value="Kenya">Kenya (KALRO / EAGC)</option>
                  <option value="Canada">Canada (AAFC Standards)</option>
                  <option value="Australia">Australia (ABARES Guidance)</option>
                </select>
                <Globe2 className="w-4 h-4 text-[#3D4A3B]/60 absolute right-4 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C2922] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create secure password"
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCE5DC] bg-[#F3FCF3]/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1BC447] focus:border-[#1BC447] text-[#1C2922] transition-all"
                />
                <Lock className="w-4 h-4 text-[#3D4A3B]/60 absolute right-4 top-3.5" />
              </div>
            </div>

            <div className="text-xs text-[#3D4A3B] leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-[#153D2B] font-bold hover:text-[#1BC447] underline transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-[#153D2B] font-bold hover:text-[#1BC447] underline transition-colors">
                Privacy Policy
              </Link>.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-full bg-[#1BC447] hover:brightness-105 text-[#1C2922] font-extrabold text-sm shadow-glow-lime transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Creating Farm Profile...' : 'Complete Registration'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-[#3D4A3B]">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#153D2B] hover:text-[#1BC447] underline transition-colors">
              Sign In
            </Link>
          </div>

          <div className="pt-3 border-t border-[#DCE5DC] flex items-center justify-center gap-1.5 text-[11px] text-[#3D4A3B]">
            <ShieldCheck className="w-4 h-4 text-[#1BC447]" />
            <span>Private & Encrypted Farmer Data</span>
          </div>
        </div>
      </div>
    </div>
  );
}
